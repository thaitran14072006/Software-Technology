import assert from 'node:assert/strict';
import { createInstance } from 'i18next';

// Reproduce Hermes without native PluralRules instead of relying on Node's Intl.
delete Intl.PluralRules;
await import('@formatjs/intl-pluralrules/polyfill-force.js');
for (const language of ['vi', 'en', 'ja', 'ko', 'zh']) {
  await import(`@formatjs/intl-pluralrules/locale-data/${language}.js`);
  assert.equal(new Intl.PluralRules(language).resolvedOptions().locale, language);
  assert.equal(new Intl.PluralRules(language).select(1), language === 'en' ? 'one' : 'other');
  assert.equal(new Intl.PluralRules(language).select(2), 'other');
}
const i18n = createInstance();
const errors = [];
i18n.use({ type: 'logger', log() {}, warn() {}, error(message) { errors.push(message); } });
await i18n.init({
  lng: 'en', fallbackLng: false,
  resources: { en: { translation: { item_one: '{{count}} stop', item_other: '{{count}} stops' } } },
});
assert.equal(i18n.t('item', { count: 1 }), '1 stop');
assert.equal(i18n.t('item', { count: 2 }), '2 stops');
assert.equal(errors.length, 0, 'i18next must initialize without the missing-Intl error');
console.log('PluralRules: all 5 locales + i18next v4 plural selection passed without native Intl.PluralRules.');
