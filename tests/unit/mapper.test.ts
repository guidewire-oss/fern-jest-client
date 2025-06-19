/**
 * Unit tests for mapper utilities
 */

import { 
  mapJestResultsToTestRun,
  mapJestSuiteToSuiteRun,
  mapJestTestToSpecRun,
  generateTestSummary
} from '../../src/utils/mapper';
import { 
  JestAggregatedResult,
  JestTestSuiteResult,
  JestTestResult,
  GitInfo,
  CIInfo
} from '../../src/types';

describe('Mapper utilities [unit] @mapper', () => {
  const mockGitInfo: GitInfo = {
    branch: 'main',
    sha: 'abc123def456',
    repoPath: '/path/to/repo'
  };

  const mockCIInfo: CIInfo = {
    actor: 'test-user',
    buildUrl: 'https://github.com/test/repo/actions/runs/123',
    isCI: true,
    provider: 'github-actions'
  };

  describe('Jest test result mapping @mapping', () => {
    const mockJestTest: JestTestResult = {
      ancestorTitles: ['Math operations', 'Addition'],
      duration: 50,
      failureDetails: [],
      failureMessages: [],
      fullName: 'Math operations Addition should add two numbers',
      numPassingAsserts: 1,
      status: 'passed',
      title: 'should add two numbers'
    };

    it('should map Jest test to SpecRun correctly', () => {
      const specRun = mapJestTestToSpecRun(mockJestTest, Date.now());

      expect(specRun.spec_description).toBe('Math operations > Addition > should add two numbers');
      expect(specRun.status).toBe('passed');
      expect(specRun.message).toBe('');
      expect(specRun.tags).toHaveLength(1);
      expect(specRun.tags[0].name).toBe('default');
    });

    it('should extract tags from test titles', () => {
      const testWithTags: JestTestResult = {
        ...mockJestTest,
        title: 'should work correctly [unit] @fast',
        ancestorTitles: ['Component tests #integration']
      };

      const specRun = mapJestTestToSpecRun(testWithTags, Date.now());

      expect(specRun.tags).toEqual(
        expect.arrayContaining([
          { name: 'unit' },
          { name: 'fast' },
          { name: 'integration' }
        ])
      );
    });

    it('should handle failed tests correctly', () => {
      const failedTest: JestTestResult = {
        ...mockJestTest,
        status: 'failed',
        failureMessages: ['Expected 5 but received 6', 'Additional error info']
      };

      const specRun = mapJestTestToSpecRun(failedTest, Date.now());

      expect(specRun.status).toBe('failed');
      expect(specRun.message).toContain('Expected 5 but received 6');
      expect(specRun.message).toContain('Additional error info');
    });

    it('should handle skipped tests correctly', () => {
      const skippedTest: JestTestResult = {
        ...mockJestTest,
        status: 'skipped'
      };

      const specRun = mapJestTestToSpecRun(skippedTest, Date.now());

      expect(specRun.status).toBe('skipped');
      expect(specRun.message).toBe('');
    });
  });

  describe('Jest suite result mapping @suite-mapping', () => {
    const mockJestSuite: JestTestSuiteResult = {
      endTime: Date.now(),
      leaks: false,
      numFailingTests: 1,
      numPassingTests: 2,
      numPendingTests: 0,
      numTodoTests: 0,
      openHandles: [],
      perfStats: {
        end: Date.now(),
        runtime: 100,
        slow: false,
        start: Date.now() - 100
      },
      skipped: false,
      snapshot: {
        added: 0,
        fileDeleted: false,
        matched: 0,
        unchecked: 0,
        uncheckedKeys: [],
        unmatched: 0,
        updated: 0
      },
      sourceMaps: {},
      startTime: Date.now() - 100,
      status: 'passed',
      testFilePath: '/path/to/tests/calculator.test.ts',
      testResults: [
        {
          ancestorTitles: ['Calculator'],
          duration: 25,
          failureDetails: [],
          failureMessages: [],
          fullName: 'Calculator should add numbers',
          numPassingAsserts: 1,
          status: 'passed',
          title: 'should add numbers'
        },
        {
          ancestorTitles: ['Calculator'],
          duration: 30,
          failureDetails: [],
          failureMessages: ['Division by zero error'],
          fullName: 'Calculator should handle division by zero',
          numPassingAsserts: 0,
          status: 'failed',
          title: 'should handle division by zero'
        }
      ]
    };

    it('should map Jest suite to SuiteRun correctly', () => {
      const suiteRun = mapJestSuiteToSuiteRun(mockJestSuite);

      expect(suiteRun.suite_name).toBe('calculator');
      expect(suiteRun.spec_runs).toHaveLength(2);
      expect(suiteRun.spec_runs[0].status).toBe('passed');
      expect(suiteRun.spec_runs[1].status).toBe('failed');
    });
  });

  describe('Complete test run mapping @test-run-mapping', () => {
    const mockAggregatedResult: JestAggregatedResult = {
      numFailedTestSuites: 0,
      numFailedTests: 1,
      numPassedTestSuites: 1,
      numPassedTests: 2,
      numPendingTestSuites: 0,
      numPendingTests: 0,
      numRuntimeErrorTestSuites: 0,
      numTodoTests: 0,
      numTotalTestSuites: 1,
      numTotalTests: 3,
      openHandles: [],
      snapshot: {
        added: 0,
        didUpdate: false,
        failure: false,
        filesAdded: 0,
        filesRemoved: 0,
        filesRemovedList: [],
        filesUnmatched: 0,
        filesUpdated: 0,
        matched: 0,
        total: 0,
        unchecked: 0,
        uncheckedKeysByFile: [],
        unmatched: 0,
        updated: 0
      },
      startTime: Date.now() - 1000,
      success: true,
      testResults: [],
      wasInterrupted: false
    };

    it('should map Jest aggregated results to TestRun correctly', () => {
      const testRun = mapJestResultsToTestRun(
        mockAggregatedResult,
        'test-project',
        mockGitInfo,
        mockCIInfo
      );

      expect(testRun.test_project_id).toBe('test-project');
      expect(testRun.git_branch).toBe('main');
      expect(testRun.git_sha).toBe('abc123def456');
      expect(testRun.build_trigger_actor).toBe('test-user');
      expect(testRun.build_url).toBe('https://github.com/test/repo/actions/runs/123');
      expect(testRun.test_seed).toBeGreaterThan(0);
    });
  });

  describe('Test summary generation @summary', () => {
    it('should generate correct test summary', () => {
      const testRun = {
        test_project_id: 'test-project',
        test_seed: 12345,
        start_time: '2024-01-01T00:00:00Z',
        end_time: '2024-01-01T00:01:00Z',
        git_branch: 'feature/new-feature',
        git_sha: 'abc123def456789',
        build_trigger_actor: 'developer',
        build_url: 'https://example.com/build/1',
        suite_runs: [
          {
            suite_name: 'test-suite',
            start_time: '2024-01-01T00:00:00Z',
            end_time: '2024-01-01T00:01:00Z',
            spec_runs: [
              { spec_description: 'test 1', status: 'passed', message: '', tags: [], start_time: '', end_time: '' },
              { spec_description: 'test 2', status: 'failed', message: '', tags: [], start_time: '', end_time: '' },
              { spec_description: 'test 3', status: 'skipped', message: '', tags: [], start_time: '', end_time: '' }
            ]
          }
        ]
      };

      const summary = generateTestSummary(testRun);

      expect(summary).toContain('Project: test-project');
      expect(summary).toContain('Branch: feature/new-feature');
      expect(summary).toContain('Commit: abc123de');
      expect(summary).toContain('Suites: 1');
      expect(summary).toContain('Tests: 3 total, 1 passed, 1 failed, 1 skipped');
    });
  });
});