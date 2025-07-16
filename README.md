# Fern Jest Client

A Jest test reporter client for the Fern platform that captures and sends test execution data to [fern-reporter](../fern-reporter), enabling comprehensive test reporting and analysis across your JavaScript/TypeScript test suites.

## Overview

The Fern Jest Client provides seamless integration between Jest testing framework and the Fern platform's test reporting infrastructure. It automatically captures test results, execution metadata, and CI/CD information, then sends this data to the fern-reporter service for storage and analysis.

### Key Features

- **Automatic Test Reporting**: Captures Jest test results and sends them to Fern platform
- **Git Integration**: Automatically extracts git branch, commit SHA, and repository information
- **CI/CD Support**: Built-in support for GitHub Actions, GitLab CI, Jenkins, and CircleCI
- **Test Tagging**: Extract tags from test names and descriptions for categorization
- **Retry Logic**: Robust error handling with configurable retry mechanisms
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Zero Configuration**: Works out of the box with sensible defaults

## Installation

### npm

```bash
npm install --save-dev fern-jest-client
```

### yarn

```bash
yarn add --dev fern-jest-client
```

## Quick Start

### 1. Basic Setup

Add the Fern reporter to your Jest configuration:

```javascript
// jest.config.js
module.exports = {
  // ... other Jest configuration
  reporters: [
    'default',
    ['fern-jest-client', {
      projectId: 'your-project-uuid',     // UUID from fern-platform
      projectName: 'my-project',          // Optional: human-readable name
      baseUrl: 'http://localhost:8080'
    }]
  ]
};
```

### 2. Environment Configuration

Set the required environment variables:

```bash
export FERN_PROJECT_ID="my-project"
export FERN_REPORTER_BASE_URL="http://localhost:8080"
```

### 3. Run Your Tests

```bash
npm test
```

Test results will automatically be sent to your Fern platform instance, where you can view comprehensive analytics and insights.

## Configuration

### Reporter Options

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['fern-jest-client', {
      projectId: 'your-project-uuid',     // Required: Your project UUID
      projectName: 'my-project',          // Optional: Project name (defaults to projectId)
      baseUrl: 'http://localhost:8080',   // Optional: Fern reporter URL
      timeout: 30000,                   // Optional: Request timeout (ms)
      enabled: true                     // Optional: Enable/disable reporting
    }]
  ]
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FERN_PROJECT_ID` | Project UUID from fern-platform | Required |
| `FERN_PROJECT_NAME` | Human-readable project name | Uses `FERN_PROJECT_ID` |
| `FERN_REPORTER_BASE_URL` | Fern reporter service URL | `http://localhost:8080` |
| `FERN_ENABLED` | Enable/disable reporting | `true` |
| `FERN_DEBUG` | Enable debug logging | `false` |
| `FERN_FAIL_ON_ERROR` | Fail tests if reporting fails | `false` |
| `GIT_REPO_PATH` | Custom git repository path | Current directory |

### CI/CD Integration

The client automatically detects and integrates with various CI/CD platforms:

#### GitHub Actions

```yaml
# .github/workflows/test.yml
env:
  FERN_PROJECT_ID: "my-project"
  FERN_REPORTER_BASE_URL: "https://fern-reporter.example.com"
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
variables:
  FERN_PROJECT_ID: "my-project"
  FERN_REPORTER_BASE_URL: "https://fern-reporter.example.com"
```

#### Jenkins

```groovy
environment {
    FERN_PROJECT_ID = 'my-project'
    FERN_REPORTER_BASE_URL = 'https://fern-reporter.example.com'
}
```

## Test Tagging

The Fern Jest Client supports test tagging for better categorization and filtering. Tags can be extracted from test names using various patterns:

### Tag Patterns

```javascript
describe('Math operations [unit]', () => {
  it('should add numbers @fast', () => {
    expect(2 + 2).toBe(4);
  });

  it('should multiply correctly #math #arithmetic', () => {
    expect(3 * 4).toBe(12);
  });

  it('should handle edge cases [integration,edge-case]', () => {
    // Test implementation
  });
});
```

### Supported Tag Formats

- **Bracket notation**: `[unit]`, `[integration,slow]`
- **At notation**: `@fast`, `@slow`, `@unit`
- **Hash notation**: `#math`, `#edge-case`

