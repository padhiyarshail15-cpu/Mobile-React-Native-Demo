import { View } from 'react-native';

import { Button, Text } from '@repo/ui';

import type { Location } from '../types';
import { useMyLocation, type MyLocationStatus } from '../useMyLocation';

import { useStyles } from './UseMyLocation.styles';

// What the user reads for each outcome. null means nothing to say.
export function describeStatus(status: MyLocationStatus): string | null {
  switch (status.kind) {
    case 'idle':
      return null;
    case 'locating':
      return 'Finding your location…';
    case 'denied':
      return 'Location access is off. Turn it on in Settings, or search for a place instead.';
    case 'unavailable':
      return "Couldn't get your location. Try again, or search for a place instead.";
    case 'unsupported':
      return `${status.message}. Try searching for a place instead.`;
    case 'error':
      return status.message;
  }
}

type UseMyLocationProps = {
  onFound: (location: Location) => void;
};

export function UseMyLocation({ onFound }: UseMyLocationProps) {
  const styles = useStyles();
  const { status, locate } = useMyLocation(onFound);
  const message = describeStatus(status);

  return (
    <View style={styles.container}>
      <Button
        title="Use my location"
        variant="outline"
        size="sm"
        loading={status.kind === 'locating'}
        onPress={locate}
        accessibilityHint="Finds the nearest supported place to you"
      />
      {message ? (
        <Text
          variant="caption"
          style={styles.message}
          accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
