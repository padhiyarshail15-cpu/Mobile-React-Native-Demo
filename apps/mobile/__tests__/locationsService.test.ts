import { apiGet } from '../src/api/httpClient';
import {
  getNearestLocation,
  getPopularLocations,
  searchLocations,
} from '../src/features/locations/locationsService';

jest.mock('../src/api/httpClient', () => ({ apiGet: jest.fn() }));

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;

const ahmedabad = {
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

describe('locationsService', () => {
  it('searches with only the filters the API understands', async () => {
    mockedApiGet.mockResolvedValue({ data: [ahmedabad], meta: {} });
    const signal = new AbortController().signal;

    const result = await searchLocations({ q: 'ahm', type: 'city' }, signal);

    expect(result).toEqual([ahmedabad]);
    expect(mockedApiGet).toHaveBeenCalledWith('/locations/search', {
      params: { q: 'ahm', type: 'city' },
      signal,
    });
  });

  it('loads the popular places', async () => {
    mockedApiGet.mockResolvedValue({ data: [ahmedabad], meta: {} });

    await expect(getPopularLocations()).resolves.toEqual([ahmedabad]);
    expect(mockedApiGet).toHaveBeenCalledWith('/locations/popular', {
      signal: undefined,
    });
  });

  it('asks for the nearest place and returns a plain location without the distance', async () => {
    mockedApiGet.mockResolvedValue({
      data: { ...ahmedabad, distanceKm: 12.3 },
      meta: { maxDistanceKm: 150 },
    });

    const result = await getNearestLocation({ lat: 23.1, lon: 72.6 });

    expect(result).toEqual(ahmedabad);
    expect(result).not.toHaveProperty('distanceKm');
    expect(mockedApiGet).toHaveBeenCalledWith('/locations/nearest', {
      params: { lat: 23.1, lon: 72.6 },
      signal: undefined,
    });
  });
});