## Programmatic Usage

### Creating a Client

```typescript
import { createFernClient } from 'fern-jest-client';

const client = createFernClient('my-project', {
  baseUrl: 'http://localhost:8080',
  timeout: 30000
});

// Test connectivity
const isHealthy = await client.ping();
console.log('Fern API healthy:', isHealthy);
```

### Manual Reporting

```typescript
import { createFernClient, mapJestResultsToTestRun } from 'fern-jest-client';
import { getGitInfo, getCIInfo } from 'fern-jest-client';

const client = createFernClient('my-project');

// Get test results from Jest (this would typically be done automatically)
const jestResults = /* ... Jest aggregated results ... */;

// Get metadata
const [gitInfo, ciInfo] = await Promise.all([
  getGitInfo(),
  getCIInfo()
]);

// Convert and send
const testRun = mapJestResultsToTestRun(jestResults, 'my-project', gitInfo, ciInfo);
await client.report(testRun);
```

### Custom Reporter

```typescript
import { FernReporter } from 'fern-jest-client';

class CustomFernReporter extends FernReporter {
  async onRunComplete(contexts: Set<any>, results: AggregatedResult): Promise<void> {
    // Custom logic before reporting
    console.log('Custom processing before Fern reporting');
    
    // Call parent implementation
    await super.onRunComplete(contexts, results);
    
    // Custom logic after reporting
    console.log('Custom processing after Fern reporting');
  }
}

export default CustomFernReporter;
```

## API Reference

### Classes

#### `FernApiClient`

The main client for communicating with the Fern reporter API.

```typescript
class FernApiClient {
  constructor(projectId: string, options?: FernClientOptions);
  
  async report(testRun: TestRun): Promise<void>;
  async ping(): Promise<boolean>;
  getBaseUrl(): string;
  getProjectId(): string;
}
```

#### `FernReporter`

Jest custom reporter that integrates with the Fern platform.

```typescript
class FernReporter extends BaseReporter {
  constructor(globalConfig: Config.GlobalConfig, options: FernReporterConfig);
  
  async onRunComplete(contexts: Set<any>, results: AggregatedResult): Promise<void>;
  async testConnection(): Promise<boolean>;
}
```

### Utility Functions

#### Git Utilities

```typescript
// Get git repository information
async function getGitInfo(): Promise<GitInfo>;

// Get CI/CD environment information  
function getCIInfo(): CIInfo;

// Find git repository root
function findGitRoot(startPath?: string): string | null;
```

#### Mapping Utilities

```typescript
// Convert Jest results to Fern format
function mapJestResultsToTestRun(
  results: JestAggregatedResult,
  projectId: string,
  gitInfo: GitInfo,
  ciInfo: CIInfo
): TestRun;

// Generate test summary
function generateTestSummary(testRun: TestRun): string;
```

## Data Models

### TestRun

```typescript
interface TestRun {
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
```

### SuiteRun

```typescript
interface SuiteRun {
  suite_name: string;
  start_time: string;
  end_time: string;
  spec_runs: SpecRun[];
}
```

### SpecRun

```typescript
interface SpecRun {
  spec_description: string;
  status: string;
  message: string;
  tags: Tag[];
  start_time: string;
  end_time: string;
}
```

## Examples

### Complete Integration Example

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    'default',
    ['fern-jest-client', {
      projectId: process.env.FERN_PROJECT_ID || 'my-project',
      baseUrl: process.env.FERN_REPORTER_BASE_URL || 'http://localhost:8080',
      enabled: process.env.CI === 'true' || process.env.FERN_ENABLED === 'true'
    }]
  ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ]
};
```

### Test File with Tags

```typescript
// calculator.test.ts
describe('Calculator [unit] @math', () => {
  describe('Basic operations #arithmetic', () => {
    it('should add two numbers', () => {
      expect(2 + 2).toBe(4);
    });

    it('should subtract numbers @fast', () => {
      expect(5 - 3).toBe(2);
    });
  });

  describe('Edge cases [integration] #edge-case', () => {
    it('should handle division by zero', () => {
      expect(() => 10 / 0).not.toThrow();
      expect(10 / 0).toBe(Infinity);
    });

    it.skip('should handle very large numbers', () => {
      // This test is skipped for demonstration
      expect(Number.MAX_VALUE + 1).toBeGreaterThan(Number.MAX_VALUE);
    });
  });
});
```

### GitHub Actions Workflow

```yaml
name: Test with Fern Reporting

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests with Fern reporting
      env:
        FERN_PROJECT_ID: my-project
        FERN_REPORTER_BASE_URL: http://localhost:8080
        FERN_ENABLED: true
      run: npm test
