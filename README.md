# i18next-typescript-parser

Extract [i18next] keys from a TypeScript codebase.

Unlike [i18next-parser], this package operates on a typed syntax tree rather
than lexer tokens. As a result, it's more reliable and precise.

## Installation

    npm install --save-dev i18next-typescript-parser

## Usage

```ts
import { extractKeys } from 'i18next-typescript-parser';

const keys = extractKeys();
for (const { namespace, key } of keys) {
  console.log(namespace, key);
}
```

## License

MIT

[i18next]: https://www.i18next.com/
[i18next-parser]: https://github.com/i18next/i18next-parser
