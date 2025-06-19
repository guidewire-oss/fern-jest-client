/**
 * Test setup file for fern-jest-client
 */

// Set test environment variables
process.env.FERN_PROJECT_ID = 'fern-jest-client-test';
process.env.FERN_REPORTER_BASE_URL = 'http://localhost:8090';
process.env.FERN_DEBUG = 'true';

// Mock console methods for testing
global.console = {
  ...console,
  // Capture console outputs for testing
  log: jest.fn(console.log),
  warn: jest.fn(console.warn),
  error: jest.fn(console.error),
};