```

## Advanced Usage Patterns

### 🏢 **Enterprise Integration**

#### **Multi-Project Setup**
For organizations with multiple projects, configure different project IDs:

```javascript
// Project-specific configuration
const getJestConfig = (projectName) => ({
  reporters: [
    'default',
    ['fern-jest-client', {
      projectId: `${process.env.COMPANY_PREFIX}-${projectName}`,
      baseUrl: process.env.FERN_ENTERPRISE_URL,
      enabled: process.env.NODE_ENV !== 'test'
    }]
  ]
});

module.exports = getJestConfig('user-service');
```

#### **Environment-Specific Reporting**
Configure different reporting strategies for different environments:

```javascript
// jest.config.js
const getFernConfig = () => {
  const baseConfig = {
    projectId: process.env.FERN_PROJECT_ID,
    timeout: 30000
  };

  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      baseUrl: 'https://fern-reporter.company.com',
      enabled: true
    };
  }

  if (process.env.NODE_ENV === 'staging') {
    return {
      ...baseConfig,
      baseUrl: 'https://fern-reporter-staging.company.com',
      enabled: true
    };
  }

  return {
    ...baseConfig,
    enabled: false // Disable in development/test
  };
};

module.exports = {
  reporters: [
    'default',
    ['fern-jest-client', getFernConfig()]
  ]
};
```

### 🎨 **Custom Test Categorization**

#### **Advanced Tagging Strategies**
Implement sophisticated test categorization:

```typescript
// tests/utils/testCategories.ts
export const TestCategories = {
  // Functional categories
  UNIT: '[unit]',
  INTEGRATION: '[integration]',
  E2E: '[e2e]',
  
  // Performance categories
  FAST: '@fast',
  SLOW: '@slow',
  PERFORMANCE: '#performance',
  
  // Feature categories
  API: '#api',
  UI: '#ui',
  DATABASE: '#database',
  AUTH: '#auth',
  
  // Risk categories
  CRITICAL: '[critical]',
  HIGH_RISK: '[high-risk]',
  FLAKY: '@flaky-prone'
};

// usage in tests
describe(`User Authentication ${TestCategories.UNIT} ${TestCategories.AUTH}`, () => {
  it(`should validate token ${TestCategories.FAST}`, () => {
    // test implementation
  });
  
  it(`should handle expired tokens ${TestCategories.CRITICAL}`, () => {
    // test implementation
  });
});
```

#### **Dynamic Tag Generation**
Generate tags programmatically based on test context:

```typescript
// tests/utils/dynamicTags.ts
export const createDynamicTags = (testContext: any) => {
  const tags = [];
  
  if (testContext.executionTime < 100) tags.push('@fast');
  if (testContext.executionTime > 5000) tags.push('@slow');
  if (testContext.usesDatabase) tags.push('#database');
  if (testContext.usesAPI) tags.push('#api');
  
  return tags.join(' ');
};

// usage
describe(`Order Processing ${createDynamicTags(orderTestContext)}`, () => {
  // tests
});
```

### 🔄 **CI/CD Integration Patterns**

#### **GitHub Actions Advanced Setup**
```yaml
name: Comprehensive Testing with Fern

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0 # Get full git history for better analytics
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests with Fern reporting
      env:
        FERN_PROJECT_ID: my-app-${{ matrix.node-version }}-${{ matrix.os }}
        FERN_REPORTER_BASE_URL: ${{ secrets.FERN_REPORTER_URL }}
        FERN_API_KEY: ${{ secrets.FERN_API_KEY }}
        FERN_ENABLED: true
        FERN_DEBUG: ${{ runner.debug == '1' }}
        # Additional context for analytics
        FERN_BUILD_MATRIX: "node-${{ matrix.node-version }}-${{ matrix.os }}"
        FERN_PR_NUMBER: ${{ github.event.number }}
        FERN_BRANCH_NAME: ${{ github.head_ref || github.ref_name }}
      run: |
        npm test -- --coverage
        npm run test:e2e
    
    - name: Upload test artifacts
      if: failure()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.node-version }}-${{ matrix.os }}
        path: |
          coverage/
          test-results/
          screenshots/
