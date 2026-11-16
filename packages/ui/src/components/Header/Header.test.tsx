import { render, screen } from '@testing-library/react-native';

import { Text } from '../Text';

import { Header } from './Header';

describe('Header', () => {
  it('renders the title as a header with an optional subtitle', () => {
    render(<Header title="Home" subtitle="Climate overview" />);

    expect(screen.getByRole('header', { name: 'Home' })).toBeOnTheScreen();
    expect(screen.getByText('Climate overview')).toBeOnTheScreen();
  });

  it('renders the right slot when provided', () => {
    render(<Header title="Home" right={<Text>Edit</Text>} />);

    expect(screen.getByText('Edit')).toBeOnTheScreen();
  });
});
