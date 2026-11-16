import type {
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { colors, typography } from '../../theme';
import type { TypographyVariant } from '../../theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}

export function Text({
  variant = 'body',
  muted = false,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[styles.base, typography[variant], muted && styles.muted, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
});