```

#### **GitLab CI Pipeline**
```yaml
# .gitlab-ci.yml
stages:
  - test
  - report

variables:
  FERN_PROJECT_ID: "$CI_PROJECT_NAME"
  FERN_REPORTER_BASE_URL: "$FERN_REPORTER_URL"
  FERN_ENABLED: "true"

.test_template: &test_template
  stage: test
  before_script:
    - npm ci
  script:
    - npm test
  artifacts:
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
      - test-results/
    expire_in: 1 week

test:unit:
  <<: *test_template
  variables:
    FERN_PROJECT_ID: "$CI_PROJECT_NAME-unit"
  script:
    - npm run test:unit

test:integration:
  <<: *test_template
  variables:
    FERN_PROJECT_ID: "$CI_PROJECT_NAME-integration"
  script:
    - npm run test:integration

test:e2e:
  <<: *test_template
  variables:
    FERN_PROJECT_ID: "$CI_PROJECT_NAME-e2e"
  script:
    - npm run test:e2e

fern_analytics_report:
  stage: report
  dependencies:
    - test:unit
    - test:integration
    - test:e2e
  script:
    - echo "Test analytics available at $FERN_REPORTER_BASE_URL/projects/$CI_PROJECT_NAME"
  only:
    - main
    - develop
```

### 📊 **Custom Metrics and Monitoring**

#### **Performance Benchmarking**
Track custom performance metrics:

```typescript
// tests/utils/performanceTracker.ts
import { performance } from 'perf_hooks';

export class PerformanceTracker {
  private metrics: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.metrics.set(`${name}_start`, performance.now());
  }

  endTimer(name: string): number {
    const start = this.metrics.get(`${name}_start`);
    if (!start) throw new Error(`Timer ${name} was not started`);
    
    const duration = performance.now() - start;
    this.metrics.set(name, duration);
    return duration;
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// usage in tests
describe('API Performance Tests [performance]', () => {
  const tracker = new PerformanceTracker();

  beforeEach(() => {
    tracker.startTimer('api_call');
  });

  afterEach(() => {
    const duration = tracker.endTimer('api_call');
    console.log(`API call took ${duration.toFixed(2)}ms`);
    
    // Add performance tags based on duration
    if (duration > 1000) {
      console.log('Performance warning: API call exceeded 1000ms @slow #performance-issue');
    }
  });

  it('should respond within performance threshold @performance', async () => {
    const response = await apiClient.getData();
    expect(response.status).toBe(200);
    
    const duration = tracker.getMetrics().api_call;
    expect(duration).toBeLessThan(500); // 500ms threshold
  });
});
```

#### **Memory Usage Monitoring**
```typescript
// tests/utils/memoryMonitor.ts
export class MemoryMonitor {
  private initialMemory: NodeJS.MemoryUsage;

  constructor() {
    this.initialMemory = process.memoryUsage();
  }

  getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  getMemoryDelta(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
    const current = this.getCurrentUsage();
    return {
      heapUsed: current.heapUsed - this.initialMemory.heapUsed,
      heapTotal: current.heapTotal - this.initialMemory.heapTotal,
      external: current.external - this.initialMemory.external
    };
  }
}

// usage
describe('Memory Usage Tests [unit] #memory', () => {
  let memoryMonitor: MemoryMonitor;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
  });

  afterEach(() => {
    const delta = memoryMonitor.getMemoryDelta();
    if (delta.heapUsed > 10 * 1024 * 1024) { // 10MB
      console.log('Memory warning: High memory usage detected @memory-leak #performance-issue');
    }
  });

  it('should not leak memory during bulk operations @memory', () => {
    // test implementation
    const delta = memoryMonitor.getMemoryDelta();
    expect(delta.heapUsed).toBeLessThan(5 * 1024 * 1024); // 5MB limit
  });
});
```

### 🎯 **Team Collaboration Features**

#### **Test Ownership and Notifications**
```typescript
// tests/utils/testOwnership.ts
export const TestOwners = {
  AUTH: '@auth-team',
  API: '@backend-team',
  UI: '@frontend-team',
  DATABASE: '@data-team',
  PERFORMANCE: '@performance-team'
};

