import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';
import { colors } from '../../theme/colors';
import { fmtDistance } from '../../utils/haversine';
import type { Poi } from '../../services/api/poi.api';
import type { AudioApi } from '../../hooks/useAudioPlayer';

interface Props {
  poi: Poi | null; audio: AudioApi; auto: boolean; onAuto: (b: boolean) => void;
  distanceM: number | null; routing: boolean; onPrev: () => void; onNext: () => void; onNavigate: () => void;
}

/** Khối .pl: tiêu đề, phụ đề, ▶ Nghe, ‹ ›, thanh tiến trình, Auto. Thêm hàng "Chỉ đường" (UC2). */
export default function PoiPanel({ poi, audio, auto, onAuto, distanceM, routing, onPrev, onNext, onNavigate }: Props) {
  const { t } = useTranslation();
  const [bw, setBw] = useState(1);
  if (!poi) return <GlassCard style={s.p}><Text style={{ color: colors.muted, fontSize: 17 }}>{t('legacy.ui.hint')}</Text></GlassCard>;
  const playing = audio.playingId === poi.id && audio.isPlaying;
  return (
    <GlassCard style={s.p}>
      <Text style={s.h2}>{poi.code}. {poi.name}</Text>
      {!!poi.summary && <Text style={s.sm}>{poi.summary}</Text>}
      <View style={s.row}>
        <Pressable style={[s.btn, s.go]} onPress={() => (playing ? audio.stop() : audio.play(poi))} accessibilityRole="button">
          <Text style={s.goTx}>{playing ? '■ ' + t('legacy.ui.stop') : '▶ ' + t('legacy.ui.play')}</Text>
        </Pressable>
        <Pressable style={s.btn} onPress={onPrev} accessibilityLabel="Previous"><Text style={s.tx}>‹</Text></Pressable>
        <Pressable style={s.btn} onPress={onNext} accessibilityLabel="Next"><Text style={s.tx}>›</Text></Pressable>
      </View>
      <View style={s.row}>
        <Pressable style={s.bw} onLayout={(e) => setBw(e.nativeEvent.layout.width || 1)} onPress={(e) => audio.seekFraction(e.nativeEvent.locationX / bw)}>
          <View style={s.bar}><View style={[s.fill, { width: `${Math.round(audio.progress * 100)}%` }]} /></View>
        </Pressable>
        <View style={s.auto}>
          <Switch value={auto} onValueChange={onAuto} trackColor={{ true: colors.accent }} />
          <Text style={s.autoTx}>{t('legacy.ui.auto')}</Text>
        </View>
      </View>
      <View style={s.row}>
        <Pressable style={[s.btn, s.nav]} onPress={onNavigate} disabled={routing} accessibilityRole="button">
          <Text style={s.tx}>{routing ? '…' : '➤ ' + t('map.navigate')}</Text>
        </Pressable>
        {distanceM != null && <Text style={{ color: colors.tree }}>{t('map.distance')}: {fmtDistance(distanceM)}</Text>}
      </View>
    </GlassCard>
  );
}
const s = StyleSheet.create({
  p: { padding: 14 }, h2: { fontSize: 23, color: colors.text, fontWeight: '700' }, sm: { color: colors.muted, fontSize: 17 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 12 },
  btn: { height: 44, minWidth: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  go: { backgroundColor: colors.accent, borderColor: colors.accent, flex: 1 }, goTx: { color: '#fff', fontWeight: '700' },
  nav: { paddingHorizontal: 18 }, tx: { color: colors.text, fontSize: 17 },
  bw: { flex: 1, paddingVertical: 14 }, bar: { height: 6, borderRadius: 9, backgroundColor: colors.line, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.accent },
  auto: { flexDirection: 'row', alignItems: 'center', gap: 6 }, autoTx: { color: colors.text, fontSize: 14 },
});
