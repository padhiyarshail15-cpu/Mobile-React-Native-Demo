import { StyleSheet } from 'react-native';

import { colors } from '../../theme';

export function useStyles() {
  return {
    ...StyleSheet.create({
      base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
      },
      label: {
        fontWeight: '600',
      },
      pressed: {
        opacity: 0.8,
      },
      disabled: {
        opacity: 0.5,
      },
    }),
    variants: StyleSheet.create({
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.surface },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.primary,
      },
    }),
    sizes: StyleSheet.create({
      sm: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 32 },
      md: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 44 },
      lg: { paddingVertical: 14, paddingHorizontal: 20, minHeight: 52 },
    }),
    labelSizes: StyleSheet.create({
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    }),
  };
}
