import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '../src/api/errorMapper';
import {
  getPopularLocations,
  searchLocations,
} from '../src/features/locations/locationsService';
import { useRecentsStore } from '../src/features/locations/recentsStore';
import type { Location } from '../src/features/locations/types';
import ExploreScreen, {
  SEARCH_DEBOUNCE_MS,
} from '../src/screens/ExploreScreen';
import { renderWithProviders } from '../src/test-utils/renderWithProviders';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

jest.mock('../src/features/locations/locationsService', () => ({
  searchLocations: jest.fn(),
  getPopularLocations: jest.fn(),
}));

const mockedSearch = searchLocations as jest.MockedFunction<
  typeof searchLocations
>;
const mockedPopular = getPopularLocations as jest.MockedFunction<
  typeof getPopularLocations
>;

const place = (overrides: Partial<Location>): Location => ({
  id: 1,
  name: 'Ahmedabad',
  level: 'city',
  countryCode: 'IN',
  admin1: 'Gujarat',
  lat: 23.02,
  lon: 72.57,
  region: 'West India',
  isPopular: true,
  representativeNote: null,
  coordinateSource: 'Seed data',
  ...overrides,
});

const ahmedabad = place({});
const mumbai = place({ id: 2, name: 'Mumbai', admin1: 'Maharashtra' });
const gujarat = place({
  id: 19,
  name: 'Gujarat',
  level: 'state',
  isPopular: false,
  representativeNote: 'Representative point: state capital (Gandhinagar).',
});

const searchBox = () => screen.getByLabelText('Search locations');

// Fake timers make the 300 ms debounce instant and keep state updates inside act().
function typeSearch(text: string) {
  fireEvent.changeText(searchBox(), text);
  act(() => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });
}

describe('ExploreScreen', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    useRecentsStore.setState({ recents: [] });
    mockedPopular.mockResolvedValue([ahmedabad, mumbai]);
    mockedSearch.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the loading state, then the popular places', async () => {
    mockedPopular.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ExploreScreen />);

    expect(screen.getByTestId('loading-state')).toBeOnTheScreen();
  });

  it('lists popular places with their type and state', async () => {
    renderWithProviders(<ExploreScreen />);

    expect(await screen.findByText('Ahmedabad')).toBeOnTheScreen();
    expect(screen.getByText('Mumbai')).toBeOnTheScreen();
    expect(screen.getByText('City · Gujarat · IN')).toBeOnTheScreen();
    expect(screen.getByText('Popular')).toBeOnTheScreen();
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it('shows an error with the reason and retries on press', async () => {
    mockedPopular.mockRejectedValueOnce(
      new ApiError('server_waking', 'The server is waking up.')
    );
    renderWithProviders(<ExploreScreen />);

    expect(
      await screen.findByText('The server is waking up.')
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Ahmedabad')).toBeOnTheScreen();
    expect(mockedPopular).toHaveBeenCalledTimes(2);
  });

  it('searches after the user stops typing and shows the results', async () => {
    mockedSearch.mockResolvedValue([gujarat, ahmedabad]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    typeSearch('guj');

    expect(await screen.findByText('Gujarat')).toBeOnTheScreen();
    expect(screen.getByText('Results')).toBeOnTheScreen();
    expect(screen.queryByText('Mumbai')).toBeNull();
    expect(mockedSearch).toHaveBeenCalledWith(
      { q: 'guj', type: undefined },
      expect.anything()
    );
  });

  it('sends one request for a burst of keystrokes (debounce)', async () => {
    mockedSearch.mockResolvedValue([ahmedabad]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    fireEvent.changeText(searchBox(), 'ah');
    fireEvent.changeText(searchBox(), 'ahm');
    fireEvent.changeText(searchBox(), 'ahme');
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(mockedSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await screen.findByText('Results');
    expect(mockedSearch).toHaveBeenCalledTimes(1);
    expect(mockedSearch).toHaveBeenCalledWith(
      { q: 'ahme', type: undefined },
      expect.anything()
    );
  });

  it('asks for two characters and does not search for one', async () => {
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    fireEvent.changeText(searchBox(), 'a');
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);
    });

    expect(
      screen.getByText('Type at least 2 characters to search.')
    ).toBeOnTheScreen();
    expect(mockedSearch).not.toHaveBeenCalled();
    expect(screen.getByText('Popular')).toBeOnTheScreen();
  });

  it('shows the no-results state', async () => {
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    typeSearch('zzzz');

    expect(await screen.findByText('No locations found')).toBeOnTheScreen();
  });

  it('shows a search error and recovers on retry', async () => {
    mockedSearch.mockRejectedValueOnce(
      new ApiError('network', "Can't reach the server.")
    );
    mockedSearch.mockResolvedValue([ahmedabad]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    typeSearch('ahm');
    expect(
      await screen.findByText("Can't reach the server.")
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Ahmedabad')).toBeOnTheScreen();
    expect(screen.queryByTestId('error-state')).toBeNull();
  });

  it('goes back to the popular list when the search is cleared', async () => {
    mockedSearch.mockResolvedValue([ahmedabad]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');
    typeSearch('ahm');
    await screen.findByText('Results');

    fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(await screen.findByText('Popular')).toBeOnTheScreen();
    expect(await screen.findByText('Mumbai')).toBeOnTheScreen();
  });

  it('filters by type from the sheet and closes it', async () => {
    mockedSearch.mockResolvedValue([gujarat]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    fireEvent.press(screen.getByRole('button', { name: 'Type: All' }));
    expect(screen.getByText('Filter by type')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'State' }));

    expect(await screen.findByText('Results')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Type: State' })
    ).toBeOnTheScreen();
    expect(screen.queryByText('Filter by type')).toBeNull();
    expect(mockedSearch).toHaveBeenCalledWith(
      { q: undefined, type: 'state' },
      expect.anything()
    );
  });

  it('combines a text query with the type filter', async () => {
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');
    fireEvent.press(screen.getByRole('button', { name: 'Type: All' }));
    fireEvent.press(screen.getByRole('button', { name: 'City' }));

    typeSearch('ahm');

    await waitFor(() =>
      expect(mockedSearch).toHaveBeenLastCalledWith(
        { q: 'ahm', type: 'city' },
        expect.anything()
      )
    );
    expect(await screen.findByText('No locations found')).toBeOnTheScreen();
  });

  it('shows the representative point for states, districts and countries', async () => {
    mockedSearch.mockResolvedValue([gujarat]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');

    typeSearch('guj');

    expect(
      await screen.findByText(
        'Representative point: state capital (Gandhinagar).'
      )
    ).toBeOnTheScreen();
    expect(screen.getByText('State · IN')).toBeOnTheScreen();
  });

  it('remembers opened places under Recent, and clears them', async () => {
    renderWithProviders(<ExploreScreen />);
    fireEvent.press(
      await screen.findByRole('button', {
        name: 'Mumbai, City · Maharashtra · IN',
      })
    );

    expect(await screen.findByText('Recent')).toBeOnTheScreen();
    expect(useRecentsStore.getState().recents.map(l => l.name)).toEqual([
      'Mumbai',
    ]);

    fireEvent.press(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByText('Recent')).toBeNull();
    expect(useRecentsStore.getState().recents).toEqual([]);
  });
});
