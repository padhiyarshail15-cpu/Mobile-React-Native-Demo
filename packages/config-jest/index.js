const createJestConfig = ({ displayName, ...overrides } = {}) => ({
  displayName,
  preset: '@react-native/jest-preset',
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Jenkins reads reports/junit.xml from each package (relative to the package cwd Jest runs in).
  // Resolved here because nmHoistingLimits keeps jest-junit out of the consuming packages.
  ...(process.env.CI
    ? {
        reporters: [
          'default',
          [
            require.resolve('jest-junit'),
            { outputDirectory: 'reports', outputName: 'junit.xml' },
          ],
        ],
      }
    : {}),
  ...overrides,
});

module.exports = { createJestConfig };
