import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from './Chip';

describe('Chip', () => {
  it('renders its label as a button', () => {
    render(<Chip label="Popular" />);

    expect(screen.getByRole('button', { name: 'Popular' })).toBeOnTheScreen();
  });

  it('exposes the selected state', () => {
    render(<Chip label="Popular" selected />);

    expect(screen.getByRole('button')).toBeSelected();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Chip label="Popular" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Popular' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not respond when disabled', () => {
    const onPress = jest.fn();
    render(<Chip label="Popular" disabled onPress={onPress} />);

    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'Popular' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
