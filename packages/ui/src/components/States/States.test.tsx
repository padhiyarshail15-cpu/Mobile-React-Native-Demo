import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  DataUnavailable,
  EmptyState,
  ErrorState,
  LoadingState,
} from './States';

describe('state views', () => {
  it('shows a loading indicator with a message', () => {
    render(<LoadingState />);

    expect(screen.getByTestId('loading-state')).toBeOnTheScreen();
    expect(screen.getByText('Loading data…')).toBeOnTheScreen();
  });

  it('shows an error message and retries on press', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByText('Could not load data')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry action when no handler is given', () => {
    render(<ErrorState />);

    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('shows the empty state title and message', () => {
    render(<EmptyState title="No recents" message="Search for a city." />);

    expect(screen.getByText('No recents')).toBeOnTheScreen();
    expect(screen.getByText('Search for a city.')).toBeOnTheScreen();
  });

  it('shows the data unavailable copy with a default message', () => {
    render(<DataUnavailable />);

    expect(screen.getByTestId('data-unavailable-state')).toBeOnTheScreen();
    expect(screen.getByText('Data not available')).toBeOnTheScreen();
    expect(
      screen.getByText('Try a different date range or choose another location.')
    ).toBeOnTheScreen();
  });
});
