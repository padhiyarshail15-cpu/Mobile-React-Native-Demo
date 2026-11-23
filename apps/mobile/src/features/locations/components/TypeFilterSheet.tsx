import { Modal, Pressable, View } from 'react-native';

import { Chip, Text } from '@repo/ui';
import {
  LOCATION_LEVEL_LABELS,
  type LocationLevel,
} from '~/features/locations/types';

import { useStyles } from './TypeFilterSheet.styles';

const LEVELS = Object.keys(LOCATION_LEVEL_LABELS) as LocationLevel[];

type TypeFilterSheetProps = {
  visible: boolean;
  selected: LocationLevel | undefined;
  onSelect: (type: LocationLevel | undefined) => void;
  onClose: () => void;
};

// Picking an option applies it and closes the sheet.
export function TypeFilterSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: TypeFilterSheetProps) {
  const styles = useStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable
        style={styles.overlay}
        accessibilityLabel="Close filter"
        onPress={onClose}>
        {/* A plain View stops taps inside the sheet from reaching the overlay. */}
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text variant="heading" accessibilityRole="header">
            Filter by type
          </Text>
          <View style={styles.options}>
            <Chip
              label="All"
              selected={selected === undefined}
              onPress={() => onSelect(undefined)}
            />
            {LEVELS.map(level => (
              <Chip
                key={level}
                label={LOCATION_LEVEL_LABELS[level]}
                selected={selected === level}
                onPress={() => onSelect(level)}
              />
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
