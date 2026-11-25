import type { ReactElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

// A fresh client per test: no cache leaks between tests, no retries, no waiting on gc.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  queryClient: QueryClient = createTestQueryClient()
) {
  const result = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
  return { ...result, queryClient };
}
