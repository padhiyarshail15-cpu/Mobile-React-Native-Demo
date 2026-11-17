import { Card, Text } from '@repo/ui';

import { formatAnomaly, formatMetric } from '../format';
import type { HomeClimate } from '../types';

import { useStyles } from './ClimateCard.styles';

type ClimateCardProps = {
  data: HomeClimate;
};

export function ClimateCard({ data }: ClimateCardProps) {
  const styles = useStyles();
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
