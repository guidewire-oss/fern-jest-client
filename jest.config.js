module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  // Custom reporter configuration for self-testing (disabled during unit tests)
  reporters: process.env.FERN_SELF_TEST === 'true' ? [
    'default',
    ['<rootDir>/dist/index.js', {
      projectId: 'fern-jest-client-test',
      baseUrl: process.env.FERN_REPORTER_BASE_URL || 'http://localhost:8090'
    }]
  ] : ['default']
};