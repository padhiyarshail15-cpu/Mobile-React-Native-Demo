import { apiGet } from '~/api/httpClient';
import type { LocationSearchFilters } from '~/api/queryKeys';

import type { Coordinates, Location } from './types';

// The API also returns distanceKm; the app stores a plain Location, so it is dropped here.
export async function getNearestLocation(
  coords: Coordinates,
  signal?: AbortSignal
): Promise<Location> {
  const { data } = await apiGet<Location & { distanceKm: number }>(
    '/locations/nearest',
    { params: { lat: coords.lat, lon: coords.lon }, signal }
  );
  const { distanceKm, ...location } = data;
  return location;
}

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
