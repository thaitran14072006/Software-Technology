import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

export default function Logo({ size = 56 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="46" fill={colors.card} stroke={colors.accent} strokeWidth="5" />
      <Path d="M50 18C72 34 74 60 50 82 26 60 28 34 50 18Z" fill={colors.tree} />
      <Path d="M50 24V80" stroke={colors.card} strokeWidth="3" />
    </Svg>
  );
}
