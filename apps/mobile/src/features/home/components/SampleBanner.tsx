import { StyleSheet, View } from 'react-native';

import { Text, radius, spacing } from '@repo/ui';

export function SampleBanner() {
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

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  label: {
    color: '#92400E',
    fontWeight: '700',
  },
  message: {
    color: '#92400E',
  },
});
