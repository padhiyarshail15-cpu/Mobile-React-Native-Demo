import { StyleSheet } from 'react-native';

import { colors, spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    row: {
      gap: spacing.xs,
    },
    pressed: {
      opacity: 0.8,
    },
    note: {
      color: colors.textMuted,
    },
  });
}
