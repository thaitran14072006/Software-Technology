import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { parseQr } from '../../utils/qrParser';
import { resolveQr } from '../../services/api/qr.api';
import { usePlayback } from '../../store/playbackStore';
import { colors } from '../../theme/colors';

/** UC4: quét QR tại hiện vật khi định vị tự động không hoạt động. */
export default function QrScannerScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const requestPlay = usePlayback((s) => s.requestPlay);

  // UC4 bước 2 + E2: xin quyền Camera; bị từ chối -> thông báo và quay lại màn hình trước
  useEffect(() => {
    if (hasPermission) return;
    requestPermission().then((ok) => {
      if (ok) return;
      Alert.alert(t('errors.cameraDenied'), undefined, [
        { text: 'OK', onPress: () => nav.goBack() },
        { text: 'Settings', onPress: () => { Linking.openSettings(); nav.goBack(); } },
      ], { onDismiss: () => nav.goBack() });
    });
  }, [hasPermission]);   // eslint-disable-line react-hooks/exhaustive-deps

  const release = () => { lock.current = false; setBusy(false); };
  const invalid = () => Alert.alert(t('errors.qrInvalid'), undefined, [{ text: 'OK', onPress: release }]);   // UC4-E1

  const scanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: async (codes) => {
      if (lock.current || !codes[0]?.value) return;
      lock.current = true; setBusy(true);
      const token = parseQr(codes[0].value);
      if (!token) return invalid();
      try {
        const r = await resolveQr(token);
        if (!r || r.kind !== 'POI') return invalid();
        requestPlay(r.poiId);       // UC4 bước 4-6: Map nhận lệnh, chọn POI và phát
        nav.goBack();
      } catch {
        Alert.alert(t('errors.noLocation').split('.')[0], undefined, [{ text: 'OK', onPress: release }]);
      }
    },
  });

  if (!hasPermission || !device) return <View style={s.root} />;
  return (
    <View style={s.root}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={!busy} codeScanner={scanner} />
      <View style={s.frame} pointerEvents="none" />
      <Pressable style={s.close} onPress={() => nav.goBack()} accessibilityLabel="Close"><Text style={s.x}>✕</Text></Pressable>
      <Text style={s.hint}>{t('map.scanQr')}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  frame: { position: 'absolute', alignSelf: 'center', top: '30%', width: 240, height: 240, borderWidth: 3, borderColor: colors.accent, borderRadius: 20 },
  close: { position: 'absolute', top: 48, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' },
  x: { color: colors.text, fontSize: 20 },
  hint: { position: 'absolute', bottom: 80, alignSelf: 'center', color: colors.text, fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
});
