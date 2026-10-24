import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';
import { colors } from '../../theme/colors';

/** Khối .hr: nhãn bên trái, giờ mở cửa bên phải */
export default function HoursRow() {
  const { t } = useTranslation();
  return (
    <GlassCard style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
      <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 16 }}>{t('legacy.ui.open')}</Text>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 23 }}>{t('legacy.head.hours')}</Text>
    </GlassCard>
  );
}
