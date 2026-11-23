export type LocationLevel = 'city' | 'district' | 'state' | 'country';

// Mirrors the API's location payload (apps/api/src/modules/locations).
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

export const LOCATION_LEVEL_LABELS: Record<LocationLevel, string> = {
  city: 'City',
  district: 'District',
  state: 'State',
  country: 'Country',
};
