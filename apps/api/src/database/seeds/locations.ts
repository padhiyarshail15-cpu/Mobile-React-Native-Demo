import type { LocationLevel } from '../../modules/locations/locations.types';

export type { LocationLevel };

export interface LocationSeed {
  name: string;
  level: LocationLevel;
  countryCode: string;
  admin1?: string;
  lat: number;
  lon: number;
  region: string;
  isPopular?: boolean;
  // Required for state, district and country rows: which point stands in for the area.
  note?: string;
  // Name used only to cross-check coordinates against the geocoder (state rows use their capital).
  checkName?: string;
}

export const COORDINATE_SOURCE =
  'Seed data: approximate centre point (0.01° precision), cross-checked against Open-Meteo geocoding (GeoNames)';

const city = (
  name: string,
  admin1: string,
  lat: number,
  lon: number,
  region: string,
  isPopular = false
): LocationSeed => ({
  name,
  level: 'city',
  countryCode: 'IN',
  admin1,
  lat,
  lon,
  region,
  isPopular,
});

const globalCity = (
  name: string,
  countryCode: string,
  lat: number,
  lon: number,
  region: string,
  admin1?: string,
  isPopular = false
): LocationSeed => ({
  name,
  level: 'city',
  countryCode,
  admin1,
  lat,
  lon,
  region,
  isPopular,
});

const state = (
  name: string,
  capital: string,
  lat: number,
  lon: number,
  region: string
): LocationSeed => ({
  name,
  level: 'state',
  countryCode: 'IN',
  admin1: name,
  lat,
  lon,
  region,
  checkName: capital,
  note: `Representative point: state capital (${capital}). Not a state-wide average.`,
});

export const LOCATION_SEEDS: LocationSeed[] = [
  // Indian cities (7 popular)
  city('Ahmedabad', 'Gujarat', 23.02, 72.57, 'West India', true),
  city('Mumbai', 'Maharashtra', 19.08, 72.88, 'West India', true),
  city('Delhi', 'Delhi', 28.61, 77.21, 'North India', true),
  city('Bengaluru', 'Karnataka', 12.97, 77.59, 'South India', true),
  city('Chennai', 'Tamil Nadu', 13.08, 80.27, 'South India', true),
  city('Kolkata', 'West Bengal', 22.57, 88.36, 'East India', true),
  city('Hyderabad', 'Telangana', 17.38, 78.49, 'South India', true),
  city('Pune', 'Maharashtra', 18.52, 73.86, 'West India'),
  city('Jaipur', 'Rajasthan', 26.91, 75.79, 'North India'),
  city('Surat', 'Gujarat', 21.17, 72.83, 'West India'),
  city('Lucknow', 'Uttar Pradesh', 26.85, 80.95, 'North India'),
  city('Kochi', 'Kerala', 9.93, 76.27, 'South India'),
  city('Chandigarh', 'Chandigarh', 30.73, 76.78, 'North India'),
  city('Bhopal', 'Madhya Pradesh', 23.26, 77.41, 'Central India'),
  city('Patna', 'Bihar', 25.59, 85.14, 'East India'),
  city('Guwahati', 'Assam', 26.14, 91.74, 'Northeast India'),
  city('Visakhapatnam', 'Andhra Pradesh', 17.69, 83.22, 'South India'),
  city('Nagpur', 'Maharashtra', 21.15, 79.09, 'Central India'),

  // Indian states (representative point = capital)
  state('Gujarat', 'Gandhinagar', 23.22, 72.65, 'West India'),
  state('Maharashtra', 'Mumbai', 19.08, 72.88, 'West India'),
  state('Rajasthan', 'Jaipur', 26.91, 75.79, 'North India'),
  state('Kerala', 'Thiruvananthapuram', 8.52, 76.94, 'South India'),
  state('Tamil Nadu', 'Chennai', 13.08, 80.27, 'South India'),
  state('Karnataka', 'Bengaluru', 12.97, 77.59, 'South India'),
  state('West Bengal', 'Kolkata', 22.57, 88.36, 'East India'),
  state('Uttar Pradesh', 'Lucknow', 26.85, 80.95, 'North India'),

  // Districts (representative point = district headquarters)
  {
    name: 'Kachchh',
    level: 'district',
    countryCode: 'IN',
    admin1: 'Gujarat',
    lat: 23.25,
    lon: 69.67,
    region: 'West India',
    checkName: 'Bhuj',
    note: 'Representative point: district headquarters (Bhuj). Not a district-wide average.',
  },
  {
    name: 'Darjeeling',
    level: 'district',
    countryCode: 'IN',
    admin1: 'West Bengal',
    lat: 27.04,
    lon: 88.26,
    region: 'East India',
    checkName: 'Darjeeling',
    note: 'Representative point: district headquarters (Darjeeling). Not a district-wide average.',
  },

  // Global cities (1 popular)
  globalCity('London', 'GB', 51.51, -0.13, 'Europe', 'England', true),
  globalCity('Paris', 'FR', 48.86, 2.35, 'Europe', 'Île-de-France'),
  globalCity('New York', 'US', 40.71, -74.01, 'North America', 'New York'),
  globalCity('Tokyo', 'JP', 35.68, 139.69, 'East Asia', 'Tokyo'),
  globalCity('Sydney', 'AU', -33.87, 151.21, 'Oceania', 'New South Wales'),
  globalCity('São Paulo', 'BR', -23.55, -46.63, 'South America', 'São Paulo'),
  globalCity('Cairo', 'EG', 30.04, 31.24, 'Africa', 'Cairo'),
  globalCity('Lagos', 'NG', 6.52, 3.38, 'Africa', 'Lagos'),
  globalCity('Dubai', 'AE', 25.2, 55.27, 'Middle East', 'Dubai'),
  globalCity('Singapore', 'SG', 1.35, 103.82, 'Southeast Asia'),

  // Countries (representative point = capital)
  {
    name: 'India',
    level: 'country',
    countryCode: 'IN',
    lat: 28.61,
    lon: 77.21,
    region: 'South Asia',
    checkName: 'New Delhi',
    note: 'Representative point: capital (New Delhi). Not a country-wide average.',
  },
  {
    name: 'United Kingdom',
    level: 'country',
    countryCode: 'GB',
    lat: 51.51,
    lon: -0.13,
    region: 'Europe',
    checkName: 'London',
    note: 'Representative point: capital (London). Not a country-wide average.',
  },
  {
    name: 'United States',
    level: 'country',
    countryCode: 'US',
    lat: 38.91,
    lon: -77.04,
    region: 'North America',
    checkName: 'Washington',
    note: 'Representative point: capital (Washington, D.C.). Not a country-wide average.',
  },
  {
    name: 'Australia',
    level: 'country',
    countryCode: 'AU',
    lat: -35.28,
    lon: 149.13,
    region: 'Oceania',
    checkName: 'Canberra',
    note: 'Representative point: capital (Canberra). Not a country-wide average.',
  },
];
