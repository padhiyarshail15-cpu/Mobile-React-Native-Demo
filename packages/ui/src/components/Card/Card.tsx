import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useStyles } from './Card.styles';

export interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

export function Card({ style, ...rest }: CardProps) {
  const styles = useStyles();
  return <View style={[styles.card, style]} {...rest} />;
}
