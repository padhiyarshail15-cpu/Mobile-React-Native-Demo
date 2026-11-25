import type { NativeConfig } from 'react-native-config';

import { resolveApiUrl, type Env } from '../src/config/env';

describe('resolveApiUrl', () => {
  it('points an Android emulator at the host machine instead of localhost', () => {
    expect(resolveApiUrl('http://localhost:4000/api/v1', 'android')).toBe(
      'http://10.0.2.2:4000/api/v1'
    );
    expect(resolveApiUrl('http://127.0.0.1:4000/api/v1', 'android')).toBe(
      'http://10.0.2.2:4000/api/v1'
    );
  });

  it('leaves localhost alone on iOS', () => {
    expect(resolveApiUrl('http://localhost:4000/api/v1', 'ios')).toBe(
      'http://localhost:4000/api/v1'
    );
  });

  it('never rewrites a real host, even one that starts with "localhost"', () => {
    expect(resolveApiUrl('https://api.example.com/api/v1', 'android')).toBe(
      'https://api.example.com/api/v1'
    );
    expect(resolveApiUrl('https://localhost.example.com/api', 'android')).toBe(
      'https://localhost.example.com/api'
    );
  });
});

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
