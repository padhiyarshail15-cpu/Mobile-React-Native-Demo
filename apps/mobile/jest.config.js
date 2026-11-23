const { createJestConfig } = require('@repo/config-jest');

module.exports = createJestConfig({
  displayName: 'mobile',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|react-native-screens)/)',
  ],
});
