import { Pressable, TextInput, View } from 'react-native';

import { Text, colors } from '@repo/ui';

import { useStyles } from './SearchInput.styles';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchInput({ value, onChangeText }: SearchInputProps) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search locations"
        placeholder="Search a city, state or country"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        maxLength={100}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={styles.clear}>
          <Text variant="body" muted>
            ✕
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
