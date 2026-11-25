import { render, screen } from '@testing-library/react-native';

import AppContainer from '../src/app/AppContainer';

// SafeAreaProvider renders nothing until native insets arrive, so use the library's Jest mock.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

describe('AppContainer', () => {
  it('renders the home tab inside the navigator', async () => {
    render(<AppContainer />);

    expect(await screen.findByText('27.4 °C')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Explore' })).toBeOnTheScreen();
  });
});
