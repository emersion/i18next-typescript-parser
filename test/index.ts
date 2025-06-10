import assert from 'node:assert/strict';

import { extractKeys } from '../index.ts';

const expected = [
  { namespace: 'translation', key: 'simple' },
  { namespace: 'translation', key: 'withParams', params: new Set(['foo', 'bar']) },
  { namespace: 'translation', key: 'withNoopOptions', params: new Set(['defaultValue']) },
  { namespace: 'foo', key: 'withNsOptions', params: new Set(['ns']) },
  { namespace: 'translation', key: 'withDefaultValue' },
  { namespace: 'translation', key: 'withDefaultValueAndNoopOptions', params: new Set(['count']) },
  { namespace: 'foo', key: 'withDefaultValueAndNsOptions', params: new Set(['ns']) },
  { namespace: 'foo', key: 'overrideNs' },
  { namespace: 'translation', key: 'templateWithoutSubstitution' },

  { namespace: 'custom', key: 'bar.simple' },
  { namespace: 'customFoo', key: 'bar.withNsOptions', params: new Set(['ns']) },
  { namespace: 'customFoo', key: 'overrideNs' },
  { namespace: 'customFoo', key: 'baz.withNsAndKeyPrefixOptions', params: new Set(['keyPrefix', 'ns']) },

  { namespace: 'multipleNs', key: 'simple' },
  { namespace: 'multipleNsFoo', key: 'withNsOptions', params: new Set(['ns']) },
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
}).map(({ namespace, key, params }) => ({
  namespace,
  key,
  ...(params.size > 0 && { params }),
}));

assert.deepStrictEqual(keys, expected);
