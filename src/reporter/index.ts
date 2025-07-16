/**
 * Jest custom reporter for Fern platform
 * Integrates with Jest's reporter system to capture and send test results
 */

import { BaseReporter, Test, TestResult, AggregatedResult } from '@jest/reporters';
import { Config } from '@jest/types';
import { FernApiClient, createFernClient } from '../client';
import { mapJestResultsToTestRun, mapTestRunToCreateInput, generateTestSummary } from '../utils/mapper';
import { getGitInfo, getCIInfo } from '../utils/git';
import { FernReporterConfig } from '../types';
import { getEnvVar, ENV_VARS } from '../config';

export class FernReporter extends BaseReporter {
  private client!: FernApiClient;
  private projectId: string;
  private projectName: string;
  private enabled: boolean;

  constructor(globalConfig: Config.GlobalConfig, options: FernReporterConfig) {
    super();
    
    // Configuration with environment variable fallbacks
    this.projectId = options.projectId || getEnvVar(ENV_VARS.FERN_PROJECT_ID) || 'unknown-project';
    this.projectName = options.projectName || getEnvVar('FERN_PROJECT_NAME') || this.projectId;
    this.enabled = options.enabled !== false && getEnvVar(ENV_VARS.FERN_ENABLED) !== 'false';
    
    if (!this.enabled) {
      console.log('Fern reporter is disabled');
      return;
    }

    const baseUrl = options.baseUrl || getEnvVar(ENV_VARS.FERN_REPORTER_BASE_URL);
    const timeout = options.timeout;

    this.client = createFernClient(this.projectId, {
      baseUrl,
      timeout
    });

    console.log(`Fern reporter initialized for project: ${this.projectId}`);
    console.log(`Reporting to: ${this.client.getBaseUrl()}`);
  }

  /**
   * Called when all tests have completed
   */
  async onRunComplete(contexts: Set<any>, results: any): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      console.log('\nCollecting test results for Fern reporting...');
      
      // Get git and CI information
      const [gitInfo, ciInfo] = await Promise.all([
        getGitInfo(),
        Promise.resolve(getCIInfo())
      ]);

      // Convert Jest results to Fern format
      const testRun = mapJestResultsToTestRun(results, this.projectId, this.projectName, gitInfo, ciInfo);
      
      // Log summary
      console.log(generateTestSummary(testRun));
      
      // Convert to API input format
      const createInput = mapTestRunToCreateInput(testRun);
      
      // Send to Fern API
      console.log('\nSending test results to Fern...');
      await this.client.report(createInput);
      
      console.log('✅ Test results successfully sent to Fern\n');
      
    } catch (error) {
      console.error('❌ Failed to send test results to Fern:', error);
      
      // Don't fail the test run if reporting fails
      if (process.env.FERN_FAIL_ON_ERROR === 'true') {
        throw error;
      }
    }
  }

  /**
   * Called when a test starts
   */
  onTestStart(test: Test): void {
    // Optional: Log test start for debugging
    if (process.env.FERN_DEBUG === 'true') {
      console.log(`Starting test: ${test.path}`);
    }
  }

  /**
   * Called when a test file completes
   */
  onTestResult(test: Test, testResult: TestResult, aggregatedResult: any): void {
    // Optional: Log test completion for debugging
    if (process.env.FERN_DEBUG === 'true') {
      const { numFailingTests, numPassingTests, numPendingTests } = testResult;
      console.log(`Completed test: ${test.path} (${numPassingTests} passed, ${numFailingTests} failed, ${numPendingTests} pending)`);
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }
    
    try {
      const isHealthy = await this.client.ping();
      if (isHealthy) {
        console.log('✅ Fern API connection successful');
      } else {
        console.warn('⚠️  Fern API is not responding correctly');
      }
      return isHealthy;
    } catch (error) {
      console.error('❌ Failed to connect to Fern API:', error);
      return false;
    }
  }
}

// Export for Jest configuration
export default FernReporter;