import { Text, View } from 'react-native';
import GlassCard from './GlassCard';
import { useToast } from '../../store/toastStore';
import { colors } from '../../theme/colors';

export default function Toast() {
  const msg = useToast((s) => s.msg);
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom: 24, left: 16, right: 16, alignItems: 'center' }} accessibilityLiveRegion="polite">
      <GlassCard style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>{msg}</Text>
      </GlassCard>
    </View>
  );
}
