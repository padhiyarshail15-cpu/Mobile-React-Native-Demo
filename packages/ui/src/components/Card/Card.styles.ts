import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../theme';

export function useStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: '#0F172A', //Todo: Replace with theme color if needed
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  });
}
