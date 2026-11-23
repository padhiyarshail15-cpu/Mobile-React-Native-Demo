import { useState } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '~/api/queryClient';

import App from './App';

export default function AppContainer() {
  // One client per app session; it holds the whole server-state cache.
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
