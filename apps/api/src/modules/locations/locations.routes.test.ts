import request from 'supertest';

import { createApp } from '../../app';
import { createLogger } from '../../config/logger';

import type { LocationsRepository } from './locations.repository';
import { createLocationsService } from './locations.service';
import type { Location } from './locations.types';

const ahmedabad: Location = {
  id: 1,
  name: 'Ahmedabad',
  level: 'city',
  countryCode: 'IN',
  admin1: 'Gujarat',
  lat: 23.02,
  lon: 72.57,
  region: 'West India',
  isPopular: true,
  representativeNote: null,
  coordinateSource: 'Seed data',
};

const gujarat: Location = {
  ...ahmedabad,
  id: 19,
  name: 'Gujarat',
  level: 'state',
  isPopular: false,
  representativeNote: 'Representative point: state capital (Gandhinagar).',
};

function setup() {
  const repository: jest.Mocked<LocationsRepository> = {
    search: jest.fn().mockResolvedValue([]),
    popular: jest.fn().mockResolvedValue([]),
    nearest: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
  };
  const app = createApp({
    corsOrigins: [],
    logger: createLogger('silent'),
    locations: createLocationsService(repository),
  });
  return { repository, app };
}

describe('GET /api/v1/locations/search', () => {
  it('returns matches in the data/meta envelope with the default limit', async () => {
    const { app, repository } = setup();
    repository.search.mockResolvedValue([ahmedabad]);

    const res = await request(app).get('/api/v1/locations/search?q=ahm');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [ahmedabad],
      meta: { count: 1, limit: 20 },
    });
    expect(repository.search).toHaveBeenCalledWith({ q: 'ahm', limit: 20 });
  });

  it('trims the query before searching', async () => {
    const { app, repository } = setup();

    await request(app).get('/api/v1/locations/search?q=%20%20ahm%20');

    expect(repository.search).toHaveBeenCalledWith({ q: 'ahm', limit: 20 });
  });

  it('returns 200 with an empty list when nothing matches', async () => {
    const { app } = setup();

    const res = await request(app).get('/api/v1/locations/search?q=zzzz');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], meta: { count: 0, limit: 20 } });
  });

  it('returns every match when the query is ambiguous', async () => {
    const { app, repository } = setup();
    repository.search.mockResolvedValue([gujarat, ahmedabad]);

    const res = await request(app).get('/api/v1/locations/search?q=guj');

    expect(res.body.data.map((l: Location) => l.name)).toEqual([
      'Gujarat',
      'Ahmedabad',
    ]);
    expect(res.body.meta.count).toBe(2);
  });

  it('combines q, type, region and limit', async () => {
    const { app, repository } = setup();

    await request(app).get(
      '/api/v1/locations/search?q=ah&type=city&region=West%20India&limit=5'
    );

    expect(repository.search).toHaveBeenCalledWith({
      q: 'ah',
      type: 'city',
      region: 'West India',
      limit: 5,
    });
  });

  it('allows filters without a query', async () => {
    const { app, repository } = setup();

    const res = await request(app).get('/api/v1/locations/search?type=state');

    expect(res.status).toBe(200);
    expect(repository.search).toHaveBeenCalledWith({
      type: 'state',
      limit: 20,
    });
  });

  it.each([
    ['q is a single character', '?q=a', 'q'],
    ['q is empty', '?q=', 'q'],
    ['q is repeated', '?q=ab&q=cd', 'q'],
    ['type is unknown', '?type=planet', 'type'],
    ['limit is zero', '?limit=0', 'limit'],
    ['limit is too large', '?limit=51', 'limit'],
    ['limit is not a number', '?limit=abc', 'limit'],
    ['limit is negative', '?limit=-1', 'limit'],
  ])('rejects the request when %s', async (_label, query, field) => {
    const { app, repository } = setup();

    const res = await request(app).get(`/api/v1/locations/search${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(
      res.body.error.details.map((d: { field: string }) => d.field)
    ).toContain(field);
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('does not echo the rejected value back to the client', async () => {
    const { app } = setup();

    const res = await request(app).get(
      '/api/v1/locations/search?type=%3Cscript%3E'
    );

    expect(JSON.stringify(res.body)).not.toContain('script');
  });
});

describe('GET /api/v1/locations/popular', () => {
  it('returns the popular locations', async () => {
    const { app, repository } = setup();
    repository.popular.mockResolvedValue([ahmedabad]);

    const res = await request(app).get('/api/v1/locations/popular');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [ahmedabad], meta: { count: 1 } });
    expect(repository.popular).toHaveBeenCalledWith(20);
  });
});

describe('GET /api/v1/locations/nearest', () => {
  it('returns the nearest location with a rounded distance', async () => {
    const { app, repository } = setup();
    repository.nearest.mockResolvedValue({ ...ahmedabad, distanceKm: 12.3456 });

    const res = await request(app).get(
      '/api/v1/locations/nearest?lat=23.1&lon=72.6'
    );

    expect(res.status).toBe(200);
    expect(res.body.data.distanceKm).toBe(12.3);
    expect(res.body.meta).toEqual({ maxDistanceKm: 150 });
    expect(repository.nearest).toHaveBeenCalledWith(23.1, 72.6, 150);
  });

  it('returns 404 NO_SUPPORTED_LOCATION when nothing is within range', async () => {
    const { app } = setup();

    const res = await request(app).get('/api/v1/locations/nearest?lat=0&lon=0');

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      code: 'NO_SUPPORTED_LOCATION',
      message: 'No supported location within 150 km',
    });
  });

  it.each([
    ['lat is missing', '?lon=72', 'lat'],
    ['lon is missing', '?lat=23', 'lon'],
    ['lat is out of range', '?lat=91&lon=72', 'lat'],
    ['lon is out of range', '?lat=23&lon=181', 'lon'],
    ['lat is not a number', '?lat=abc&lon=72', 'lat'],
    ['lat is empty', '?lat=&lon=72', 'lat'],
    ['lon is infinite', '?lat=23&lon=Infinity', 'lon'],
  ])('rejects the request when %s', async (_label, query, field) => {
    const { app, repository } = setup();

    const res = await request(app).get(`/api/v1/locations/nearest${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(
      res.body.error.details.map((d: { field: string }) => d.field)
    ).toContain(field);
    expect(repository.nearest).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/locations/:locationId', () => {
  it('returns the location', async () => {
    const { app, repository } = setup();
    repository.findById.mockResolvedValue(ahmedabad);

    const res = await request(app).get('/api/v1/locations/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: ahmedabad, meta: {} });
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('returns 404 LOCATION_NOT_FOUND for an unknown id', async () => {
    const { app } = setup();

    const res = await request(app).get('/api/v1/locations/999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('LOCATION_NOT_FOUND');
  });

  it.each(['abc', '0', '-1', '1.5', '12345678901234567890'])(
    'rejects the id "%s"',
    async id => {
      const { app, repository } = setup();

      const res = await request(app).get(`/api/v1/locations/${id}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(repository.findById).not.toHaveBeenCalled();
    }
  );
});

describe('database failures', () => {
  it('returns a generic 500 and never leaks the database error', async () => {
    const { app, repository } = setup();
    repository.search.mockRejectedValue(
      new Error('connection to db.secret-host.supabase.co refused')
    );

    const res = await request(app).get('/api/v1/locations/search?q=ahm');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
    expect(JSON.stringify(res.body)).not.toContain('secret-host');
  });
});
