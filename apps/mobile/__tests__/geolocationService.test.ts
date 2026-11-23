import Geolocation from '@react-native-community/geolocation';

import {
  GeolocationError,
  getCurrentCoordinates,
} from '../src/features/locations/geolocationService';

const mockedAuth = Geolocation.requestAuthorization as jest.Mock;
const mockedPosition = Geolocation.getCurrentPosition as jest.Mock;

const position = (latitude: number, longitude: number) => ({
  coords: {
    latitude,
    longitude,
    altitude: null,
    accuracy: 100,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: 0,
});

const nativeError = (code: number) => ({
  code,
  message: 'native',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
});

describe('getCurrentCoordinates', () => {
  beforeEach(() => {
    mockedAuth.mockImplementation((granted: () => void) => granted());
  });

  it('rounds the position to about 1 km before returning it', async () => {
    mockedPosition.mockImplementation((ok: (p: unknown) => void) =>
      ok(position(23.022505, 72.571362))
    );

    await expect(getCurrentCoordinates()).resolves.toEqual({
      lat: 23.02,
      lon: 72.57,
    });
  });

  it('rounds negative coordinates too', async () => {
    mockedPosition.mockImplementation((ok: (p: unknown) => void) =>
      ok(position(-33.8688, -70.6693))
    );

    await expect(getCurrentCoordinates()).resolves.toEqual({
      lat: -33.87,
      lon: -70.67,
    });
  });

  it('asks for a coarse, cached position with a timeout', async () => {
    mockedPosition.mockImplementation((ok: (p: unknown) => void) =>
      ok(position(1, 2))
    );

    await getCurrentCoordinates();

    expect(mockedPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 300_000,
    });
  });

  it('fails with "denied" when permission is refused, without reading a position', async () => {
    mockedAuth.mockImplementation(
      (_granted: () => void, failed: (e: unknown) => void) =>
        failed(nativeError(1))
    );

    await expect(getCurrentCoordinates()).rejects.toMatchObject({
      name: 'GeolocationError',
      reason: 'denied',
    });
    expect(mockedPosition).not.toHaveBeenCalled();
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
    [99, 'unavailable'],
  ])('maps native error code %i to "%s"', async (code, reason) => {
    mockedPosition.mockImplementation(
      (_ok: unknown, failed: (e: unknown) => void) => failed(nativeError(code))
    );

    const error = await getCurrentCoordinates().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GeolocationError);
    expect((error as GeolocationError).reason).toBe(reason);
  });
});
