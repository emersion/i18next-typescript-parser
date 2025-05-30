import assert from 'node:assert/strict';
import process from 'node:process';

import { extractKeys } from '../index.ts';

const expected = [
  { namespace: 'translation', key: 'simple' },
  { namespace: 'translation', key: 'withNoopOptions' },
  { namespace: 'foo', key: 'withNsOptions' },
  { namespace: 'translation', key: 'withDefaultValue' },
  { namespace: 'translation', key: 'withDefaultValueAndNoopOptions' },
  { namespace: 'foo', key: 'withDefaultValueAndNsOptions' },
  { namespace: 'foo', key: 'overrideNs' },

  { namespace: 'custom', key: 'bar.simple' },
  { namespace: 'customFoo', key: 'bar.withNsOptions' },
  { namespace: 'customFoo', key: 'overrideNs' },

  { namespace: 'multipleNs', key: 'simple' },
  { namespace: 'multipleNsFoo', key: 'withNsOptions' },
  { namespace: 'multipleNsFoo', key: 'overrideNs' }
];

process.chdir('test/basic');
const keys = extractKeys().map(({ namespace, key }) => ({ namespace, key }));

assert.deepStrictEqual(keys, expected);
