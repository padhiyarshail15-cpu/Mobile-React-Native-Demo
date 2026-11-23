import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys, type LocationSearchFilters } from '~/api/queryKeys';

import { getPopularLocations, searchLocations } from './locationsService';

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
