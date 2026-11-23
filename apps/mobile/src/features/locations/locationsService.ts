import { apiGet } from '~/api/httpClient';
import type { LocationSearchFilters } from '~/api/queryKeys';

import type { Location } from './types';

export async function searchLocations(
  filters: LocationSearchFilters,
  signal?: AbortSignal
): Promise<Location[]> {
  const { data } = await apiGet<Location[]>('/locations/search', {
    params: { q: filters.q, type: filters.type },
    signal,
  });
  return data;
}

export async function getPopularLocations(
  signal?: AbortSignal
): Promise<Location[]> {
  const { data } = await apiGet<Location[]>('/locations/popular', { signal });
  return data;
}
