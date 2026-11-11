import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

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
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
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
            labelSizeStyles[size],
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
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  outline: '#2563EB',
};

const styles = StyleSheet.create({
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
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#4B5563' },
  outline: { backgroundColor: 'transparent', borderColor: '#2563EB' },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 32 },
  md: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 44 },
  lg: { paddingVertical: 14, paddingHorizontal: 20, minHeight: 52 },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
});
