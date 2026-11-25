import type { Queryable } from '../../database/types';

import type {
  Location,
  LocationLevel,
  NearestLocation,
  SearchParams,
} from './locations.types';

export interface LocationsRepository {
  search(params: SearchParams): Promise<Location[]>;
  popular(limit: number): Promise<Location[]>;
  nearest(
    lat: number,
    lon: number,
    maxKm: number
  ): Promise<NearestLocation | null>;
  findById(id: number): Promise<Location | null>;
}

// pg returns bigint and numeric columns as strings, so they are converted below.
interface LocationRow {
  id: string;
  name: string;
  level: LocationLevel;
  country_code: string;
  admin1: string | null;
  lat: string;
  lon: string;
  representative_note: string | null;
  is_popular: boolean;
  region: string | null;
  coordinate_source: string;
}

const COLUMNS = `id, name, level, country_code, admin1, lat, lon,
  representative_note, is_popular, region, coordinate_source`;

function toLocation(row: LocationRow): Location {
  return {
    id: Number(row.id),
    name: row.name,
    level: row.level,
    countryCode: row.country_code,
    admin1: row.admin1,
    lat: Number(row.lat),
    lon: Number(row.lon),
    region: row.region,
    isPopular: row.is_popular,
    representativeNote: row.representative_note,
    coordinateSource: row.coordinate_source,
  };
}

// In LIKE patterns, % and _ are wildcards and \ is the escape character.
// Without this, searching for "%" would match every row.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function createLocationsRepository(db: Queryable): LocationsRepository {
  return {
    async search({ q, type, region, limit }) {
      const params: unknown[] = [];
      const add = (value: unknown): string => {
        params.push(value);
        return `$${params.length}`;
      };

      const where = ['supported'];
      // Only ranked when there is a query; ORDER BY <number> would mean "column N".
      let rankOrder = '';

      if (q) {
        const lowered = q.toLowerCase();
        const exact = add(lowered);
        const pattern = add(escapeLike(lowered));
        // Match on the name anywhere, or on the start of the state/province name,
        // so typing "guj" also lists the places in Gujarat.
        where.push(
          `(lower(name) LIKE '%' || ${pattern} || '%'
            OR lower(admin1) LIKE ${pattern} || '%')`
        );
        rankOrder = `CASE
          WHEN lower(name) = ${exact} THEN 0
          WHEN lower(name) LIKE ${pattern} || '%' THEN 1
          WHEN lower(name) LIKE '%' || ${pattern} || '%' THEN 2
          ELSE 3
        END, `;
      }
      if (type) {
        where.push(`level = ${add(type)}`);
      }
      if (region) {
        where.push(`lower(region) = ${add(region.toLowerCase())}`);
      }

      const limitParam = add(limit);
      const { rows } = await db.query<LocationRow>(
        `SELECT ${COLUMNS}
         FROM locations
         WHERE ${where.join(' AND ')}
         ORDER BY ${rankOrder}is_popular DESC, name, id
         LIMIT ${limitParam}`,
        params
      );
      return rows.map(toLocation);
    },

    async popular(limit) {
      const { rows } = await db.query<LocationRow>(
        `SELECT ${COLUMNS}
         FROM locations
         WHERE supported AND is_popular
         ORDER BY name
         LIMIT $1`,
        [limit]
      );
      return rows.map(toLocation);
    },

    async nearest(lat, lon, maxKm) {
      // Haversine: great-circle distance between two lat/lon points on a sphere
      // of radius 6371 km. Only cities and districts count; a state's point is
      // just its capital, so it is not a meaningful "nearest place".
      const { rows } = await db.query<LocationRow & { distance_km: number }>(
        `WITH distances AS (
           SELECT ${COLUMNS},
             6371 * 2 * asin(least(1, sqrt(
               power(sin(radians(lat::float8 - $1::float8) / 2), 2) +
               cos(radians($1::float8)) * cos(radians(lat::float8)) *
               power(sin(radians(lon::float8 - $2::float8) / 2), 2)
             ))) AS distance_km
           FROM locations
           WHERE supported AND level IN ('city', 'district')
         )
         SELECT * FROM distances
         WHERE distance_km <= $3::float8
         ORDER BY distance_km, name
         LIMIT 1`,
        [lat, lon, maxKm]
      );
      const row = rows[0];
      return row
        ? { ...toLocation(row), distanceKm: Number(row.distance_km) }
        : null;
    },

    async findById(id) {
      const { rows } = await db.query<LocationRow>(
        `SELECT ${COLUMNS} FROM locations WHERE id = $1 AND supported`,
        [id]
      );
      return rows[0] ? toLocation(rows[0]) : null;
    },
  };
}
