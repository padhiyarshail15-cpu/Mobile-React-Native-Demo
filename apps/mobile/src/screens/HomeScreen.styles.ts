import { StyleSheet } from 'react-native';

import { colors, spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    section: {
      gap: spacing.lg,
    },
    tiles: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    insight: {
      gap: spacing.sm,
    },
  });
}
