import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';

export interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

export function Card({ style, ...rest }: CardProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
