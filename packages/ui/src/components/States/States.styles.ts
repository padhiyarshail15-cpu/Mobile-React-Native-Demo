import { StyleSheet } from 'react-native';

import { spacing } from '../../theme';

export function useStyles() {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
    },
    center: {
      textAlign: 'center',
    },
    action: {
      marginTop: spacing.sm,
      minWidth: 160,
    },
  });
}
