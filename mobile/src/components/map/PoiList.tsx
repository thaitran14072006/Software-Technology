import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';
import { CAT_BY_ID, CAT_COLOR, colors } from '../../theme/colors';
import type { Poi } from '../../services/api/poi.api';
import type { FilterKey } from '../../store/mapStore';

/** Khối .lc: "15 ĐIỂM THAM QUAN" + danh sách; mỗi dòng: vòng số tô theo nhóm, tên, phụ đề không dấu */
export default function PoiList({ pois, selectedId, off, onSelect }: {
  pois: Poi[]; selectedId: string | null; off: Record<FilterKey, boolean>; onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <GlassCard style={{ padding: 16 }}>
      <Text style={{ color: colors.accent, fontSize: 20, letterSpacing: 1.2, marginBottom: 8 }}>{t('legacy.ui.stops')}</Text>
      {pois.map((p) => {
        const c = CAT_BY_ID[p.categoryId ?? 2], dim = off[c];
        return (
          <Pressable key={p.id} onPress={() => onSelect(p.id)} accessibilityRole="button"
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12 },
              p.id === selectedId && { backgroundColor: colors.line }, dim && { opacity: 0.35 }]}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: CAT_COLOR[c], alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{p.code}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 17 }}>{p.name}</Text>
              {!!p.summary && <Text style={{ color: colors.muted, fontSize: 13 }}>{p.summary}</Text>}
            </View>
          </Pressable>
        );
      })}
    </GlassCard>
  );
}
