import type { Pool } from 'pg';

import {
  COORDINATE_SOURCE,
  LOCATION_SEEDS,
  type LocationSeed,
} from './seeds/locations';

// The conflict target must match the unique index in 001_create_locations.sql exactly.
const UPSERT = `
  INSERT INTO locations
    (name, level, country_code, admin1, lat, lon, representative_note,
     is_popular, region, supported, coordinate_source)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
  ON CONFLICT (lower(name), level, country_code, COALESCE(lower(admin1), ''))
  DO UPDATE SET
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    representative_note = EXCLUDED.representative_note,
    is_popular = EXCLUDED.is_popular,
    region = EXCLUDED.region,
    coordinate_source = EXCLUDED.coordinate_source
`;

function values(seed: LocationSeed): unknown[] {
  return [
    seed.name,
    seed.level,
    seed.countryCode,
    seed.admin1 ?? null,
    seed.lat,
    seed.lon,
    seed.note ?? null,
    seed.isPopular ?? false,
    seed.region,
    COORDINATE_SOURCE,
  ];
}

export async function seedLocations(
  pool: Pool,
  seeds: LocationSeed[] = LOCATION_SEEDS
): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const seed of seeds) {
      await client.query(UPSERT, values(seed));
    }
    await client.query('COMMIT');
    return seeds.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
