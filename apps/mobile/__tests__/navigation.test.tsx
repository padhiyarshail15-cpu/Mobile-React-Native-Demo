import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RootNavigator from '../src/navigation/RootNavigator';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

function renderNavigation() {
  return render(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

describe('RootNavigator', () => {
  it('shows the four tabs and opens Home first', () => {
    renderNavigation();

    ['Home', 'Explore', 'Ask AI', 'Profile'].forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    });
    expect(screen.getByTestId('env-label')).toBeOnTheScreen();
  });

  it('switches to the tapped tab', () => {
    renderNavigation();

    fireEvent.press(screen.getByRole('button', { name: 'Ask AI' }));

    expect(screen.getByTestId('placeholder-title')).toHaveTextContent('Ask AI');
  });
});
