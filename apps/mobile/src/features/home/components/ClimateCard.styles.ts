import { StyleSheet } from 'react-native';

import { colors, spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    value: {
      fontSize: 32,
      lineHeight: 36,
      color: colors.primary,
      marginVertical: spacing.xs,
    },
  });
}
