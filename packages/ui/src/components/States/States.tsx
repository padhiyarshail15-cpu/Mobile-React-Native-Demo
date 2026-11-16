import type { ReactNode } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { Button } from '../Button';
import { Text } from '../Text';

interface StateViewProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
  testID?: string;
}

function StateView({ title, message, icon, action, testID }: StateViewProps) {
  return (
    <View style={styles.container} testID={testID}>
      {icon}
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" muted style={styles.center}>
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          title={action.label}
          variant="outline"
          onPress={action.onPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading data…' }: LoadingStateProps) {
  return (
    <StateView
      testID="loading-state"
      title={message}
      icon={<ActivityIndicator size="large" color={colors.primary} />}
    />
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <StateView
      testID="error-state"
      title="Could not load data"
      message={message}
      action={onRetry ? { label: 'Retry', onPress: onRetry } : undefined}
    />
  );
}

export interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({
  title = 'Nothing here yet',
  message,
  action,
}: EmptyStateProps) {
  return (
    <StateView
      testID="empty-state"
      title={title}
      message={message}
      action={action}
    />
  );
}

export interface DataUnavailableProps {
  title?: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export function DataUnavailable({
  title = 'Data not available',
  message = 'Try a different date range or choose another location.',
  action,
}: DataUnavailableProps) {
  return (
    <StateView
      testID="data-unavailable-state"
      title={title}
      message={message}
      action={action}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
