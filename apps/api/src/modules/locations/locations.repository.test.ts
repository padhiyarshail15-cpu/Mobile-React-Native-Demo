import { createLocationsRepository, escapeLike } from './locations.repository';

const row = {
  id: '7',
  name: 'Pune',
  level: 'city',
  country_code: 'IN',
  admin1: 'Maharashtra',
  lat: '18.52000',
  lon: '73.86000',
  representative_note: null,
  is_popular: false,
  region: 'West India',
  coordinate_source: 'Seed data',
};

function fakeDb(rows: unknown[] = []) {
  const query = jest.fn().mockResolvedValue({ rows });
  return { db: { query } as never, query };
}

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('leaves ordinary text alone', () => {
    expect(escapeLike('ahmedabad')).toBe('ahmedabad');
  });
});

describe('createLocationsRepository', () => {
  it('converts the bigint and numeric strings pg returns into numbers', async () => {
    const { db } = fakeDb([row]);

    const [location] = await createLocationsRepository(db).search({ limit: 5 });

    expect(location.id).toBe(7);
    expect(location.lat).toBe(18.52);
    expect(location.lon).toBe(73.86);
    expect(location.countryCode).toBe('IN');
    expect(location.isPopular).toBe(false);
  });

  it('keeps user input out of the SQL text (parameterized queries)', async () => {
    const attack = "'; DROP TABLE locations; --";
    const { db, query } = fakeDb();

    await createLocationsRepository(db).search({
      q: attack,
      region: "x' OR '1'='1",
      limit: 5,
    });

    const [sql, params] = query.mock.calls[0];
    expect(sql).not.toMatch(/DROP TABLE/i);
    expect(sql).not.toContain("'1'='1");
    expect(params).toContain(attack.toLowerCase());
    expect(params).toContain("x' or '1'='1");
  });

  it('numbers its placeholders to match the parameter list', async () => {
    const { db, query } = fakeDb();

    await createLocationsRepository(db).search({
      q: 'ah',
      type: 'city',
      region: 'West India',
      limit: 3,
    });

    const [sql, params] = query.mock.calls[0];
    expect(params).toEqual(['ah', 'ah', 'city', 'west india', 3]);
    expect(sql).toContain('$5');
    expect(sql).not.toContain('$6');
  });

  it('returns null from nearest and findById when there is no row', async () => {
    const repository = createLocationsRepository(fakeDb([]).db);

    await expect(repository.nearest(0, 0, 150)).resolves.toBeNull();
    await expect(repository.findById(1)).resolves.toBeNull();
  });
});
