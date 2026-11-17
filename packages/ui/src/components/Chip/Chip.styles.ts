import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme';

export function useStyles() {
  return StyleSheet.create({
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
    disabled: {
      opacity: 0.45,
    },
    label: {
      fontWeight: '600',
    },
    selectedLabel: {
      color: colors.card,
    },
  });
}
