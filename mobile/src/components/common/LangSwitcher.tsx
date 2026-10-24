import { Pressable, Text } from 'react-native';
import GlassCard from './GlassCard';
import { LANGS } from '../../i18n';
import { useLanguageStore } from '../../store/languageStore';
import { colors } from '../../theme/colors';

/** Khối .lg: đổi ngôn ngữ tức thời (FR8) */
export default function LangSwitcher() {
  const { lang, setLang } = useLanguageStore();
  return (
    <GlassCard style={{ flexDirection: 'row', padding: 4, gap: 4 }}>
      {LANGS.map((l) => (
        <Pressable key={l.code} onPress={() => setLang(l.code)} accessibilityLabel={l.name} accessibilityRole="button"
          style={{ flex: 1, paddingVertical: 8, borderRadius: 14, alignItems: 'center', backgroundColor: lang === l.code ? colors.accent : 'transparent' }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: lang === l.code ? '#fff' : colors.muted }}>{l.label}</Text>
        </Pressable>
      ))}
    </GlassCard>
  );
}
