import './plural-rules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import lvi from './locales/legacy.vi.json';
import len from './locales/legacy.en.json';
import lja from './locales/legacy.ja.json';
import lzh from './locales/legacy.zh.json';
import lko from './locales/legacy.ko.json';

export const LANGS = [
  { code: 'vi', label: 'VI', name: 'Tiếng Việt' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ja', label: '日本語', name: '日本語' },
  { code: 'zh', label: '中文', name: '中文' },
  { code: 'ko', label: '한국어', name: '한국어' },
] as const;
export type LangCode = (typeof LANGS)[number]['code'];

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: { ...vi, legacy: lvi } },
    en: { translation: { ...en, legacy: len } },
    ja: { translation: { ...ja, legacy: lja } },
    zh: { translation: { ...zh, legacy: lzh } },
    ko: { translation: { ...ko, legacy: lko } },
  },
  lng: 'vi', fallbackLng: { default: ['en', 'vi'] }, interpolation: { escapeValue: false },
});
export default i18n;
