import { StyleSheet, View } from 'react-native';

import { Card, Text, spacing } from '@repo/ui';

type MetricTileProps = {
  label: string;
  value: string;
  color: string;
};

export function MetricTile({ label, value, color }: MetricTileProps) {
  return (
    <Card style={styles.tile}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="heading">{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
