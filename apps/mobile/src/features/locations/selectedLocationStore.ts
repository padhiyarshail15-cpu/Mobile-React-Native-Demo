import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Location } from './types';

interface SelectedLocationState {
  // null means "nothing chosen yet": Home falls back to its default place.
  selected: Location | null;
  select: (location: Location) => void;
}

// Client state: the place the user chose. It is the user's choice, not a copy of server data.
export const useSelectedLocationStore = create<SelectedLocationState>()(
  persist(
    set => ({
      selected: null,
      select: location => set({ selected: location }),
    }),
    {
      name: 'climatelens.selected-location',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ selected: state.selected }),
    }
  )
);
