import { Alert } from 'react-native';

import { render, screen, fireEvent } from '@testing-library/react-native';

import AppContainer from '../src/app/AppContainer';
import HomeScreen from '../src/screens/HomeScreen';

// SafeAreaProvider renders nothing until native insets arrive, so use the library's Jest mock.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

describe('HomeScreen', () => {
  it('shows the loaded env', () => {
    render(<HomeScreen />);

    expect(screen.getByTestId('env-label')).toHaveTextContent(
      'Loaded env: development'
    );
  });

  it('alerts when the button is pressed', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Press me please' }));

    expect(alert).toHaveBeenCalledWith('Button pressed');
    alert.mockRestore();
  });
});

describe('AppContainer', () => {
  it('renders the home screen', () => {
    render(<AppContainer />);

    expect(screen.getByTestId('env-label')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Press me please' })
    ).toBeOnTheScreen();
  });
});
