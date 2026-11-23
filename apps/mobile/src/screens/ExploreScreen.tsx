import { useState } from 'react';

import { FlatList, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Chip,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Text,
} from '@repo/ui';
import { LocationRow } from '~/features/locations/components/LocationRow';
import { SearchInput } from '~/features/locations/components/SearchInput';
import { TypeFilterSheet } from '~/features/locations/components/TypeFilterSheet';
import {
  MIN_QUERY_LENGTH,
  isSearchActive,
  useLocationSearchQuery,
  usePopularLocationsQuery,
} from '~/features/locations/queries';
import { useRecentsStore } from '~/features/locations/recentsStore';
import {
  LOCATION_LEVEL_LABELS,
  type Location,
  type LocationLevel,
} from '~/features/locations/types';
import { useDebouncedValue } from '~/hooks/useDebouncedValue';

import { useStyles } from './ExploreScreen.styles';

export const SEARCH_DEBOUNCE_MS = 300;

export default function ExploreScreen() {
  const styles = useStyles();
  const [text, setText] = useState('');
  const [type, setType] = useState<LocationLevel | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const recents = useRecentsStore(state => state.recents);
  const addRecent = useRecentsStore(state => state.addRecent);
  const clearRecents = useRecentsStore(state => state.clearRecents);

  const trimmed = text.trim();
  const debounced = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const filters = {
    q: debounced.length >= MIN_QUERY_LENGTH ? debounced : undefined,
    type,
  };
  const searching = isSearchActive(filters);

  const search = useLocationSearchQuery(filters);
  const popular = usePopularLocationsQuery();
  const list = searching ? search : popular;

  const showShortHint = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;
  const rows = list.data ?? [];

  const header = (
    <View style={styles.header}>
      <Header title="Explore" />
      <SearchInput value={text} onChangeText={setText} />
      <Chip
        label={`Type: ${type ? LOCATION_LEVEL_LABELS[type] : 'All'}`}
        selected={type !== undefined}
        onPress={() => setSheetOpen(true)}
        accessibilityHint="Opens the type filter"
      />
      {showShortHint ? (
        <Text variant="caption" style={styles.hint}>
          Type at least {MIN_QUERY_LENGTH} characters to search.
        </Text>
      ) : null}

      {!searching && recents.length > 0 ? (
        <View>
          <View style={styles.sectionTitle}>
            <Text variant="heading">Recent</Text>
            <Chip label="Clear" onPress={clearRecents} />
          </View>
          {recents.map(location => (
            <LocationRow
              key={location.id}
              location={location}
              onPress={addRecent}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.sectionTitle}>
        <Text variant="heading">{searching ? 'Results' : 'Popular'}</Text>
      </View>
    </View>
  );

  let empty = null;
  if (list.isPending) {
    empty = <LoadingState message="Searching…" />;
  } else if (list.isError) {
    empty = (
      <ErrorState
        message={list.error.message}
        onRetry={() => {
          list.refetch();
        }}
      />
    );
  } else if (rows.length === 0) {
    empty = (
      <EmptyState
        title="No locations found"
        message="Check the spelling, or try a different search or type filter."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList<Location>
        data={list.isError ? [] : rows}
        keyExtractor={location => String(location.id)}
        renderItem={({ item }) => (
          <LocationRow location={item} onPress={addRecent} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ?? undefined}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
      <TypeFilterSheet
        visible={sheetOpen}
        selected={type}
        onSelect={next => {
          setType(next);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
