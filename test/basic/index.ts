import { t, getFixedT } from 'i18next';

t('simple');
t('withNoopOptions', { defaultValue: 'asdf' });
t('withNsOptions', { ns: 'foo' });
t('withDefaultValue', 'asdf');
t('withDefaultValueAndNoopOptions', 'asdf', { count: 42 });
t('withDefaultValueAndNsOptions', 'asdf', { ns: 'foo' });
t('foo:overrideNs');
t(`templateWithoutSubstitution`);

const customT = getFixedT(null, 'custom', 'bar');
customT('simple');
customT('withNsOptions', { ns: 'customFoo' });
customT('customFoo:overrideNs');
customT('withNsAndKeyPrefixOptions', { ns: 'customFoo', keyPrefix: 'baz' });

const multipleNsT = getFixedT(null, ['multipleNs', 'multipleNsFoo'] as const);
multipleNsT('simple');
multipleNsT('withNsOptions', { ns: 'multipleNsFoo' });
multipleNsT('multipleNsFoo:overrideNs');

const keyUnion: 'union.bar' | 'union.baz' = Math.random() > 0.5 ? 'union.bar' : 'union.baz';
t(keyUnion);
const getChoice = (): 'h' | 'i' => Math.random() > 0.5 ? 'h' : 'i';
t(`unionTemplate.${getChoice()}.asdf`);
t(`twoUnionTemplate.${getChoice()}.and.${getChoice()}`);
customT(`unionWithPrefix.${getChoice()}`);
customT(`customFoo:unionWithOverrideNs.${getChoice()}`);
t(`ternary.${Math.random() > 0.5 ? 'bar' : 'baz'}`);
