import Config, { type NativeConfig } from 'react-native-config';

export type AppEnv = 'development' | 'production';

const APP_ENVS: readonly AppEnv[] = ['development', 'production'];

function required(key: keyof NativeConfig): string {
  const value = Config[key];
  if (value == null || value === '') {
    throw new Error(
      `Missing env variable "${key}". Check apps/mobile/.env.* and rebuild the native app.`
    );
  }
  return value;
}

function parseAppEnv(value: string): AppEnv {
  if (!(APP_ENVS as readonly string[]).includes(value)) {
    throw new Error(
      `Invalid APP_ENV "${value}". Expected one of: ${APP_ENVS.join(', ')}.`
    );
  }
  return value as AppEnv;
}

const appEnv = parseAppEnv(required('APP_ENV'));

export const env = {
  appEnv,
  appDisplayName: required('APP_DISPLAY_NAME'),
  apiUrl: required('API_URL'),
  isProduction: appEnv === 'production',
} as const;

export type Env = typeof env;
