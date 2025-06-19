/**
 * Data models for Fern test reporting - compatible with fern-reporter API
 * Based on the fern-ginkgo-client models
 */

export interface Tag {
  name: string;
  color?: string;
}

export interface SpecRun {
  spec_description: string;
  status: string;
  message: string;
  tags: Tag[];
  start_time: string;
  end_time: string;
}

export interface SuiteRun {
  suite_name: string;
  start_time: string;
  end_time: string;
  spec_runs: SpecRun[];
}

export interface TestRun {
  test_project_id: string;
  test_seed: number;
  start_time: string;
  end_time: string;
  git_branch: string;
  git_sha: string;
  build_trigger_actor: string;
  build_url: string;
  suite_runs: SuiteRun[];
}

// API input structure that matches fern-platform expectations
export interface CreateTestRunInput {
  project_id: string;
  run_id: string;
  branch: string;
  commit_sha: string;
  environment?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface FernClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface FernReporterConfig {
  projectId: string;
  baseUrl?: string;
  timeout?: number;
  enabled?: boolean;
}

// Jest-specific types
export interface JestTestResult {
  ancestorTitles: string[];
  duration?: number;
  failureDetails: Array<{
    message: string;
    stack?: string;
  }>;
  failureMessages: string[];
  fullName: string;
  invocations?: number;
  location?: {
    column: number;
    line: number;
  };
  numPassingAsserts: number;
  retryReasons?: string[];
  status: 'passed' | 'failed' | 'skipped' | 'pending' | 'todo' | 'disabled';
  title: string;
}

export interface JestTestSuiteResult {
  console?: any;
  coverage?: any;
  displayName?: {
    name: string;
    color?: string;
  };
  endTime: number;
  failureMessage?: string;
  leaks: boolean;
  numFailingTests: number;
  numPassingTests: number;
  numPendingTests: number;
  numTodoTests: number;
  openHandles: any[];
  perfStats: {
    end: number;
    runtime: number;
    slow: boolean;
    start: number;
  };
  skipped: boolean;
  snapshot: {
    added: number;
    fileDeleted: boolean;
    matched: number;
    unchecked: number;
    uncheckedKeys: string[];
    unmatched: number;
    updated: number;
  };
  sourceMaps: Record<string, string>;
  startTime: number;
  status: 'passed' | 'failed';
  testExecError?: any;
  testFilePath: string;
  testResults: JestTestResult[];
}

export interface JestAggregatedResult {
  numFailedTestSuites: number;
  numFailedTests: number;
  numPassedTestSuites: number;
  numPassedTests: number;
  numPendingTestSuites: number;
  numPendingTests: number;
  numRuntimeErrorTestSuites: number;
  numTodoTests: number;
  numTotalTestSuites: number;
  numTotalTests: number;
  openHandles: any[];
  snapshot: {
    added: number;
    didUpdate: boolean;
    failure: boolean;
    filesAdded: number;
    filesRemoved: number;
    filesRemovedList: string[];
    filesUnmatched: number;
    filesUpdated: number;
    matched: number;
    total: number;
    unchecked: number;
    uncheckedKeysByFile: any[];
    unmatched: number;
    updated: number;
  };
  startTime: number;
  success: boolean;
  testResults: JestTestSuiteResult[];
  wasInterrupted: boolean;
}

export interface GitInfo {
  branch: string;
  sha: string;
  repoPath?: string;
}

export interface CIInfo {
  actor: string;
  buildUrl: string;
  isCI: boolean;
  provider?: string;
}