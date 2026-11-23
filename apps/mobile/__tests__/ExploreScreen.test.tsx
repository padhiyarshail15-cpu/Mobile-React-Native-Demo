import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '../src/api/errorMapper';
import {
  GeolocationError,
  getCurrentCoordinates,
} from '../src/features/locations/geolocationService';
import {
  getNearestLocation,
  getPopularLocations,
  searchLocations,
} from '../src/features/locations/locationsService';
import { useRecentsStore } from '../src/features/locations/recentsStore';
import { useSelectedLocationStore } from '../src/features/locations/selectedLocationStore';
import type { Location } from '../src/features/locations/types';
import ExploreScreenBase, {
  SEARCH_DEBOUNCE_MS,
  type ExploreScreenProps,
} from '../src/screens/ExploreScreen';
import { renderWithProviders } from '../src/test-utils/renderWithProviders';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

jest.mock('../src/features/locations/locationsService', () => ({
  searchLocations: jest.fn(),
  getPopularLocations: jest.fn(),
  getNearestLocation: jest.fn(),
}));

// Keep the real GeolocationError class; only the native read is faked.
jest.mock('../src/features/locations/geolocationService', () => ({
  ...jest.requireActual('../src/features/locations/geolocationService'),
  getCurrentCoordinates: jest.fn(),
}));

const mockedSearch = searchLocations as jest.MockedFunction<
  typeof searchLocations
>;
const mockedPopular = getPopularLocations as jest.MockedFunction<
  typeof getPopularLocations
>;
const mockedNearest = getNearestLocation as jest.MockedFunction<
  typeof getNearestLocation
>;
const mockedCoordinates = getCurrentCoordinates as jest.MockedFunction<
  typeof getCurrentCoordinates
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

const navigate = jest.fn();

