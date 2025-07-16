/**
 * Mapper utilities to convert Jest test results to Fern data models
 */

import { 
  JestAggregatedResult, 
  JestTestSuiteResult, 
  JestTestResult,
  TestRun, 
  CreateTestRunInput,
  SuiteRun, 
  SpecRun, 
  Tag,
  GitInfo,
  CIInfo
} from '../types';

/**
 * Convert Jest aggregated results to Fern TestRun
 */
export function mapJestResultsToTestRun(
  results: JestAggregatedResult,
  projectId: string,
  projectName: string,
  gitInfo: GitInfo,
  ciInfo: CIInfo
): TestRun {
  const startTime = new Date(results.startTime).toISOString();
  const endTime = new Date().toISOString(); // Jest doesn't provide end time, use current time
  
  // Use nanosecond precision timestamp as test seed for uniqueness
  // process.hrtime.bigint() returns nanoseconds since an arbitrary time
  // We'll use current timestamp in milliseconds * 1000000 + nanosecond component
  const hrTime = process.hrtime.bigint();
  const nanoTime = Number(hrTime % 1000000n); // Get last 6 digits of nanoseconds
  const testSeed = Date.now() * 1000000 + nanoTime;
  const testRunId = testSeed; // Use same value for consistency
  
  const suiteRuns: SuiteRun[] = results.testResults.map((suite, index) => 
    mapJestSuiteToSuiteRun(suite, testRunId, index + 1)
  );

  return {
    id: testRunId,
    test_project_name: projectName,
    test_project_id: projectId,
    test_seed: testSeed,
    start_time: startTime,
    end_time: endTime,
    git_branch: gitInfo.branch,
    git_sha: gitInfo.sha,
    build_trigger_actor: ciInfo.actor,
    build_url: ciInfo.buildUrl,
    client_type: 'fern-jest-client',
    suite_runs: suiteRuns
  };
}

/**
 * Convert Jest test suite result to Fern SuiteRun
 */
export function mapJestSuiteToSuiteRun(suite: JestTestSuiteResult, testRunId: number, suiteId: number): SuiteRun {
  const suiteName = extractSuiteName(suite.testFilePath);
  const startTime = suite.startTime ? new Date(suite.startTime).toISOString() : new Date().toISOString();
  const endTime = suite.endTime ? new Date(suite.endTime).toISOString() : new Date().toISOString();
  
  const specRuns: SpecRun[] = suite.testResults.map((test, index) => 
    mapJestTestToSpecRun(test, suite.startTime || Date.now(), suiteId, index + 1)
  );

  return {
    id: suiteId,
    test_run_id: testRunId,
    suite_name: suiteName,
    start_time: startTime,
    end_time: endTime,
    spec_runs: specRuns
  };
}

/**
 * Convert Jest test result to Fern SpecRun
 */
export function mapJestTestToSpecRun(test: JestTestResult, suiteStartTime: number, suiteId: number, specId: number): SpecRun {
  const specDescription = buildSpecDescription(test);
  const status = mapJestStatusToFernStatus(test.status);
  const message = extractFailureMessage(test);
  const tags = extractTagsFromTest(test);
  
  // Calculate timing - Jest doesn't provide individual test start times
  const testDuration = test.duration || 0;
  const startTime = new Date(suiteStartTime).toISOString();
  const endTime = new Date(suiteStartTime + testDuration).toISOString();

  return {
    id: specId,
    suite_id: suiteId,
    spec_description: specDescription,
    status: status,
    message: message,
    tags: tags,
    start_time: startTime,
    end_time: endTime
  };
}

/**
 * Extract suite name from file path
 */
function extractSuiteName(filePath: string): string {
  const fileName = filePath.split('/').pop() || filePath;
  return fileName.replace(/\.(test|spec)\.(js|ts|jsx|tsx)$/, '');
}

/**
 * Build full spec description including ancestor titles
 */
function buildSpecDescription(test: JestTestResult): string {
  const ancestors = test.ancestorTitles.join(' > ');
  const fullDescription = ancestors ? `${ancestors} > ${test.title}` : test.title;
  return fullDescription;
}

/**
 * Map Jest status to Fern status
 */
function mapJestStatusToFernStatus(jestStatus: string): string {
  switch (jestStatus) {
    case 'passed':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'skipped':
    case 'pending':
    case 'disabled':
      return 'skipped';
    case 'todo':
      return 'pending';
    default:
      return 'unknown';
  }
}

