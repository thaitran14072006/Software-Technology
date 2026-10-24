import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import { colors } from '../../theme/colors';

/** Khối .tt: logo + tiêu đề + phụ đề (chữ thưa, màu accent) */
export default function HeaderTitle() {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Logo size={56} />
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 24, letterSpacing: 0.5 }}>{t('legacy.head.title')}</Text>
        <Text style={{ color: colors.accent, fontSize: 13, letterSpacing: 4, marginTop: 6, textAlign: 'center' }}>{t('legacy.head.subtitle')}</Text>
      </View>
    </View>
  );
}
