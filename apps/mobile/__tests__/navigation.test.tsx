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
  it('shows the four tabs and opens Home first', async () => {
    renderNavigation();

    ['Home', 'Explore', 'Ask AI', 'Profile'].forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    });
    expect(await screen.findByText('27.4 °C')).toBeOnTheScreen();
  });

  it('switches to the tapped tab', async () => {
    renderNavigation();
    await screen.findByText('27.4 °C');

    const askAiButtons = screen.getAllByRole('button', { name: 'Ask AI' });
    // The Home quick action comes first; the tab bar item is last.
    fireEvent.press(askAiButtons[askAiButtons.length - 1]);

    expect(screen.getByTestId('placeholder-title')).toHaveTextContent('Ask AI');
  });
});
