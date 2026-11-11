import type { ReactElement } from 'react';

import { Text } from 'react-native';

import ReactTestRenderer, { act } from 'react-test-renderer';

import { Button } from './Button';

function render(element: ReactElement) {
  let renderer!: ReturnType<typeof ReactTestRenderer.create>;

  act(() => {
    renderer = ReactTestRenderer.create(element);
  });

  return renderer;
}

describe('Button', () => {
  it('renders the title', () => {
    const renderer = render(<Button title="Save" />);

    expect(renderer.root.findByType(Text).props.children).toBe('Save');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<Button title="Save" onPress={onPress} />);

    act(() => {
      renderer.root
        .findByProps({ accessibilityRole: 'button' })
        .props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled while loading', () => {
    const renderer = render(<Button title="Save" loading />);

    expect(
      renderer.root.findByProps({ accessibilityRole: 'button' }).props.disabled
    ).toBe(true);
  });
});
