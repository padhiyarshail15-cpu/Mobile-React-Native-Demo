/**
 * @format
 */

import React from 'react';

import { Alert, StyleSheet } from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ReactTestRenderer from 'react-test-renderer';

import { Button } from '@repo/ui';

import AppContainer from '../src/app/AppContainer';
import HomeScreen from '../src/screens/HomeScreen';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<AppContainer />);
  });
});

test('keeps the home content inside every safe-area edge', () => {
  let renderer!: ReturnType<typeof ReactTestRenderer.create>;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}>
        <HomeScreen />
      </SafeAreaProvider>
    );
  });

  const safeArea = renderer.root.findByType(SafeAreaView);
  expect(
    renderer.root.findByProps({ testID: 'env-label' }).props.children
  ).toBe('Loaded env: development');
  expect(safeArea.props.edges).toEqual(['top', 'right', 'bottom', 'left']);
  expect(StyleSheet.flatten(safeArea.props.style)).toEqual({ flex: 1 });

  const button = safeArea.findByType(Button);
  expect(button.props.title).toBe('Press me please');
  expect(StyleSheet.flatten(button.parent?.props.style)).toMatchObject({
    flex: 1,
    paddingVertical: 16,
  });

  const alert = jest.spyOn(Alert, 'alert');
  try {
    ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(alert).toHaveBeenCalledWith('Button pressed');
  } finally {
    alert.mockRestore();
  }
});
