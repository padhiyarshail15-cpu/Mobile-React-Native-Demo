import { AppError } from '../../middleware/AppError';

import type { LocationsRepository } from './locations.repository';
import type {
  Location,
  NearestLocation,
  SearchParams,
} from './locations.types';

export const NEAREST_MAX_KM = 150;
export const POPULAR_LIMIT = 20;

export interface LocationsService {
  search(params: SearchParams): Promise<Location[]>;
  popular(): Promise<Location[]>;
  nearest(lat: number, lon: number): Promise<NearestLocation>;
  getById(id: number): Promise<Location>;
}

// The service holds the rules ("nothing within 150 km is a 404"); the
// repository only knows SQL, and the routes only know HTTP.
export function createLocationsService(
  repository: LocationsRepository
): LocationsService {
  return {
    search: params => repository.search(params),

    popular: () => repository.popular(POPULAR_LIMIT),

    async nearest(lat, lon) {
      const found = await repository.nearest(lat, lon, NEAREST_MAX_KM);
      if (!found) {
        throw new AppError(
          404,
          'NO_SUPPORTED_LOCATION',
          `No supported location within ${NEAREST_MAX_KM} km`
        );
      }
      return { ...found, distanceKm: Math.round(found.distanceKm * 10) / 10 };
    },

    async getById(id) {
      const found = await repository.findById(id);
      if (!found) {
        throw new AppError(404, 'LOCATION_NOT_FOUND', 'Location not found');
      }
      return found;
    },
  };
}
