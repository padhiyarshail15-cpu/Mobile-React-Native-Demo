import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('renders the title', () => {
    render(<Button title="Save" />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Save" disabled onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('is disabled and busy while loading', () => {
    const onPress = jest.fn();
    render(<Button title="Save" loading onPress={onPress} />);

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    expect(screen.queryByText('Save')).not.toBeOnTheScreen();
    expect(onPress).not.toHaveBeenCalled();
  });
});
