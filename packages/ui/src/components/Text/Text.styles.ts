import { StyleSheet } from 'react-native';

import { colors } from '../../theme';

export function useStyles() {
  return StyleSheet.create({
    base: {
      color: colors.text,
    },
    muted: {
      color: colors.textMuted,
    },
  });
}
