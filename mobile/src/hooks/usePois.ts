import {applyPoiCatalog} from '../config/poi-catalog';
import { useQuery } from '@tanstack/react-query';
import { fetchPois, PoiList } from '../services/api/poi.api';
import { kv } from '../services/storage/kv';
import { loadPack } from '../services/offline/offlineStore';
import { useLanguageStore } from '../store/languageStore';
import { useNetwork } from './useNetwork';
import i18n from '../i18n';

const normalizeCatalog=(data:PoiList):PoiList=>({...data,items:applyPoiCatalog(data.items)});

export function usePois() {
  const lang = useLanguageStore((s) => s.lang);
  const { online } = useNetwork();
  const cacheKey = `pois:${lang}`;
  return useQuery<PoiList>({
    queryKey: ['pois', lang, online], staleTime: 5 * 60_000,
    queryFn: async () => {
      if (online) {
        try { const d = normalizeCatalog(await fetchPois(lang)); kv.set(cacheKey, JSON.stringify(d)); return d; } catch { /* rơi xuống offline */ }
      }
      const pack = loadPack(lang); // Never silently switch narration language.
      if (pack) return { contentVersion: pack.rev, items: applyPoiCatalog(Object.values(pack.items)) };
      const cached = kv.getString(cacheKey);
      if (cached) return normalizeCatalog(JSON.parse(cached));
      throw new Error(i18n.t('offline.languageMissing'));
    },
    placeholderData: () => { const c = kv.getString(cacheKey); return c ? normalizeCatalog(JSON.parse(c)) : undefined; },
  });
}
