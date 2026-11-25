import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
    },
    clear: {
      paddingVertical: spacing.sm,
      paddingLeft: spacing.md,
    },
  });
}
