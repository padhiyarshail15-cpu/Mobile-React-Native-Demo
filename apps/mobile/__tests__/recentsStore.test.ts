import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  MAX_RECENTS,
  useRecentsStore,
} from '../src/features/locations/recentsStore';
import type { Location } from '../src/features/locations/types';

const place = (id: number, name = `Place ${id}`): Location => ({
  id,
  name,
  level: 'city',
  countryCode: 'IN',
  admin1: 'Gujarat',
  lat: 23,
  lon: 72,
  region: 'West India',
  isPopular: false,
  representativeNote: null,
  coordinateSource: 'Seed data',
});

describe('recents store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useRecentsStore.setState({ recents: [] });
  });

  it('puts the newest place first', () => {
    useRecentsStore.getState().addRecent(place(1));
    useRecentsStore.getState().addRecent(place(2));

    expect(useRecentsStore.getState().recents.map(l => l.id)).toEqual([2, 1]);
  });

  it('moves a repeated place to the front instead of duplicating it', () => {
    const { addRecent } = useRecentsStore.getState();
    addRecent(place(1));
    addRecent(place(2));
    addRecent(place(1));

    expect(useRecentsStore.getState().recents.map(l => l.id)).toEqual([1, 2]);
  });

  it(`keeps at most ${MAX_RECENTS} places, dropping the oldest`, () => {
    const { addRecent } = useRecentsStore.getState();
    for (let id = 1; id <= MAX_RECENTS + 3; id++) {
      addRecent(place(id));
    }

    const ids = useRecentsStore.getState().recents.map(l => l.id);
    expect(ids).toHaveLength(MAX_RECENTS);
    expect(ids[0]).toBe(MAX_RECENTS + 3);
    expect(ids).not.toContain(1);
  });

  it('clears everything', () => {
    useRecentsStore.getState().addRecent(place(1));
    useRecentsStore.getState().clearRecents();

    expect(useRecentsStore.getState().recents).toEqual([]);
  });

  it('writes only the data to storage, then restores it after a restart', async () => {
    useRecentsStore.getState().addRecent(place(7, 'Pune'));
    await new Promise<void>(resolve => setImmediate(resolve));

    const raw = (await AsyncStorage.getItem('climatelens.recents')) as string;
    const saved = JSON.parse(raw);
    expect(saved.state.recents[0].name).toBe('Pune');
    expect(saved.state.addRecent).toBeUndefined();
    expect(saved.version).toBe(1);

    // Simulate an app restart: memory is empty, but the saved JSON is still there.
    useRecentsStore.setState({ recents: [] });
    await AsyncStorage.setItem('climatelens.recents', raw);
    await useRecentsStore.persist.rehydrate();

    expect(useRecentsStore.getState().recents[0].name).toBe('Pune');
  });
});
