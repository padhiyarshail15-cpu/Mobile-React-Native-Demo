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
      gap: spacing.md,
    },
    header: {
      gap: spacing.md,
    },
    sectionTitle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    hint: {
      color: colors.textMuted,
    },
  });
}
