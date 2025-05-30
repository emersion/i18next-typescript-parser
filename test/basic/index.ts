import { t, getFixedT } from 'i18next';

t('simple');
t('withNoopOptions', { defaultValue: 'asdf' });
t('withNsOptions', { ns: 'foo' });
t('withDefaultValue', 'asdf');
t('withDefaultValueAndNoopOptions', 'asdf', { count: 42 });
t('withDefaultValueAndNsOptions', 'asdf', { ns: 'foo' });
t('foo:overrideNs');

const customT = getFixedT(null, 'custom', 'bar');
customT('simple');
customT('withNsOptions', { ns: 'customFoo' });
customT('customFoo:overrideNs');

const multipleNsT = getFixedT(null, ['multipleNs', 'multipleNsFoo'] as const);
multipleNsT('simple');
multipleNsT('withNsOptions', { ns: 'multipleNsFoo' });
multipleNsT('multipleNsFoo:overrideNs');