// The screen needs navigation props; only navigate() is used.
function ExploreScreen() {
  return (
    <ExploreScreenBase
      navigation={{ navigate } as unknown as ExploreScreenProps['navigation']}
      route={{} as never}
    />
  );
}

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
    useSelectedLocationStore.setState({ selected: null });
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

  it('selects a tapped place, remembers it, and returns to Home', async () => {
    renderWithProviders(<ExploreScreen />);

    fireEvent.press(
      await screen.findByRole('button', {
        name: 'Mumbai, City · Maharashtra · IN',
      })
    );

    expect(useSelectedLocationStore.getState().selected?.name).toBe('Mumbai');
    expect(useRecentsStore.getState().recents.map(l => l.name)).toEqual([
      'Mumbai',
    ]);
    expect(navigate).toHaveBeenCalledWith('Home');
  });

  it('selects a place from search results too', async () => {
    mockedSearch.mockResolvedValue([gujarat]);
    renderWithProviders(<ExploreScreen />);
    await screen.findByText('Mumbai');
    typeSearch('guj');

    fireEvent.press(
      await screen.findByRole('button', { name: 'Gujarat, State · IN' })
    );

    expect(useSelectedLocationStore.getState().selected?.id).toBe(19);
    expect(navigate).toHaveBeenCalledWith('Home');
  });

  it('selects a place again from the Recent list, moving it to the front', async () => {
    useRecentsStore.setState({ recents: [mumbai, ahmedabad] });
    renderWithProviders(<ExploreScreen />);
    expect(await screen.findByText('Recent')).toBeOnTheScreen();

    // The Recent row comes first; the same place also appears under Popular.
    fireEvent.press(
      screen.getAllByRole('button', {
        name: 'Ahmedabad, City · Gujarat · IN',
      })[0]
    );

    expect(useSelectedLocationStore.getState().selected?.name).toBe(
      'Ahmedabad'
    );
    expect(useRecentsStore.getState().recents.map(l => l.name)).toEqual([
      'Ahmedabad',
      'Mumbai',
    ]);
    expect(navigate).toHaveBeenCalledWith('Home');
  });

  it('shows and clears the Recent list', async () => {
    useRecentsStore.setState({ recents: [mumbai] });
    renderWithProviders(<ExploreScreen />);

    expect(await screen.findByText('Recent')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByText('Recent')).toBeNull();
    expect(useRecentsStore.getState().recents).toEqual([]);
  });

  describe('Use my location', () => {
    const pressUseMyLocation = () =>
      fireEvent.press(screen.getByRole('button', { name: 'Use my location' }));

    it('selects the nearest place and returns to Home', async () => {
      mockedCoordinates.mockResolvedValue({ lat: 23.1, lon: 72.6 });
      mockedNearest.mockResolvedValue(ahmedabad);
      renderWithProviders(<ExploreScreen />);
      await screen.findByText('Mumbai');

      pressUseMyLocation();

      await waitFor(() => expect(navigate).toHaveBeenCalledWith('Home'));
      expect(mockedNearest).toHaveBeenCalledWith(
        { lat: 23.1, lon: 72.6 },
        expect.anything()
      );
      expect(useSelectedLocationStore.getState().selected?.name).toBe(
        'Ahmedabad'
      );
      expect(useRecentsStore.getState().recents.map(l => l.name)).toEqual([
        'Ahmedabad',
      ]);
    });

    it('shows progress while it looks for you, and ignores a second tap', async () => {
      mockedCoordinates.mockReturnValue(new Promise(() => {}));
      renderWithProviders(<ExploreScreen />);
      await screen.findByText('Mumbai');

      pressUseMyLocation();

      expect(
        await screen.findByText('Finding your location…')
      ).toBeOnTheScreen();
      fireEvent.press(screen.getByRole('button', { name: /Use my location/ }));
      expect(mockedCoordinates).toHaveBeenCalledTimes(1);
    });

    it('explains a refused permission and never calls the API', async () => {
      mockedCoordinates.mockRejectedValue(new GeolocationError('denied'));
      renderWithProviders(<ExploreScreen />);
      await screen.findByText('Mumbai');

      pressUseMyLocation();

      expect(
        await screen.findByText(
          'Location access is off. Turn it on in Settings, or search for a place instead.'
        )
      ).toBeOnTheScreen();
      expect(mockedNearest).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      // The rest of the screen keeps working.
      expect(screen.getByText('Mumbai')).toBeOnTheScreen();
    });

    it.each([['unavailable'], ['timeout']] as const)(
      'explains when the position cannot be read (%s)',
      async reason => {
        mockedCoordinates.mockRejectedValue(new GeolocationError(reason));
        renderWithProviders(<ExploreScreen />);
        await screen.findByText('Mumbai');

        pressUseMyLocation();

        expect(
          await screen.findByText(
            "Couldn't get your location. Try again, or search for a place instead."
          )
        ).toBeOnTheScreen();
      }
    );

    it('says so when no supported place is within range', async () => {
      mockedCoordinates.mockResolvedValue({ lat: 0, lon: -30 });
      mockedNearest.mockRejectedValue(
        new ApiError(
          'not_found',
          'No supported location within 150 km',
          404,
          'NO_SUPPORTED_LOCATION'
        )
      );
      renderWithProviders(<ExploreScreen />);
      await screen.findByText('Mumbai');

      pressUseMyLocation();

      expect(
        await screen.findByText(
          'No supported location within 150 km. Try searching for a place instead.'
        )
      ).toBeOnTheScreen();
      expect(useSelectedLocationStore.getState().selected).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('shows the reason when the API or network fails', async () => {
      mockedCoordinates.mockResolvedValue({ lat: 23.1, lon: 72.6 });
      mockedNearest.mockRejectedValue(
        new ApiError('network', "Can't reach the server.")
      );
      renderWithProviders(<ExploreScreen />);
      await screen.findByText('Mumbai');

      pressUseMyLocation();

      expect(
        await screen.findByText("Can't reach the server.")
      ).toBeOnTheScreen();
    });

    it('works on a second try after permission is granted in Settings', async () => {
      mockedCoordinates.mockRejectedValueOnce(new GeolocationError('denied'));
      mockedCoordinates.mockResolvedValue({ lat: 23.1, lon: 72.6 });
      mockedNearest.mockResolvedValue(ahmedabad);
      renderWithProviders(<ExploreScreen />);
      await screen.findByText('Mumbai');
      pressUseMyLocation();
      await screen.findByText(/Location access is off/);

      pressUseMyLocation();

      await waitFor(() => expect(navigate).toHaveBeenCalledWith('Home'));
      expect(screen.queryByText(/Location access is off/)).toBeNull();
    });
  });
});
