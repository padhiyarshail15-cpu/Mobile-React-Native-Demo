import { View } from 'react-native';

import { Text } from '@repo/ui';

import { useStyles } from './SampleBanner.styles';

export function SampleBanner() {
  const styles = useStyles();
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text variant="caption" style={styles.label}>
        SAMPLE DATA
      </Text>
      <Text variant="caption" style={styles.message}>
        Not live NASA POWER values. Removed when the API is connected.
      </Text>
    </View>
  );
}
