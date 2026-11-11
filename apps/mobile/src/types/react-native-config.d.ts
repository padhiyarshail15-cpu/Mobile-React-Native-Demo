import 'react-native-config';

declare module 'react-native-config' {
  // Keep in sync with apps/mobile/.env.development and .env.production
  export interface NativeConfig {
    APP_ENV?: string;
    APP_DISPLAY_NAME?: string;
    API_URL?: string;
  }
}
