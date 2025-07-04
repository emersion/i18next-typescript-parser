import assert from 'node:assert/strict';

import { extractKeys } from '../index.ts';

const expected = [
  { namespace: 'translation', key: 'simple' },
  { namespace: 'translation', key: 'withNoopOptions' },
  { namespace: 'foo', key: 'withNsOptions' },
  { namespace: 'translation', key: 'withDefaultValue' },
  { namespace: 'translation', key: 'withDefaultValueAndNoopOptions' },
  { namespace: 'foo', key: 'withDefaultValueAndNsOptions' },
  { namespace: 'foo', key: 'overrideNs' },
  { namespace: 'translation', key: 'templateWithoutSubstitution' },

  { namespace: 'custom', key: 'bar.simple' },
  { namespace: 'customFoo', key: 'bar.withNsOptions' },
  { namespace: 'customFoo', key: 'overrideNs' },
  { namespace: 'customFoo', key: 'baz.withNsAndKeyPrefixOptions' },

  { namespace: 'multipleNs', key: 'simple' },
  { namespace: 'multipleNsFoo', key: 'withNsOptions' },
  { namespace: 'multipleNsFoo', key: 'overrideNs' },

  { namespace: 'translation', key: 'union.bar' },
  { namespace: 'translation', key: 'union.baz' },
  { namespace: 'translation', key: 'unionTemplate.h.asdf' },
  { namespace: 'translation', key: 'unionTemplate.i.asdf' },
  { namespace: 'translation', key: 'twoUnionTemplate.h.and.h' },
  { namespace: 'translation', key: 'twoUnionTemplate.h.and.i' },
  { namespace: 'translation', key: 'twoUnionTemplate.i.and.h' },
  { namespace: 'translation', key: 'twoUnionTemplate.i.and.i' },
  { namespace: 'custom', key: 'bar.unionWithPrefix.h' },
  { namespace: 'custom', key: 'bar.unionWithPrefix.i' },
  { namespace: 'customFoo', key: 'unionWithOverrideNs.h' },
  { namespace: 'customFoo', key: 'unionWithOverrideNs.i' },
  { namespace: 'translation', key: 'ternary.bar' },
  { namespace: 'translation', key: 'ternary.baz' },
];

const keys = extractKeys({
  tsconfigPath: new URL(import.meta.resolve('./basic')),
}).map(({ namespace, key }) => ({ namespace, key }));

assert.deepStrictEqual(keys, expected);
