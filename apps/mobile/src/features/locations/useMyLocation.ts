import { useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '~/api/errorMapper';

import { GeolocationError, getCurrentCoordinates } from './geolocationService';
import { nearestLocationQuery } from './queries';
import type { Location } from './types';

export type MyLocationStatus =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'denied' } // the user refused (or switched off) location permission
  | { kind: 'unavailable' } // no position: GPS off, no signal, or timed out
  | { kind: 'unsupported'; message: string } // no supported place within range
  | { kind: 'error'; message: string }; // the API or network failed

const NO_SUPPORTED_LOCATION = 'NO_SUPPORTED_LOCATION';

function toStatus(error: unknown): MyLocationStatus {
  if (error instanceof GeolocationError) {
    return error.reason === 'denied'
      ? { kind: 'denied' }
      : { kind: 'unavailable' };
  }
  if (error instanceof ApiError) {
    return error.code === NO_SUPPORTED_LOCATION
      ? { kind: 'unsupported', message: error.message }
      : { kind: 'error', message: error.message };
  }
  return { kind: 'error', message: 'Something went wrong. Please try again.' };
}

// "Use my location": ask for permission, read the position once, find the nearest
// supported place through the API, and hand it to onFound.
export function useMyLocation(onFound: (location: Location) => void) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<MyLocationStatus>({ kind: 'idle' });
  // A ref, not state: a second tap in the same moment must be ignored immediately.
  const busy = useRef(false);

  const locate = async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setStatus({ kind: 'locating' });
    try {
      const coords = await getCurrentCoordinates();
      const location = await queryClient.fetchQuery(
        nearestLocationQuery(coords)
      );
      setStatus({ kind: 'idle' });
      onFound(location);
    } catch (error) {
      setStatus(toStatus(error));
    } finally {
      busy.current = false;
    }
  };

  return { status, locate };
}
