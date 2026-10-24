import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import i18n, { LangCode } from '../i18n';
import { zustandStorage } from '../services/storage/kv';

interface LangState { lang: LangCode; chosen: boolean; setLang: (l: LangCode) => void; }

export const useLanguageStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'vi', chosen: false,
      setLang: (lang) => { i18n.changeLanguage(lang); set({ lang, chosen: true }); },   // đổi ngôn ngữ tức thời (FR8)
    }),
    {
      name: 'lang', storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (s) => { if (s) i18n.changeLanguage(s.lang); },
    },
  ),
);
