import { View } from 'react-native';

import { Card, Text } from '@repo/ui';

import { useStyles } from './MetricTile.styles';

type MetricTileProps = {
  label: string;
  value: string;
  color: string;
};

export function MetricTile({ label, value, color }: MetricTileProps) {
  const styles = useStyles();
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
