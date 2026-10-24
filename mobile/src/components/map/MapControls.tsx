import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  gpsOn: boolean; mode: 'outdoor' | 'schematic';
  onGps: () => void; onQr: () => void; onMode: () => void; onZoomIn: () => void; onZoomOut: () => void; onHome: () => void;
}
const Btn = ({ label, onPress, on, a11y }: { label: string; onPress: () => void; on?: boolean; a11y: string }) => (
  <Pressable onPress={onPress} accessibilityLabel={a11y} accessibilityRole="button" style={[s.b, on && s.on]}>
    <Text style={[s.t, on && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

/** Cột nút .zb: GPS, QR, bản đồ, +, −, ⌂ */
export default function MapControls(p: Props) {
  return (
    <View style={s.col}>
      <Btn label="⌖" a11y="GPS" on={p.gpsOn} onPress={p.onGps} />
      <Btn label="▦" a11y="QR" onPress={p.onQr} />
      <Btn label="☷" a11y="Map mode" on={p.mode === 'outdoor'} onPress={p.onMode} />
      <Btn label="+" a11y="Zoom in" onPress={p.onZoomIn} />
      <Btn label="−" a11y="Zoom out" onPress={p.onZoomOut} />
      <Btn label="⌂" a11y="Home" onPress={p.onHome} />
    </View>
  );
}
const s = StyleSheet.create({
  col: { gap: 6 },
  b: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.accent, borderColor: colors.accent }, t: { color: colors.text, fontSize: 19 },
});
