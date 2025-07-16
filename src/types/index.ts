/**
 * Data models for Fern test reporting - compatible with fern-reporter API
 * Based on the fern-ginkgo-client models
 */

export interface Tag {
  id: number;
  name: string;
}

export interface SpecRun {
  id: number;
  suite_id: number;
  spec_description: string;
  status: string;
  message: string;
  tags: Tag[];
  start_time: string;
  end_time: string;
}

export interface SuiteRun {
  id: number;
  test_run_id: number;
  suite_name: string;
  start_time: string;
  end_time: string;
  spec_runs: SpecRun[];
}

export interface TestRun {
  id: number;
  test_project_name: string;
  test_project_id: string;
  test_seed: number;
  start_time: string;
  end_time: string;
  git_branch: string;
  git_sha: string;
  build_trigger_actor: string;
  build_url: string;
  client_type: string;
  suite_runs: SuiteRun[];
}

// API input structure that matches fern-platform expectations
export interface CreateTestRunInput extends TestRun {
  // TestRun already has all required fields
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
  projectName?: string;
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