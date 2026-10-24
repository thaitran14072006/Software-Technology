import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import HeaderTitle from '../../components/layout/HeaderTitle';
import HoursRow from '../../components/layout/HoursRow';
import GlassCard from '../../components/common/GlassCard';
import LangSwitcher from '../../components/common/LangSwitcher';
import Toast from '../../components/common/Toast';
import SchematicMap, { SchematicHandle } from '../../components/map/SchematicMap';
import OutdoorMap, { OutdoorMapHandle } from '../../components/map/OutdoorMap';
import MapControls from '../../components/map/MapControls';
import PoiPanel from '../../components/map/PoiPanel';
import PoiList from '../../components/map/PoiList';
import FilterBar from '../../components/map/FilterBar';
import { usePois } from '../../hooks/usePois';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useAutoPlay } from '../../hooks/useAutoPlay';
import { useRouteTo } from '../../hooks/useRouteTo';
import { useNetwork } from '../../hooks/useNetwork';
import { useMapStore } from '../../store/mapStore';
import { usePlayback } from '../../store/playbackStore';
import { useLanguageStore } from '../../store/languageStore';
import { loadPack } from '../../services/offline/offlineStore';
import { newCancel, syncPack } from '../../services/offline/packService';
import { kv } from '../../services/storage/kv';
import { CAT_BY_ID, colors } from '../../theme/colors';
import { fmtDistance, fmtDuration, haversine } from '../../utils/haversine';

