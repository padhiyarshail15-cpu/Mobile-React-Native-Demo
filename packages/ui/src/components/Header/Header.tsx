import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { Text } from '../Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  titles: {
    flexShrink: 1,
    gap: spacing.xs,
  },
});
