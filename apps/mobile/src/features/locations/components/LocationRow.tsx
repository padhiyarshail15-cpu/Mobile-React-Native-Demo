import { Pressable } from 'react-native';

import { Card, Text } from '@repo/ui';

import { LOCATION_LEVEL_LABELS, type Location } from '../types';

import { useStyles } from './LocationRow.styles';

// "City · Gujarat · IN"; the state is skipped when it is the place's own name.
export function describeLocation(location: Location): string {
  return [
    LOCATION_LEVEL_LABELS[location.level],
    location.admin1 && location.admin1 !== location.name
      ? location.admin1
      : null,
    location.countryCode,
  ]
    .filter(Boolean)
    .join(' · ');
}

type LocationRowProps = {
  location: Location;
  onPress: (location: Location) => void;
};

export function LocationRow({ location, onPress }: LocationRowProps) {
  const styles = useStyles();
  const description = describeLocation(location);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${location.name}, ${description}`}
      onPress={() => onPress(location)}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.row}>
        <Text variant="heading">{location.name}</Text>
        <Text variant="caption" muted>
          {description}
        </Text>
        {location.representativeNote ? (
          <Text variant="caption" style={styles.note}>
            {location.representativeNote}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
