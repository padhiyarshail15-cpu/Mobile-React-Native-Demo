import { COORDINATE_SOURCE, LOCATION_SEEDS } from './locations';

describe('LOCATION_SEEDS', () => {
  it('has 30-50 unique places', () => {
    const keys = LOCATION_SEEDS.map(s =>
      [s.name, s.level, s.countryCode, s.admin1 ?? ''].join('|').toLowerCase()
    );

    expect(LOCATION_SEEDS.length).toBeGreaterThanOrEqual(30);
    expect(LOCATION_SEEDS.length).toBeLessThanOrEqual(50);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps every coordinate valid and in the two-decimal seed precision', () => {
    for (const s of LOCATION_SEEDS) {
      expect(Math.abs(s.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(s.lon)).toBeLessThanOrEqual(180);
      expect(Math.abs(Number((s.lat * 100).toFixed(6)) % 1)).toBe(0);
      expect(Math.abs(Number((s.lon * 100).toFixed(6)) % 1)).toBe(0);
    }
  });

  it('discloses the representative point for every area (non-city)', () => {
    const areas = LOCATION_SEEDS.filter(s => s.level !== 'city');

    expect(areas.length).toBeGreaterThan(0);
    for (const s of areas) {
      expect(s.note).toMatch(/Representative point/);
    }
  });

  it('flags a small set of popular places including Ahmedabad', () => {
    const popular = LOCATION_SEEDS.filter(s => s.isPopular).map(s => s.name);

    expect(popular).toContain('Ahmedabad');
    expect(popular.length).toBeGreaterThanOrEqual(5);
    expect(popular.length).toBeLessThanOrEqual(10);
  });

  it('labels the coordinate source as seed data', () => {
    expect(COORDINATE_SOURCE).toMatch(/^Seed data/);
  });
});
