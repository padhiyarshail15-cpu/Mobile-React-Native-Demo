const createJestConfig = ({ displayName, ...overrides } = {}) => ({
  displayName,
  preset: '@react-native/jest-preset',
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  ...overrides,
});

module.exports = { createJestConfig };
