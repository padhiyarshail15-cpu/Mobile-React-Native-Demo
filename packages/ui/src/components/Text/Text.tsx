import type {
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native';
import { Text as RNText } from 'react-native';

import { typography } from '../../theme';
import type { TypographyVariant } from '../../theme';

import { useStyles } from './Text.styles';

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
  const styles = useStyles();
  return (
    <RNText
      style={[styles.base, typography[variant], muted && styles.muted, style]}
      {...rest}
    />
  );
}