/** Bố cục cuộn dọc đúng như app.css "bố cục mobile": tiêu đề → giờ → ngôn ngữ → bản đồ → panel → danh sách → bộ lọc */
export default function MapScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const lang = useLanguageStore((s) => s.lang);
  const scroll = useRef<ScrollView>(null);
  const outdoor = useRef<OutdoorMapHandle>(null), schem = useRef<SchematicHandle>(null);
  const [mapY, setMapY] = useState(0);
  const [scrollOn, setScrollOn] = useState(true);

  const { data, isLoading, isError, refetch } = usePois();
  const pois = data?.items ?? [];
  const user = useUserLocation();
  const { selected, select, route, mode, setMode, off, toggle, setRoute } = useMapStore();
  const audio = useAudioPlayer();
  const { auto, setAuto, pendingPlayId, clearPending } = usePlayback();
  const { navigate, routing } = useRouteTo(user);
  const net = useNetwork();

  useAutoPlay(pois, audio, user);                                       // UC3

  const choose = useCallback((id: string, play = false, scrollTo = false) => {
    const p = pois.find((x) => x.id === id) ?? null;
    select(p);
    if (p) { if (p.geoVerified || p.geoSourceUrl) outdoor.current?.flyTo(p.lat, p.lng); if (play) audio.play(p); }
    if (scrollTo) scroll.current?.scrollTo({ y: Math.max(0, mapY - 8), animated: true });
  }, [pois, select, audio, mapY]);

  // Kết quả quét QR (UC4) gửi sang qua store: chọn POI và phát
  useEffect(() => {
    if (pendingPlayId && pois.length) { choose(pendingPlayId, true, true); clearPending(); }
  }, [pendingPlayId, pois]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Tự cập nhật gói offline khi có Wi-Fi (tối đa 6 giờ/lần, chỉ khi gói đã được tải)
  useEffect(() => {
    if (!net.online || !net.wifi || !loadPack(lang)) return;
    if (Date.now() - (kv.getNumber(`lastSync:${lang}`) ?? 0) < 6 * 3600_000) return;
    syncPack(lang, newCancel()).then((r) => r.ok && kv.set(`lastSync:${lang}`, Date.now())).catch(() => undefined);
  }, [net.online, net.wifi, lang]);

  const distanceM = useMemo(() => (selected?.geoVerified && user.coords ? haversine(user.coords, selected) : null), [selected, user.coords]);

  const step = (d: number) => {   // giống step() trong ui.js: bỏ qua nhóm đang ẩn
    const list = pois.filter((p) => !off[CAT_BY_ID[p.categoryId ?? 2]]);
    if (!list.length) return;
    const i = list.findIndex((p) => p.id === selected?.id);
    choose(list[(i + d + list.length) % list.length].id, true);
  };

  return (
    <View style={s.root}>
      <ScrollView ref={scroll} scrollEnabled={scrollOn}
        contentContainerStyle={[s.page, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 }]}>
        <HeaderTitle />
        <HoursRow />
        <LangSwitcher />

        <View style={s.map} onLayout={(e) => setMapY(e.nativeEvent.layout.y)}
          onTouchStart={() => mode === 'outdoor' && setScrollOn(false)} onTouchEnd={() => setScrollOn(true)}>
          {mode === 'schematic'
            ? <SchematicMap ref={schem} pois={pois} selectedId={selected?.id ?? null} user={user.coords} route={route} off={off}
                onSelect={(id) => choose(id, true)} onTouch={(down) => setScrollOn(!down)} />
            : <OutdoorMap ref={outdoor} pois={pois.filter((p) => p.geoVerified || Boolean(p.geoSourceUrl))} selectedId={selected?.id ?? null}
                user={user.coords} route={route} onSelect={(id) => choose(id, true)} onClearSelect={() => select(null)} />}
          <View style={s.zb}>
            <MapControls gpsOn={user.active} mode={mode}
              onGps={() => (user.active ? user.stop() : user.start())} onQr={() => nav.navigate('QrScanner')}
              onMode={() => setMode(mode === 'schematic' ? 'outdoor' : 'schematic')}
              onZoomIn={() => (mode === 'schematic' ? schem.current?.zoom(0.7) : outdoor.current?.zoom(1))}
              onZoomOut={() => (mode === 'schematic' ? schem.current?.zoom(1.4) : outdoor.current?.zoom(-1))}
              onHome={() => { setRoute(null); mode === 'schematic' ? schem.current?.reset() : outdoor.current?.home(); }} />
          </View>
        </View>

        {route && selected && (
          <GlassCard style={s.routeBar}>
            <Text style={s.routeTx}>{t('map.route')}: {fmtDistance(route.distanceM)} · {fmtDuration(route.durationS)}</Text>
            {route.approximate && <Text style={s.approx}>{t('map.approx')}</Text>}
          </GlassCard>
        )}

        <PoiPanel poi={selected} audio={audio} auto={auto} onAuto={setAuto} distanceM={distanceM} routing={routing}
          onPrev={() => step(-1)} onNext={() => step(1)} onNavigate={() => selected && navigate(selected)} />
        <PoiList pois={pois} selectedId={selected?.id ?? null} off={off} onSelect={(id) => choose(id, true, true)} />
        <FilterBar off={off} onToggle={toggle} />

        {/* Gói ngoại tuyến (FR9) — UI gốc chưa có mục này nên đặt cuối trang */}
        <Pressable onPress={() => nav.navigate('Offline')} accessibilityRole="button">
          <GlassCard style={s.offline}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>⬇ {t('offline.entry')}</Text>
            <Text style={{ color: colors.accent }}>›</Text>
          </GlassCard>
        </Pressable>

        {isLoading && !pois.length && <Text style={s.note}>…</Text>}
        {isError && !pois.length && (
          <Pressable onPress={() => refetch()}><Text style={s.note}>{t('errors.loadPois')} · {t('errors.retry')}</Text></Pressable>
        )}
      </ScrollView>
      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 10, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  map: { aspectRatio: 1.1, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.land },
  zb: { position: 'absolute', right: 8, top: 8 },
  routeBar: { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  routeTx: { color: colors.text, fontWeight: '700' }, approx: { color: colors.accent, fontSize: 11 },
  offline: { padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  note: { color: colors.muted, textAlign: 'center' },
});
