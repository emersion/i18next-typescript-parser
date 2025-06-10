import { dirname } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import * as ts from 'typescript';

/**
 * An i18n syntax error, with file and line position.
 */
class I18nSyntaxError extends Error {
  constructor(file: ts.SourceFile, node: ts.Node, msg: string) {
    const pos = file.getLineAndCharacterOfPosition(node.pos);
    super(`${file.fileName}:${pos.line + 1}: ${msg}`);
  }
}

export type Key = {
  namespace: string;
  key: string;

  // Filename and line number the extracted translation key comes from
  sourceFilename: string;
  sourceLine: number;

  // Parameter names passed in
  params: Set<string>;
};

function parseKey(namespace: string, prefix: string | null, key: string) {
  // If the key includes a namespace, it overrides the default one
  const i = key.indexOf(':');
  if (i >= 0) {
    return {
      namespace: key.substring(0, i),
      key: key.substring(i + 1),
    };
  }

  if (prefix) {
    key = prefix + '.' + key;
  }
  return { namespace, key};
}

function keyToString({ namespace, key }: { namespace: string, key: string }) {
  return namespace + ':' + key;
}

/**
 * Check whether a function call invokes a translation function, record the
 * translation key if so.
 */
function visitCallExpression(
  checker: ts.TypeChecker,
  extractedKeys: Map<string, Key>,
  file: ts.SourceFile,
  node: ts.CallExpression
) {
  const symbol = checker.getSymbolAtLocation(node.expression);
  if (!symbol) {
    return;
  }

  // Check whether a TFunction is being called
  const type = checker.getTypeOfSymbolAtLocation(symbol, node.expression);
  if (type.symbol?.escapedName !== 'TFunction') {
    return;
  }
  const typeArgs = checker.getTypeArguments(type as ts.TypeReference);

  // TFunction has two generic type arguments: namespace and key prefix
  if (typeArgs.length !== 2) {
    throw new I18nSyntaxError(file, node, 'expected two generic type arguments for TFunction');
  }
  if (node.arguments.length < 1) {
    throw new I18nSyntaxError(file, node, 'expected at least one argument for TFunction');
  }

  const namespaceType = typeArgs[0]!;
  const prefixType = typeArgs[1]!;

  // Extract the default namespace from the first generic type argument
  let defaultNamespace;
  if (namespaceType.isStringLiteral()) {
    defaultNamespace = namespaceType.value;
  } else if (checker.isTupleType(namespaceType)) {
    const namespaceTypeArgs = checker.getTypeArguments(namespaceType as ts.TypeReference);
    if (!namespaceTypeArgs[0]!.isStringLiteral()) {
      return;
    }
    defaultNamespace = namespaceTypeArgs[0]!.value;
  } else {
    return;
  }

  // Extract the key prefix from the second generic type argument
  let prefix;
  if (prefixType.isStringLiteral()) {
    prefix = prefixType.value;
  } else if (prefixType === checker.getUndefinedType()) {
    prefix = null;
  } else {
    return;
  }

  // TFunction has between 1 and 3 function arguments: key, default value, and
  // options
  if (node.arguments.length < 1 || node.arguments.length > 3) {
    throw new I18nSyntaxError(file, node, 'expected between 1 and 3 function arguments for TFunction');
  }

  const keyNode = node.arguments[0]!;
  const optionsNode = node.arguments.length > 1 ? node.arguments.at(-1) : undefined;

  // Extract key(s) from the first function argument
  let keys;
  if (ts.isStringLiteral(keyNode) || ts.isNoSubstitutionTemplateLiteral(keyNode)) {
    keys = [keyNode.text];
  } else {
    const keyType = checker.getTypeAtLocation(keyNode);
    if (!keyType.isUnion()) {
      return;
    }

    keys = [];
    for (const t of keyType.types) {
      if (!t.isStringLiteral()) {
        return;
      }
      keys.push(t.value);
    }
  }

  // Extract parameters and the default namespace from the options in the last
  // function argument
  let params = new Set<string>();
  if (optionsNode && ts.isObjectLiteralExpression(optionsNode)) {
    const optionsType = checker.getTypeAtLocation(optionsNode);
    const nsSymbol = optionsType.symbol.members?.get(ts.escapeLeadingUnderscores('ns'));
    if (
      nsSymbol &&
      nsSymbol.valueDeclaration &&
      ts.isPropertyAssignment(nsSymbol.valueDeclaration) &&
      ts.isStringLiteral(nsSymbol.valueDeclaration.initializer)
    ) {
      defaultNamespace = nsSymbol.valueDeclaration.initializer.text;
    }

    if (optionsType.symbol.members) {
      const identifiers = [...optionsType.symbol.members.keys()];
      params = new Set(identifiers.map(ts.unescapeLeadingUnderscores));
    }
  }

  const pos = file.getLineAndCharacterOfPosition(node.pos);
  for (const key of keys) {
    const keyMetadata = {
      ...parseKey(defaultNamespace, prefix, key),
      sourceFilename: file.fileName,
      sourceLine: pos.line + 1,
      params,
    };
    extractedKeys.set(keyToString(keyMetadata), keyMetadata);
  }
}

/**
 * Recursively collect translation function calls inside a TypeScript AST node.
 */
function visitNode(
  checker: ts.TypeChecker,
  extractedKeys: Map<string, Key>,
  file: ts.SourceFile,
  node: ts.Node
) {
  if (ts.isCallExpression(node)) {
    visitCallExpression(checker, extractedKeys, file, node);
  }

  node.forEachChild((child) => visitNode(checker, extractedKeys, file, child));
}

/**
 * Options for extracting i18n translation keys from a TypeScript project.
 */
export type ExtractKeysOptions = {
  /**
   * Optional path to the `tsconfig.json` file or directory to use for TypeScript project configuration.
   */
  tsconfigPath?: string | URL;
}

/**
 * Extracts i18n translation keys from a TypeScript project.
 *
 * This function scans the TypeScript project specified by the given options (or the current working directory by default),
 * analyzes the source files, and collects all translation keys used with the TFunction type.
 *
 * @param options - Configuration options for extracting translation keys, including an optional path to the `tsconfig.json`.
 * @returns An array of extracted translation key metadata, including namespace, key, source filename, and source line.
 * @throws If the `tsconfig.json` file cannot be found.
 */
export function extractKeys(options: ExtractKeysOptions = {}): Key[] {
  let searchPath: string;
  if (options.tsconfigPath && options.tsconfigPath instanceof URL) {
    searchPath = fileURLToPath(options.tsconfigPath);
  } else if (options.tsconfigPath) {
    searchPath = options.tsconfigPath.toString();
  } else {
    searchPath = process.cwd();
  }

  const tsconfigPath = ts.findConfigFile(searchPath, ts.sys.fileExists, 'tsconfig.json');
  if (!tsconfigPath) {
    throw new Error('Failed to find tsconfig.json');
  }
  const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const tsconfig = ts.parseJsonConfigFileContent(
    tsconfigFile.config,
    ts.sys,
    dirname(tsconfigPath)
  );

  const program = ts.createProgram({
    options: tsconfig.options,
    rootNames: tsconfig.fileNames,
    projectReferences: tsconfig.projectReferences!,
  });
  const checker = program.getTypeChecker();

  const files = program.getSourceFiles();
  const extractedKeys = new Map<string, Key>();
  for (const file of files) {
    visitNode(checker, extractedKeys, file, file);
  }

  return [...extractedKeys.values()];
}
