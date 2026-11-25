import { StyleSheet } from 'react-native';

import { spacing } from '../../theme';

export function useStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    titles: {
      flexShrink: 1,
      gap: spacing.xs,
    },
  });
}
