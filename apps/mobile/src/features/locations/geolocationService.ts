import Geolocation, {
  type GeolocationError as NativeGeolocationError,
} from '@react-native-community/geolocation';

import type { Coordinates } from './types';

export type GeolocationFailure = 'denied' | 'unavailable' | 'timeout';

export class GeolocationError extends Error {
  constructor(readonly reason: GeolocationFailure) {
    super(`Geolocation failed: ${reason}`);
    this.name = 'GeolocationError';
  }
}

// City-level accuracy is enough, so ask for the cheap, coarse fix and accept a
// position up to 5 minutes old.
const OPTIONS = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 5 * 60 * 1000,
};

// 2 decimals is about 1 km. The precise position never leaves this module.
const roundCoordinate = (value: number): number =>
  Math.round(value * 100) / 100;

function toGeolocationError(error: NativeGeolocationError): GeolocationError {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return new GeolocationError('denied');
    case 3: // TIMEOUT
      return new GeolocationError('timeout');
    default: // POSITION_UNAVAILABLE and anything unknown
      return new GeolocationError('unavailable');
  }
}

// Asks for permission if needed, then reads the position once.
export function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    Geolocation.requestAuthorization(
      () =>
        Geolocation.getCurrentPosition(
          position =>
            resolve({
              lat: roundCoordinate(position.coords.latitude),
              lon: roundCoordinate(position.coords.longitude),
            }),
          error => reject(toGeolocationError(error)),
          OPTIONS
        ),
      error => reject(toGeolocationError(error))
    );
  });
}
