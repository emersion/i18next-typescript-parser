import path from 'node:path';

import * as ts from 'typescript';

class I18nSyntaxError extends Error {
  constructor(file: ts.SourceFile, node: ts.Node, msg: string) {
    const pos = file.getLineAndCharacterOfPosition(node.pos);
    super(`${file.fileName}:${pos.line + 1}: ${msg}`);
  }
}

type Key = {
  namespace: string;
  key: string;
};

function parseKey(namespace: string, prefix: string | null, key: string): Key {
  const i = key.indexOf(':');
  if (i >= 0) {
    return {
      namespace: key.substring(0, i),
      key: key.substring(i + 1),
    };
  };

  if (prefix) {
    key = prefix + '.' + key;
  }
  return { namespace, key};
}

function keyToString({ namespace, key }: { namespace: string, key: string }) {
  return namespace + ':' + key;
}

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

  const type = checker.getTypeOfSymbolAtLocation(symbol, node.expression);
  if (type.symbol?.escapedName !== 'TFunction') {
    return;
  }
  const typeArgs = checker.getTypeArguments(type as ts.TypeReference);

  if (typeArgs.length !== 2) {
    throw new I18nSyntaxError(file, node, 'expected two generic type arguments for TFunction');
  }
  if (node.arguments.length < 1) {
    throw new I18nSyntaxError(file, node, 'expected at least one argument for TFunction');
  }

  const namespaceType = typeArgs[0]!;
  const prefixType = typeArgs[1]!;

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

  let prefix;
  if (prefixType.isStringLiteral()) {
    prefix = prefixType.value;
  } else if (prefixType === checker.getUndefinedType()) {
    prefix = null;
  } else {
    return;
  }

  const keyNode = node.arguments[0]!;
  if (!ts.isStringLiteral(keyNode)) {
    return;
  }
  let key = keyNode.text;

  const optionsNode = node.arguments[1];
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
  }

  const keyMetadata = parseKey(defaultNamespace, prefix, key.replace(/_(zero|one|other|many)$/, ''));
  extractedKeys.set(keyToString(keyMetadata), keyMetadata);
}

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

export function extractKeys() {
  const tsconfigPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
  if (!tsconfigPath) {
    throw new Error('Failed to find tsconfig.json');
  }
  const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const tsconfig = ts.parseJsonConfigFileContent(
    tsconfigFile.config,
    ts.sys,
    path.dirname(tsconfigPath)
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
