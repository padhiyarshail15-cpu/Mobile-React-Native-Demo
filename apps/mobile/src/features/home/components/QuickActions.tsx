import { StyleSheet, View } from 'react-native';

import { Chip, Text, spacing } from '@repo/ui';

type QuickActionsProps = {
  onAskAi: () => void;
};

// Only Ask AI is wired now. The rest arrive in later weeks.
export function QuickActions({ onAskAi }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Text variant="heading">Quick actions</Text>
      <View style={styles.row}>
        <Chip label="Learn" disabled accessibilityHint="Coming in Week 7" />
        <Chip
          label="Location details"
          disabled
          accessibilityHint="Coming in Week 3"
        />
        <Chip label="History" disabled accessibilityHint="Coming in Week 4" />
        <Chip label="Compare" disabled accessibilityHint="Coming in Week 5" />
        <Chip label="Ask AI" onPress={onAskAi} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
