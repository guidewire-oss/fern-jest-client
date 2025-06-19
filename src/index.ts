/**
 * Main entry point for fern-jest-client
 * Exports all public APIs and utilities
 */

// Main classes and functions
export { FernApiClient, createFernClient } from './client';
export { FernReporter } from './reporter';

// Type definitions
export type {
  TestRun,
  SuiteRun,
  SpecRun,
  Tag,
  FernClientOptions,
  FernReporterConfig,
  GitInfo,
  CIInfo,
  JestTestResult,
  JestTestSuiteResult,
  JestAggregatedResult
} from './types';

// Utility functions
export {
  findGitRoot,
  getGitInfo,
  getCIInfo,
  toAbsolutePath
} from './utils/git';

export {
  mapJestResultsToTestRun,
  mapJestSuiteToSuiteRun,
  mapJestTestToSpecRun,
  generateTestSummary
} from './utils/mapper';

// Configuration constants
export {
  DEFAULT_CONFIG,
  ENV_VARS,
  getEnvVar,
  isCI,
  getWorkingDirectory
} from './config';

// Default export for Jest reporter
export { FernReporter as default } from './reporter';