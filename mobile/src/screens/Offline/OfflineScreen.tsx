import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import GlassCard from '../../components/common/GlassCard';
import { LANGS } from '../../i18n';
import { useLanguageStore } from '../../store/languageStore';
import { useNetwork } from '../../hooks/useNetwork';
import { cancel, newCancel, previewPack, removePack, syncPack, Progress } from '../../services/offline/packService';
import { loadPack, packBytes } from '../../services/offline/offlineStore';
import { canDownloadMap, downloadMapPack, estimateTiles, hasMapPack, removeMapPack } from '../../services/offline/mapPack';
import { colors } from '../../theme/colors';

const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

/** FR9: tải trước gói thuyết minh + nội dung (+ tile Mapbox tùy chọn) để dùng khi không có mạng. */
export default function OfflineScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const net = useNetwork();
  const cur = useLanguageStore((s) => s.lang);
  const [sel, setSel] = useState<Record<string, boolean>>({ [cur]: true });
  const [need, setNeed] = useState<Record<string, { files: number; bytes: number } | 'err'>>({});
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<Progress | null>(null);
  const [mapPct, setMapPct] = useState<number | null>(null);
  const [mapHas, setMapHas] = useState(false);
  const [tick, setTick] = useState(0);
  const c = useRef(newCancel());

  useEffect(() => { hasMapPack().then(setMapHas).catch(() => setMapHas(false)); }, [tick]);
  useEffect(() => {                                           // dung lượng cần tải cho từng ngôn ngữ (khi có mạng)
    if (!net.online) return;
    LANGS.forEach((l) => previewPack(l.code)
      .then((v) => setNeed((n) => ({ ...n, [l.code]: v })))
      .catch(() => setNeed((n) => ({ ...n, [l.code]: 'err' }))));
  }, [net.online, tick]);

  const run = useCallback(async () => {
    const langs = LANGS.map((l) => l.code).filter((l) => sel[l]);
    if (!langs.length) return;
    setBusy(true); c.current = newCancel();
    let failed = 0;
    try {
      for (const l of langs) { const r = await syncPack(l, c.current, setProg); failed += r.failed; if (c.current.cancelled) break; }
      if (failed) Alert.alert(t('offline.partial', { n: failed }));
    } catch (e: any) {
      Alert.alert(e?.message === 'NO_SPACE' ? t('offline.noSpace') : t('offline.failed'));
    } finally { setBusy(false); setProg(null); setTick((x) => x + 1); }
  }, [sel, t]);

  const start = () => {
    if (!net.online) return Alert.alert(t('offline.needNet'));
    if (!net.wifi) return Alert.alert(t('offline.cellular'), undefined, [{ text: t('offline.cancel') }, { text: t('offline.continue'), onPress: run }]);
    run();
  };
  const pct = prog && prog.totalBytes ? Math.min(100, Math.round((prog.doneBytes / prog.totalBytes) * 100)) : 0;

  const onMapPack = async () => {
    if (mapHas) { await removeMapPack(); return setTick((x) => x + 1); }
    if (!net.online) return Alert.alert(t('offline.needNet'));
    try { setMapPct(0); await downloadMapPack(setMapPct); } catch { Alert.alert(t('offline.failed')); } finally { setMapPct(null); setTick((x) => x + 1); }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 12, gap: 12, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }}>
      <Pressable onPress={() => nav.goBack()} accessibilityRole="button"><Text style={s.back}>‹ {t('offline.title')}</Text></Pressable>
      <Text style={s.hint}>{t('offline.desc')}</Text>

      {LANGS.map((l) => {
        const p = loadPack(l.code), n = need[l.code];
        return (
          <GlassCard key={l.code} style={s.row}>
            <Switch value={!!sel[l.code]} onValueChange={(v) => setSel((x) => ({ ...x, [l.code]: v }))} trackColor={{ true: colors.accent }} disabled={busy} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{l.name}</Text>
              <Text style={s.sub}>
                {p ? `${t('offline.downloaded')} · ${mb(packBytes(p))}` : t('offline.none')}
                {n && n !== 'err' && n.files > 0 ? ` · ${t('offline.toDownload', { size: mb(n.bytes) })}` : ''}
              </Text>
            </View>
            {p && !busy && (
              <Pressable accessibilityLabel={t('offline.delete')}
                onPress={() => Alert.alert(t('offline.delete') + '?', undefined, [
                  { text: t('offline.cancel') },
                  { text: t('offline.delete'), style: 'destructive', onPress: async () => { await removePack(l.code); setTick((x) => x + 1); } },
                ])}>
                <Text style={s.del}>✕</Text>
              </Pressable>
            )}
          </GlassCard>
        );
      })}

      <Pressable onPress={busy ? () => cancel(c.current) : start} style={s.btn} accessibilityRole="button">
        <Text style={s.btnTx}>{busy ? t('offline.cancel') : t('offline.download')}</Text>
      </Pressable>
      {busy && <View style={s.bar}><View style={[s.fill, { width: `${pct}%` }]} /></View>}
      {busy && prog && <Text style={s.sub}>{prog.filesDone}/{prog.files} · {mb(prog.doneBytes)} / {mb(prog.totalBytes)}</Text>}

      {canDownloadMap && <GlassCard style={{ padding: 14, gap: 8 }}>
        <Text style={s.name}>{t('offline.mapTitle')}</Text>
        <Text style={s.sub}>{t('offline.mapDesc', { tiles: estimateTiles() })}</Text>
        {mapPct != null && <View style={s.bar}><View style={[s.fill, { width: `${Math.round(mapPct)}%` }]} /></View>}
        <Pressable style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line }]} disabled={mapPct != null} onPress={onMapPack} accessibilityRole="button">
          <Text style={[s.btnTx, { color: colors.text }]}>{mapHas ? t('offline.delete') : t('offline.downloadMap')}</Text>
        </Pressable>
      </GlassCard>}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  back: { color: colors.accent, fontSize: 20, fontWeight: '700' }, hint: { color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 }, sub: { color: colors.muted, fontSize: 13 },
  del: { color: colors.muted, fontSize: 20, paddingHorizontal: 8 },
  btn: { backgroundColor: colors.accent, borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  btnTx: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bar: { height: 6, borderRadius: 9, backgroundColor: colors.line, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.accent },
});
