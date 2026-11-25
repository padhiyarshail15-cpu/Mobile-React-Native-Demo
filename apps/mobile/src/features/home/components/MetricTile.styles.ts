import { StyleSheet } from 'react-native';

import { spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    tile: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });
}
