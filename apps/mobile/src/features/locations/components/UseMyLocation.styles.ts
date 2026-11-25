import { StyleSheet } from 'react-native';

import { colors, spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    container: {
      gap: spacing.xs,
      alignItems: 'flex-start',
    },
    message: {
      color: colors.textMuted,
    },
  });
}
