import { StyleSheet } from 'react-native';

import { spacing } from '@repo/ui';

export function useStyles() {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
  });
}
