import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  describeLocation,
  formatPlace,
} from '../src/features/locations/format';
import { useSelectedLocationStore } from '../src/features/locations/selectedLocationStore';
import type { Location } from '../src/features/locations/types';

const base: Location = {
  id: 1,
  name: 'Mumbai',
  level: 'city',
  countryCode: 'IN',
  admin1: 'Maharashtra',
  lat: 19.08,
  lon: 72.88,
  region: 'West India',
  isPopular: true,
  representativeNote: null,
  coordinateSource: 'Seed data',
};

describe('selected location store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSelectedLocationStore.setState({ selected: null });
  });

  it('starts with nothing selected', () => {
    expect(useSelectedLocationStore.getState().selected).toBeNull();
  });

  it('replaces the selection', () => {
    const { select } = useSelectedLocationStore.getState();
    select(base);
    select({ ...base, id: 2, name: 'Pune' });

    expect(useSelectedLocationStore.getState().selected?.name).toBe('Pune');
  });

  it('survives an app restart', async () => {
    useSelectedLocationStore.getState().select(base);
    await new Promise<void>(resolve => setImmediate(resolve));
    const raw = (await AsyncStorage.getItem(
      'climatelens.selected-location'
    )) as string;
    expect(JSON.parse(raw).state.select).toBeUndefined();

    useSelectedLocationStore.setState({ selected: null });
    await AsyncStorage.setItem('climatelens.selected-location', raw);
    await useSelectedLocationStore.persist.rehydrate();

    expect(useSelectedLocationStore.getState().selected?.name).toBe('Mumbai');
  });
});

describe('location formatting', () => {
  it('describes a city with its state and country', () => {
    expect(describeLocation(base)).toBe('City · Maharashtra · IN');
    expect(formatPlace(base)).toBe('Mumbai, Maharashtra, IN');
  });

  it("skips the state when it is the place's own name", () => {
    const state: Location = {
      ...base,
      name: 'Gujarat',
      level: 'state',
      admin1: 'Gujarat',
    };

    expect(describeLocation(state)).toBe('State · IN');
    expect(formatPlace(state)).toBe('Gujarat, IN');
  });

  it('handles a country with no state', () => {
    const country: Location = {
      ...base,
      name: 'India',
      level: 'country',
      admin1: null,
    };

    expect(describeLocation(country)).toBe('Country · IN');
    expect(formatPlace(country)).toBe('India, IN');
  });
});
