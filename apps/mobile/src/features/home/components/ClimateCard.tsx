import { StyleSheet } from 'react-native';

import { Card, Text, colors, spacing } from '@repo/ui';

import { formatAnomaly, formatMetric } from '../format';
import type { HomeClimate } from '../types';

type ClimateCardProps = {
  data: HomeClimate;
};

export function ClimateCard({ data }: ClimateCardProps) {
  return (
    <Card accessibilityLabel="Annual mean temperature">
      <Text variant="caption" muted>
        {`Annual mean · ${data.currentYear}`}
      </Text>
      <Text variant="title" style={styles.value}>
        {formatMetric(data.annualMeanTempC, 1, '°C')}
      </Text>
      <Text variant="body" muted>
        {`Anomaly ${formatAnomaly(data.anomalyC)} vs ${data.baseline} baseline`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  value: {
    fontSize: 32,
    lineHeight: 36,
    color: colors.primary,
    marginVertical: spacing.xs,
  },
});
