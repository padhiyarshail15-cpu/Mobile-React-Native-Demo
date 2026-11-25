import type { Pool } from 'pg';

import { createLogger } from '../../config/logger';
import { createPool } from '../../database/pool';

import {
  createLocationsRepository,
  type LocationsRepository,
} from './locations.repository';

// These run real SQL against a seeded database (read-only queries). They are
// skipped unless TEST_DATABASE_URL is set, so `yarn test` never needs a database:
//   TEST_DATABASE_URL="$DATABASE_URL" yarn workspace api test
const url = process.env.TEST_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('locations repository (real database)', () => {
  let pool: Pool;
  let repository: LocationsRepository;

  beforeAll(() => {
    pool = createPool(url as string, createLogger('silent'));
    repository = createLocationsRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  const names = (list: Array<{ name: string }>) => list.map(l => l.name);

  describe('search', () => {
    it('finds a city by prefix and returns typed numbers', async () => {
      const results = await repository.search({ q: 'ahm', limit: 20 });

      expect(results[0].name).toBe('Ahmedabad');
      expect(typeof results[0].id).toBe('number');
      expect(results[0].lat).toBeCloseTo(23.02, 2);
    });

    it('is case-insensitive', async () => {
      const results = await repository.search({ q: 'AHMEDABAD', limit: 20 });

      expect(names(results)).toContain('Ahmedabad');
    });

    it('ranks an exact name before partial matches', async () => {
      const results = await repository.search({ q: 'delhi', limit: 20 });

      expect(results[0].name).toBe('Delhi');
    });

    it('lists the state first, then its places, for a state name', async () => {
      const results = await repository.search({ q: 'gujarat', limit: 20 });

      expect(results[0]).toMatchObject({ name: 'Gujarat', level: 'state' });
      expect(names(results)).toEqual(
        expect.arrayContaining(['Ahmedabad', 'Surat', 'Kachchh'])
      );
    });

    it('returns an empty list when nothing matches', async () => {
      await expect(
        repository.search({ q: 'zzzzzz', limit: 20 })
      ).resolves.toEqual([]);
    });

    it('treats % and _ as plain characters, not wildcards', async () => {
      await expect(repository.search({ q: '%%', limit: 20 })).resolves.toEqual(
        []
      );
      await expect(repository.search({ q: '__', limit: 20 })).resolves.toEqual(
        []
      );
    });

    it('is safe against SQL injection text and leaves the table intact', async () => {
      const attack = await repository.search({
        q: "'; DROP TABLE locations; --",
        limit: 20,
      });
      const after = await repository.search({ q: 'ahm', limit: 20 });

      expect(attack).toEqual([]);
      expect(names(after)).toContain('Ahmedabad');
    });

    it('filters by type', async () => {
      const results = await repository.search({ type: 'state', limit: 50 });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(l => l.level === 'state')).toBe(true);
    });

    it('filters by region, ignoring case', async () => {
      const results = await repository.search({
        region: 'west india',
        limit: 50,
      });

      expect(names(results)).toEqual(
        expect.arrayContaining(['Ahmedabad', 'Mumbai'])
      );
      expect(results.every(l => l.region === 'West India')).toBe(true);
    });

    it('combines type and region', async () => {
      const results = await repository.search({
        type: 'state',
        region: 'West India',
        limit: 50,
      });

      expect(names(results).sort()).toEqual(['Gujarat', 'Maharashtra']);
    });

    it('returns nothing for a filter combination with no rows', async () => {
      await expect(
        repository.search({ type: 'country', region: 'West India', limit: 50 })
      ).resolves.toEqual([]);
    });

    it('respects the limit', async () => {
      const results = await repository.search({ q: 'a', limit: 3 });

      expect(results).toHaveLength(3);
    });
  });

  describe('popular', () => {
    it('returns only popular places, including Ahmedabad', async () => {
      const results = await repository.popular(20);

      expect(names(results)).toContain('Ahmedabad');
      expect(results.every(l => l.isPopular)).toBe(true);
    });
  });

  describe('nearest', () => {
    it('finds the city at the exact coordinates with distance 0', async () => {
      const found = await repository.nearest(23.02, 72.57, 150);

      expect(found?.name).toBe('Ahmedabad');
      expect(found?.distanceKm).toBeCloseTo(0, 1);
    });

    it('computes the great-circle distance (1 degree of latitude is about 111.2 km)', async () => {
      const found = await repository.nearest(24.02, 72.57, 150);

      expect(found?.name).toBe('Ahmedabad');
      expect(found?.distanceKm).toBeCloseTo(111.2, 0);
    });

    it('returns null when the nearest place is beyond the cut-off', async () => {
      await expect(repository.nearest(24.02, 72.57, 100)).resolves.toBeNull();
    });

    it('returns null in the middle of an ocean', async () => {
      await expect(repository.nearest(0, -30, 150)).resolves.toBeNull();
    });

    it('never returns a state or country as the nearest place', async () => {
      // Thiruvananthapuram (the Kerala state point) is more than 150 km from the nearest city.
      await expect(repository.nearest(8.52, 76.94, 150)).resolves.toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the location for a known id', async () => {
      const [ahmedabad] = await repository.search({ q: 'ahmedabad', limit: 1 });

      await expect(repository.findById(ahmedabad.id)).resolves.toEqual(
        ahmedabad
      );
    });

    it('returns null for an unknown id', async () => {
      await expect(repository.findById(999_999_999)).resolves.toBeNull();
    });
  });
});
