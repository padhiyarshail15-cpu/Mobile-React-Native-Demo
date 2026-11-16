import { useCallback, useEffect, useState } from 'react';

import { fetchHomeClimate } from './climateService';
import type { HomeClimateState } from './types';

export function useHomeClimate() {
  const [state, setState] = useState<HomeClimateState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    fetchHomeClimate()
      .then(data => {
        if (active) {
          setState({ status: 'ready', data });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt(count => count + 1), []);

  return { state, retry };
}
