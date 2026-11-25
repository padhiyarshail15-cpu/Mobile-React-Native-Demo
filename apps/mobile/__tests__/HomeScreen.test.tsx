import { fireEvent, screen } from '@testing-library/react-native';

import { fetchHomeClimate } from '../src/features/home/climateService';
import { sampleHomeClimate } from '../src/features/home/sampleClimate';
import type { HomeClimate } from '../src/features/home/types';
import { useSelectedLocationStore } from '../src/features/locations/selectedLocationStore';
import type { Location } from '../src/features/locations/types';
import HomeScreen, { type HomeScreenProps } from '../src/screens/HomeScreen';
import { renderWithProviders } from '../src/test-utils/renderWithProviders';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

jest.mock('../src/features/home/climateService', () => ({
  fetchHomeClimate: jest.fn(),
}));

const mockedFetch = fetchHomeClimate as jest.MockedFunction<
  typeof fetchHomeClimate
>;

function renderHome() {
  const navigate = jest.fn();
  const navigation = { navigate } as unknown as HomeScreenProps['navigation'];
  renderWithProviders(
    <HomeScreen navigation={navigation} route={{} as never} />
  );
  return { navigate };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockedFetch.mockResolvedValue(sampleHomeClimate);
    useSelectedLocationStore.setState({ selected: null });
  });

  it('shows the loading state before data arrives', () => {
    mockedFetch.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(screen.getByTestId('loading-state')).toBeOnTheScreen();
  });

  it('shows the sample banner, the anomaly and the baseline label', async () => {
    renderHome();

    expect(await screen.findByText('27.4 °C')).toBeOnTheScreen();
    expect(screen.getByText('SAMPLE DATA')).toBeOnTheScreen();
    expect(
      screen.getByText('Anomaly +1.2 °C vs 1991–2020 baseline')
    ).toBeOnTheScreen();
    expect(screen.getByText('Annual mean · 2026')).toBeOnTheScreen();
  });

  it('shows humidity, rain and solar tiles with units', async () => {
    renderHome();

    expect(await screen.findByText('62%')).toBeOnTheScreen();
    expect(screen.getByText('812 mm')).toBeOnTheScreen();
    expect(screen.getByText('5.6')).toBeOnTheScreen();
    expect(screen.getByText('Solar (kWh/m²/d)')).toBeOnTheScreen();
  });

  it('labels the source, baseline and current year', async () => {
    renderHome();

    expect(
      await screen.findByText(
        'Source: NASA POWER (Reanalysis) · ~50 km grid · Baseline 1991–2020 · Current year 2026'
      )
    ).toBeOnTheScreen();
  });

  it('shows the error state and retries on press', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network down'));
    renderHome();

    expect(await screen.findByText('Network down')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('27.4 °C')).toBeOnTheScreen();
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('shows unavailable copy instead of a zero when the annual mean is missing', async () => {
    const unavailable: HomeClimate = {
      ...sampleHomeClimate,
      isSample: false,
      annualMeanTempC: null,
      anomalyC: null,
      humidityPct: null,
      insight: null,
    };
    mockedFetch.mockResolvedValue(unavailable);
    renderHome();

    expect(await screen.findByText('Data not available')).toBeOnTheScreen();
    expect(screen.queryByText('SAMPLE DATA')).toBeNull();
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
  });

  it('opens Ask AI from quick actions', async () => {
    const { navigate } = renderHome();

    fireEvent.press(await screen.findByRole('button', { name: 'Ask AI' }));

    expect(navigate).toHaveBeenCalledWith('AskAi');
  });

  it('disables quick actions that are not built yet', async () => {
    renderHome();

    await screen.findByText('27.4 °C');

    expect(screen.getByRole('button', { name: 'History' })).toBeDisabled();
  });

  describe('selected location header', () => {
    const mumbai: Location = {
      id: 2,
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

    it('shows the default place before anything is selected', async () => {
      renderHome();

      expect(await screen.findByText('Ahmedabad, IN')).toBeOnTheScreen();
    });

    it('shows the selected place and its type', async () => {
      useSelectedLocationStore.setState({ selected: mumbai });
      renderHome();

      expect(
        await screen.findByText('Mumbai, Maharashtra, IN')
      ).toBeOnTheScreen();
      expect(screen.getByText('City')).toBeOnTheScreen();
      expect(screen.queryByText('Ahmedabad, IN')).toBeNull();
    });

    it('discloses the representative point for a state', async () => {
      useSelectedLocationStore.setState({
        selected: {
          ...mumbai,
          id: 19,
          name: 'Gujarat',
          level: 'state',
          admin1: 'Gujarat',
          representativeNote:
            'Representative point: state capital (Gandhinagar). Not a state-wide average.',
        },
      });
      renderHome();

      expect(await screen.findByText('Gujarat, IN')).toBeOnTheScreen();
      expect(
        screen.getByText(
          'State · Representative point: state capital (Gandhinagar). Not a state-wide average.'
        )
      ).toBeOnTheScreen();
    });

    it('says the numbers are sample values for every place', async () => {
      useSelectedLocationStore.setState({ selected: mumbai });
      renderHome();

      expect(
        await screen.findByText(/the same for every place/)
      ).toBeOnTheScreen();
    });

    it('opens Explore from the Change button', async () => {
      const { navigate } = renderHome();
      await screen.findByText('27.4 °C');

      fireEvent.press(screen.getByRole('button', { name: 'Change' }));

      expect(navigate).toHaveBeenCalledWith('Explore');
    });
  });
});