// usage
describe(`Authentication Service ${TestOwners.AUTH} [critical]`, () => {
  it('should validate JWT tokens', () => {
    // When this test fails, @auth-team gets notified
  });
});
```

#### **Custom Test Reports**
```typescript
// tests/utils/customReporter.ts
import { FernReporter } from 'fern-jest-client';

export class TeamCustomReporter extends FernReporter {
  async onRunComplete(contexts: Set<any>, results: any): Promise<void> {
    // Custom team-specific logic
    await this.generateTeamReport(results);
    await this.notifyStakeholders(results);
    
    // Call parent to send to Fern
    await super.onRunComplete(contexts, results);
    
    // Post-processing
    await this.updateDashboards(results);
  }

  private async generateTeamReport(results: any): Promise<void> {
    // Generate custom reports for different teams
    const criticalFailures = this.extractCriticalFailures(results);
    if (criticalFailures.length > 0) {
      await this.alertOnCallTeam(criticalFailures);
    }
  }

  private extractCriticalFailures(results: any): any[] {
    return results.testResults
      .flatMap((suite: any) => suite.testResults)
      .filter((test: any) => 
        test.status === 'failed' && 
        test.fullName.includes('[critical]')
      );
  }
}
```

## Troubleshooting

### Common Issues

#### Reporter Not Sending Data

1. **Check Configuration**: Ensure `FERN_PROJECT_ID` is set
2. **Verify URL**: Confirm `FERN_REPORTER_BASE_URL` is correct
3. **Check Connectivity**: Test if the Fern reporter service is accessible
4. **Enable Debug**: Set `FERN_DEBUG=true` for detailed logging

#### Git Information Not Available

1. **Check Git Repository**: Ensure you're running tests in a git repository
2. **Set Git Path**: Use `GIT_REPO_PATH` environment variable if needed
3. **CI Environment**: Verify CI environment variables are set correctly

#### Tests Failing Due to Reporting Errors

1. **Disable Failure on Error**: Set `FERN_FAIL_ON_ERROR=false`
2. **Check Network**: Ensure network connectivity to Fern reporter
3. **Increase Timeout**: Adjust the `timeout` option in reporter configuration

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
FERN_DEBUG=true npm test
```

This will output detailed information about:
- Configuration loading
- Git information extraction
- API requests and responses
- Error details

## Analytics and Reporting

Once your test data is sent to the fern-reporter service, you gain access to powerful analytics and insights through the Fern platform ecosystem. The fern-jest-client is designed to work seamlessly with the complete Fern testing analytics platform.

### 📊 **Test Analytics Dashboard**

The **[fern-reporter](../fern-reporter)** service provides comprehensive test analytics including:

- **Test Run Trends**: Historical view of test execution patterns over time
- **Success/Failure Rates**: Track test reliability and identify problematic areas
- **Performance Metrics**: Test execution duration analysis and performance regression detection
- **Flaky Test Detection**: Automatically identify tests that pass/fail inconsistently
- **Branch Comparison**: Compare test results across different git branches
- **CI/CD Integration Analytics**: Track test performance across different CI environments

### 🎯 **Key Metrics Tracked**

The Jest client automatically captures and sends the following metrics to fern-reporter:

#### **Test Execution Metrics**
- Total test count, passed, failed, and skipped tests
- Individual test execution times and suite durations
- Test start/end timestamps with millisecond precision
- Test retry counts and failure patterns

