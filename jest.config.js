/**
 * Jest Configuration — ProFish (#437)
 *
 * Module aliases, transforms, and mocks for React Native testing.
 */

module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',

  // Module resolution
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },

  // Transform
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|react-native|' +
      '@react-navigation|' +
      '@react-native-firebase|' +
      '@react-native-async-storage|' +
      '@rnmapbox|' +
      'react-native-reanimated|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'react-native-vector-icons|' +
      'react-native-maps|' +
      'react-native-gesture-handler|' +
      'i18next|' +
      'react-i18next' +
      ')/)',
  ],

  // Setup
  setupFiles: ['<rootDir>/__mocks__/setup.js'],

  // Coverage (#440: 70%+ target)
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/store/**/*.js',
    'src/config/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'clover'],

  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.js',
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/__tests__/**/*.test.js',
  ],

  // Timeouts
  testTimeout: 10000,

  // Module directories
  moduleDirectories: ['node_modules', 'src'],

  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
};
