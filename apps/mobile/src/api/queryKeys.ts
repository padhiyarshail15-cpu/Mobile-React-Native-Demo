import type { Coordinates, LocationLevel } from '~/features/locations/types';

export interface LocationSearchFilters {
  q?: string;
  type?: LocationLevel;
}

// One factory for every query key, so a key is never typed by hand twice.
// Put every input that changes the result into the key.
export const queryKeys = {
  locations: {
    all: ['locations'] as const,
    search: (filters: LocationSearchFilters) =>
      ['locations', 'search', filters] as const,
    popular: () => ['locations', 'popular'] as const,
    nearest: (coords: Coordinates) => ['locations', 'nearest', coords] as const,
  },
  climate: {
    home: () => ['climate', 'home'] as const,
  },
};
