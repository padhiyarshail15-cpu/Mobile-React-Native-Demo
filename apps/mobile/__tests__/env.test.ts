import type { NativeConfig } from 'react-native-config';

import type { Env } from '../src/config/env';

const baseConfig: NativeConfig = {
  APP_ENV: 'development',
  APP_DISPLAY_NAME: 'RN Demo Test',
  API_URL: 'https://test.api.example.com',
};

const loadEnv = (overrides: NativeConfig = {}): Env => {
  let env!: Env;
  jest.isolateModules(() => {
    jest.doMock('react-native-config', () => ({
      __esModule: true,
      default: { ...baseConfig, ...overrides },
    }));
    env = jest.requireActual<{ env: Env }>('../src/config/env').env;
  });
  return env;
};

describe('env', () => {
  test('exposes typed values from react-native-config', () => {
    expect(loadEnv()).toEqual({
      appEnv: 'development',
      appDisplayName: 'RN Demo Test',
      apiUrl: 'https://test.api.example.com',
      isProduction: false,
    });
  });

  test('flags production builds', () => {
    expect(loadEnv({ APP_ENV: 'production' }).isProduction).toBe(true);
  });

  test('throws when a required variable is missing', () => {
    expect(() => loadEnv({ API_URL: '' })).toThrow(
      'Missing env variable "API_URL"'
    );
  });

  test('throws on an unknown APP_ENV', () => {
    expect(() => loadEnv({ APP_ENV: 'qa' })).toThrow('Invalid APP_ENV "qa"');
  });
});