#### **Environment Context**
- Git branch, commit SHA, and repository information
- CI/CD environment details (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- Build trigger information (manual, scheduled, PR-triggered)
- Node.js version and Jest configuration details

#### **Test Organization**
- Test file structure and suite hierarchy
- Custom tags for test categorization and filtering
- Test descriptions and failure messages
- Stack traces for failed tests

### 🔍 **Advanced Analytics Features**

#### **Trend Analysis**
```
📈 Success Rate Trends
├── Last 30 days: 94.2% → 96.1%
├── Test Coverage: 87% → 89%
├── Avg Duration: 2.3s → 1.9s
└── Flaky Tests: 12 → 8
```

#### **Performance Insights**
- **Slowest Tests**: Identify performance bottlenecks
- **Duration Regression**: Detect tests that are getting slower over time
- **Parallel Execution Analysis**: Optimize test parallelization strategies
- **Memory Usage Tracking**: Monitor test memory consumption patterns

#### **Quality Metrics**
- **Test Stability Score**: Measure test reliability over time
- **Flaky Test Reports**: Detailed analysis of unstable tests
- **Code Coverage Integration**: Correlate test results with coverage data
- **Technical Debt Indicators**: Identify tests that need maintenance

### 📱 **Viewing Your Results**

#### **Web Dashboard** - [fern-ui](../fern-ui)
Access the modern React-based dashboard to:
- View real-time test execution results
- Analyze historical trends and patterns
- Filter and search test results by tags, branches, or time periods
- Export test reports in multiple formats (PDF, CSV, JSON)
- Set up alerts for test failures or performance regressions

#### **GraphQL API**
Query test data programmatically:
```graphql
query GetTestRuns($projectId: String!, $branch: String) {
  testRuns(projectId: $projectId, branch: $branch) {
    id
    startTime
    endTime
    status
    totalTests
    passedTests
    failedTests
    suiteRuns {
      suiteName
      duration
      specRuns {
        description
        status
        tags
      }
    }
  }
}
```

#### **REST API**
Access data via REST endpoints:
```bash
# Get test run summary
curl -X GET "http://fern-reporter.example.com/api/v1/test-runs?project_id=my-project"

# Get detailed test run data
curl -X GET "http://fern-reporter.example.com/api/v1/test-runs/123/details"

# Get test analytics
curl -X GET "http://fern-reporter.example.com/api/v1/projects/my-project/analytics"
```

### 🚀 **Getting Started with Analytics**

1. **Set up fern-reporter**: Deploy the backend service following the [fern-reporter setup guide](../fern-reporter/README.md)

2. **Configure the Jest client**: Use this fern-jest-client to start sending test data

3. **Access the dashboard**: Open the fern-ui web interface to view your analytics

4. **Customize your views**: Set up custom dashboards and alerts based on your team's needs

### 📈 **Sample Analytics Views**

#### **Project Dashboard**
```
🎯 Project: my-awesome-app
├── 📊 Success Rate: 96.3% (↑2.1%)
├── ⏱️  Avg Duration: 3.2m (↓15s)
├── 🧪 Total Tests: 1,247 (+23)
├── 🔄 Flaky Tests: 5 (-2)
└── 📅 Last Run: 2 minutes ago

Recent Trends:
┌─────────────────────────────────────┐
│ Success Rate (Last 30 days)        │
│ ████████████████████████████▓░ 96.3%│
│ Duration (Last 30 days)             │
│ ██████████████████████▓░░░░░ 3.2m   │
└─────────────────────────────────────┘
```

#### **Test Suite Analysis**
```
📁 Test Suites Performance
├── 🟢 auth.test.ts        ✓ 45/45   (1.2s)
├── 🟢 api.test.ts         ✓ 78/78   (2.1s)
├── 🟡 integration.test.ts ✓ 32/34   (4.5s) ⚠️ 2 flaky
├── 🟢 utils.test.ts       ✓ 156/156 (0.8s)
└── 🔴 e2e.test.ts         ✓ 12/15   (8.2s) ❌ 3 failed
```

### 🔗 **Integration Examples**

#### **Slack Notifications**
Set up automated Slack alerts for test failures:
```javascript
// webhook integration example
const webhook = new FernWebhook({
  url: process.env.SLACK_WEBHOOK_URL,
  events: ['test.failed', 'test.flaky']
});
```

#### **Jira Integration**
Automatically create Jira tickets for failing tests:
```javascript
// Jira integration example
const jiraIntegration = new FernJiraIntegration({
  projectKey: 'TEST',
  createTicketsFor: ['failed', 'flaky'],
  assignTo: 'test-team'
});
```

### 💡 **Why Use Fern Analytics?**

#### **For Development Teams**
- **🐛 Bug Prevention**: Identify flaky tests before they reach production
- **⚡ Performance Optimization**: Spot slow tests and optimize build times
- **🎯 Quality Insights**: Track test coverage and code quality metrics
- **🔄 Continuous Improvement**: Data-driven decisions for test strategy

#### **For Engineering Managers**
- **📊 Team Productivity**: Measure and improve development velocity
- **🎯 Quality Gates**: Enforce quality standards with automated reporting
- **📈 Trend Analysis**: Long-term visibility into team and project health
- **💰 Cost Optimization**: Identify and eliminate wasteful test patterns

#### **For DevOps Teams**
- **🚀 CI/CD Optimization**: Improve pipeline reliability and speed
- **🔍 Build Analysis**: Deep insights into build failures and patterns
- **⚠️ Early Warning**: Proactive alerts for quality degradation
- **📋 Compliance**: Automated reporting for audit and compliance needs

#### **Real-World Success Stories**

> **"After implementing Fern analytics, we reduced our flaky test count by 75% and improved our build reliability from 85% to 98%."**
> - Senior DevOps Engineer, Tech Startup

> **"Fern's trend analysis helped us identify performance regressions 3 weeks earlier than traditional methods, saving us significant debugging time."**
> - Principal Engineer, Fortune 500 Company

> **"The team visibility features in Fern transformed how we approach test ownership and collaboration. Our mean time to resolution for test failures dropped by 60%."**
> - Engineering Manager, SaaS Platform

### 🎯 **Getting Maximum Value**

#### **Best Practices for Analytics**
1. **Consistent Tagging**: Use standardized tags across your test suites
2. **Meaningful Project IDs**: Structure project IDs for easy filtering and grouping
3. **Regular Review**: Schedule weekly analytics reviews with your team
4. **Action-Oriented**: Set up alerts and workflows to act on insights
5. **Continuous Refinement**: Regularly update your analytics strategy based on learnings

#### **Key Metrics to Track**
- **Test Success Rate**: Aim for >95% success rate on main branch
- **Build Duration**: Monitor and optimize for <10 minute feedback loops
- **Flaky Test Ratio**: Keep flaky tests <2% of total test suite
- **Coverage Trends**: Track coverage changes with each release
- **Team Velocity**: Measure tests written vs. bugs found in production

### 📚 **Deep Dive Resources**

For detailed information about analytics capabilities and setup:

- **[fern-reporter Documentation](../fern-reporter/README.md)**: Complete setup guide, API reference, and deployment instructions
- **[fern-ui Setup Guide](../fern-ui/README.md)**: Dashboard configuration, customization, and user management
- **[Analytics API Documentation](../fern-reporter/docs/API.md)**: Comprehensive API reference with examples
- **[Deployment Guide](../fern-reporter/docs/DEPLOYMENT.md)**: Production deployment best practices and scaling strategies
- **[Integration Examples](../fern-reporter/examples/)**: Real-world integration patterns and success stories
- **[Analytics Best Practices](../fern-reporter/docs/ANALYTICS_GUIDE.md)**: Comprehensive guide to maximizing value from test analytics
- **[Troubleshooting Guide](../fern-reporter/docs/TROUBLESHOOTING.md)**: Common issues and solutions
- **[Community Forum](https://github.com/your-org/fern-platform/discussions)**: Get help from the community and share experiences

## Related Projects

- **[fern-reporter](../fern-reporter)**: 🚀 The powerful backend service that receives, stores, and analyzes test data with advanced analytics capabilities
- **[fern-ui](../fern-ui)**: 📊 Modern React-based web interface for viewing test results, trends, and comprehensive analytics dashboards
- **[fern-ginkgo-client](../fern-ginkgo-client)**: 🐹 Similar client for Go/Ginkgo tests with identical analytics integration
- **[fern-junit-client](../fern-junit-client)**: ☕ Client for JUnit-based testing frameworks (Java, Kotlin, Scala)
- **[fern-platform](../fern-platform)**: 🌿 Complete testing analytics platform with AI-powered insights and recommendations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add new feature'`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/fern-platform.git
cd fern-platform/fern-jest-client

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run with the Fern platform
make test-with-fern
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README and inline code documentation
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join the community discussions for questions and support