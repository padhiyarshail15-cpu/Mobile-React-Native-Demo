import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Location } from './types';

export const MAX_RECENTS = 8;

interface RecentsState {
  recents: Location[];
  addRecent: (location: Location) => void;
  clearRecents: () => void;
}

// Client state only: which places the user opened. Server data stays in React Query.
export const useRecentsStore = create<RecentsState>()(
  persist(
    set => ({
      recents: [],
      addRecent: location =>
        set(state => ({
          recents: [
            location,
            ...state.recents.filter(item => item.id !== location.id),
          ].slice(0, MAX_RECENTS),
        })),
      clearRecents: () => set({ recents: [] }),
    }),
    {
      name: 'climatelens.recents',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist the data, never the functions.
      partialize: state => ({ recents: state.recents }),
    }
  )
);
