import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Logo from '../../components/layout/Logo';
import { LANGS, LangCode } from '../../i18n';
import { useLanguageStore } from '../../store/languageStore';
import { colors, radius } from '../../theme/colors';

/** UC1 bước 4-6: Splash luôn hiển thị; ngôn ngữ đã lưu được chọn sẵn, chạm để đổi, rồi "Bắt đầu". */
export default function SplashScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const setLang = useLanguageStore((s) => s.setLang);
  const [pick, setPick] = useState<LangCode>(useLanguageStore.getState().lang);

  const choose = (c: LangCode) => { setPick(c); setLang(c); };            // giao diện đổi ngay khi chạm
  const start = () => nav.reset({ index: 0, routes: [{ name: 'Map' }] });   // lưu vào MMKV qua persist; vào Bản đồ chính

  return (
    <View style={s.root}>
      <Logo size={120} />
      <Text style={s.welcome}>{t('splash.welcome')}</Text>
      <Text style={s.title}>{t('legacy.head.title')}</Text>
      <Text style={s.choose}>{t('splash.choose')}</Text>
      <View style={s.row}>
        {LANGS.map((l) => (
          <Pressable key={l.code} onPress={() => choose(l.code)} accessibilityRole="button" style={[s.lang, pick === l.code && s.langOn]}>
            <Text style={[s.langTx, pick === l.code && { color: '#fff' }]}>{l.name}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={start} style={s.cta} accessibilityRole="button">
        <Text style={s.ctaTx}>{t('splash.start')}</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  welcome: { color: colors.muted, fontSize: 14, marginTop: 8 },
  title: { color: colors.accent, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  choose: { color: colors.text, marginTop: 28, fontSize: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  lang: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass },
  langOn: { backgroundColor: colors.accent, borderColor: colors.accent }, langTx: { color: colors.text, fontWeight: '600' },
  cta: { marginTop: 24, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: radius.pill },
  ctaTx: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
