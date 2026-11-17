import type { ReactNode } from 'react';

import { View } from 'react-native';

import { Text } from '../Text';

import { useStyles } from './Header.styles';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
