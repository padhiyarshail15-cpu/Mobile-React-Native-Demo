import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { Text } from '../Text';

export interface ChipProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, style, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      <Text
        variant="caption"
        style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.card,
  },
});
