import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';
import { colors } from '../../theme/colors';
import type { FilterKey } from '../../store/mapStore';

// Khối .bt: 5 nút bật/tắt lớp (đường lớn, đường mòn, cây/rừng, nước/thác, khu chức năng)
const KEYS: [FilterKey, string, string][] = [
  ['r', 'road', colors.road1], ['q', 'trail', colors.trail], ['t', 'trees', colors.tree], ['w', 'water', colors.water], ['p', 'facilities', colors.place],
];
export default function FilterBar({ off, onToggle }: { off: Record<FilterKey, boolean>; onToggle: (k: FilterKey) => void }) {
  const { t } = useTranslation();
  return (
    <GlassCard style={{ padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 20, borderRadius: 22 }}>
      {KEYS.map(([k, key, c]) => (
        <Pressable key={k} onPress={() => onToggle(k)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: off[k] ? 0.35 : 1 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c }} />
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{t(`legacy.ui.${key}`)}</Text>
        </Pressable>
      ))}
    </GlassCard>
  );
}
