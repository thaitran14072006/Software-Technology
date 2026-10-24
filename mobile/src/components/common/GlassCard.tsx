import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius } from '../../theme/colors';

export default function GlassCard({ style, ...p }: ViewProps) { return <View {...p} style={[s.c, style]} />; }
const s = StyleSheet.create({ c: { backgroundColor: colors.glass, borderColor: colors.line, borderWidth: 1, borderRadius: radius.card } });
