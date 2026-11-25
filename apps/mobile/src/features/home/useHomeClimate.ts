import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '~/api/queryKeys';

import { fetchHomeClimate } from './climateService';
import type { HomeClimateState } from './types';

// Server state comes from React Query. The shape HomeScreen reads is unchanged.
export function useHomeClimate() {
  const query = useQuery({
    queryKey: queryKeys.climate.home(),
    queryFn: fetchHomeClimate,
  });

  let state: HomeClimateState;
  if (query.isPending) {
    state = { status: 'loading' };
  } else if (query.isError) {
    state = {
      status: 'error',
      message:
        query.error instanceof Error ? query.error.message : 'Unknown error',
    };
  } else {
    state = { status: 'ready', data: query.data };
  }

  return {
    state,
    retry: () => {
      query.refetch();
    },
  };
}
