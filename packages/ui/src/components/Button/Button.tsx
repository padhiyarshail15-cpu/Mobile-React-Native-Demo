import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '../../theme';

import { useStyles } from './Button.styles';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const styles = useStyles();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      // While loading the title is replaced by a spinner, so keep the name for screen readers.
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles.sizes[size],
        styles.variants[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={labelColors[variant]} />
      ) : (
        <Text
          style={[
            styles.label,
            styles.labelSizes[size],
            { color: labelColors[variant] },
            textStyle,
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.card,
  secondary: colors.primary,
  outline: colors.primary,
};
