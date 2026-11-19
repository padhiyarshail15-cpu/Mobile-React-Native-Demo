export const LOCATION_LEVELS = [
  'city',
  'district',
  'state',
  'country',
] as const;

export type LocationLevel = (typeof LOCATION_LEVELS)[number];

// The shape every locations endpoint returns (camelCase for the app).
export interface Location {
  id: number;
  name: string;
  level: LocationLevel;
  countryCode: string;
  admin1: string | null;
  lat: number;
  lon: number;
  region: string | null;
  isPopular: boolean;
  representativeNote: string | null;
  coordinateSource: string;
}

export interface NearestLocation extends Location {
  distanceKm: number;
}

export interface SearchParams {
  q?: string;
  type?: LocationLevel;
  region?: string;
  limit: number;
}
