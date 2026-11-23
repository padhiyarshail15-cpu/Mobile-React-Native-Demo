import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { queryKeys, type LocationSearchFilters } from '~/api/queryKeys';

import {
  getNearestLocation,
  getPopularLocations,
  searchLocations,
} from './locationsService';
import type { Coordinates } from './types';

// The API rejects a query shorter than 2 characters.
export const MIN_QUERY_LENGTH = 2;

// A search runs when there is a usable query or a type filter.
export function isSearchActive({ q, type }: LocationSearchFilters): boolean {
  return (q?.length ?? 0) >= MIN_QUERY_LENGTH || type !== undefined;
}

export function useLocationSearchQuery(filters: LocationSearchFilters) {
  return useQuery({
    queryKey: queryKeys.locations.search(filters),
    queryFn: ({ signal }) => searchLocations(filters, signal),
    enabled: isSearchActive(filters),
    // Keep showing the previous results while the next ones load: no flicker while typing.
    placeholderData: keepPreviousData,
  });
}

export function usePopularLocationsQuery() {
  return useQuery({
    queryKey: queryKeys.locations.popular(),
    queryFn: ({ signal }) => getPopularLocations(signal),
  });
}

// Used with queryClient.fetchQuery from a button press: a one-shot lookup that still
// gets the cache, the abort signal and the shared retry rule. Coordinates are in the
// key, so the same ~1 km area is served from cache.
export function nearestLocationQuery(coords: Coordinates) {
  return queryOptions({
    queryKey: queryKeys.locations.nearest(coords),
    queryFn: ({ signal }) => getNearestLocation(coords, signal),
  });
}
