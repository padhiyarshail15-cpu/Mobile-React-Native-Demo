import { QueryClient } from '@tanstack/react-query';

import { isRetryableError } from './errorMapper';

const MINUTE = 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * MINUTE,
        gcTime: 30 * MINUTE,
        // The only place requests are retried: once, and only when the problem
        // looks temporary (offline, timeout, server waking up, 5xx).
        retry: (failureCount, error) =>
          failureCount < 1 && isRetryableError(error),
        refetchOnWindowFocus: false,
      },
    },
  });
}
