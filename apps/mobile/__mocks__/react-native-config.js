// react-native-config needs its native module, which is unavailable in Jest.
module.exports = {
  __esModule: true,
  default: {
    APP_ENV: 'development',
    APP_DISPLAY_NAME: 'RN Demo Test',
    API_URL: 'https://test.api.example.com',
  },
};
module.exports.Config = module.exports.default;