/**
 * Extract failure message from test result
 */
function extractFailureMessage(test: JestTestResult): string {
  if (test.status === 'passed') {
    return '';
  }

  if (test.failureMessages && test.failureMessages.length > 0) {
    return test.failureMessages.join('\n');
  }

  if (test.failureDetails && test.failureDetails.length > 0) {
    return test.failureDetails.map(detail => detail.message).join('\n');
  }

  return test.status === 'failed' ? 'Test failed' : '';
}

/**
 * Extract tags from test metadata
 * Jest doesn't have native tagging, but we can extract from test names or file paths
 */
function extractTagsFromTest(test: JestTestResult): Tag[] {
  const tags: Tag[] = [];
  let tagId = 1;

  // Extract tags from test title (e.g., "should work [unit]" or "@unit should work")
  const titleTags = extractTagsFromString(test.title);
  tags.push(...titleTags);

  // Extract tags from ancestor titles
  test.ancestorTitles.forEach(ancestor => {
    const ancestorTags = extractTagsFromString(ancestor);
    tags.push(...ancestorTags);
  });

  // Add default tag if no tags found
  if (tags.length === 0) {
    tags.push({ id: tagId++, name: 'default' });
  }

  // Remove duplicates and assign IDs
  const uniqueTagNames = new Set<string>();
  const uniqueTags: Tag[] = [];
  tags.forEach(tag => {
    if (!uniqueTagNames.has(tag.name)) {
      uniqueTagNames.add(tag.name);
      uniqueTags.push({ id: tagId++, name: tag.name });
    }
  });

  return uniqueTags;
}

/**
 * Extract tags from a string using common patterns
 */
function extractTagsFromString(str: string): Tag[] {
  const tags: Tag[] = [];
  
  // Pattern 1: [tag] or [tag1,tag2]
  const bracketPattern = /\[([^\]]+)\]/g;
  let bracketMatch;
  while ((bracketMatch = bracketPattern.exec(str)) !== null) {
    const tagNames = bracketMatch[1].split(',').map(t => t.trim());
    tagNames.forEach(name => {
      if (name) tags.push({ id: 0, name }); // ID will be assigned later
    });
  }
  
  // Pattern 2: @tag or @tag1 @tag2
  const atPattern = /@([a-zA-Z0-9_-]+)/g;
  let atMatch;
  while ((atMatch = atPattern.exec(str)) !== null) {
    tags.push({ id: 0, name: atMatch[1] });
  }
  
  // Pattern 3: #tag or #tag1 #tag2
  const hashPattern = /#([a-zA-Z0-9_-]+)/g;
  let hashMatch;
  while ((hashMatch = hashPattern.exec(str)) !== null) {
    tags.push({ id: 0, name: hashMatch[1] });
  }

  return tags;
}

/**
 * Convert TestRun to CreateTestRunInput for API submission
 * Since TestRun now has all required fields, we just return it as-is
 */
export function mapTestRunToCreateInput(testRun: TestRun): CreateTestRunInput {
  return testRun;
}

/**
 * Generate unique run ID
 */
export function generateRunId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `jest-${timestamp}-${random}`;
}

/**
 * Generate test run summary for logging
 */
export function generateTestSummary(testRun: TestRun): string {
  const totalSpecs = testRun.suite_runs.reduce((sum, suite) => sum + suite.spec_runs.length, 0);
  const passedSpecs = testRun.suite_runs.reduce((sum, suite) => 
    sum + suite.spec_runs.filter(spec => spec.status === 'passed').length, 0
  );
  const failedSpecs = testRun.suite_runs.reduce((sum, suite) => 
    sum + suite.spec_runs.filter(spec => spec.status === 'failed').length, 0
  );
  const skippedSpecs = testRun.suite_runs.reduce((sum, suite) => 
    sum + suite.spec_runs.filter(spec => spec.status === 'skipped').length, 0
  );

  return [
    `Fern Test Run Summary:`,
    `  Project: ${testRun.test_project_id}`,
    `  Branch: ${testRun.git_branch}`,
    `  Commit: ${testRun.git_sha.substring(0, 8)}`,
    `  Suites: ${testRun.suite_runs.length}`,
    `  Tests: ${totalSpecs} total, ${passedSpecs} passed, ${failedSpecs} failed, ${skippedSpecs} skipped`
  ].join('\n');
}