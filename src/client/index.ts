/**
 * Fern API client for sending test results to fern-reporter
 * Similar to fern-ginkgo-client API client
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TestRun, CreateTestRunInput, FernClientOptions } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class FernApiClient {
  private httpClient: AxiosInstance;
  private projectId: string;
  private baseUrl: string;

  constructor(projectId: string, options: FernClientOptions = {}) {
    this.projectId = projectId;
    this.baseUrl = options.baseUrl || DEFAULT_CONFIG.BASE_URL;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: options.timeout || DEFAULT_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'fern-jest-client/0.2.0',
        ...options.headers
      }
    });

    // Add retry logic
    this.setupRetryInterceptor(
      options.retries || DEFAULT_CONFIG.RETRIES,
      options.retryDelay || DEFAULT_CONFIG.RETRY_DELAY
    );
  }

  /**
   * Send test run data to fern-reporter
   */
  async report(createInput: CreateTestRunInput): Promise<void> {
    try {
      const response: AxiosResponse = await this.httpClient.post(
        DEFAULT_CONFIG.API_ENDPOINT,
        createInput
      );

      if (response.status >= 200 && response.status < 300) {
        console.log(`Successfully reported test run to Fern (${response.status})`);
        console.log(`Project: ${createInput.test_project_name} (${createInput.test_project_id})`);
        console.log(`Test Seed: ${createInput.test_seed}`);
        console.log(`Branch: ${createInput.git_branch}`);
        console.log(`Suites: ${createInput.suite_runs.length}`);
        if (response.data && response.data.id) {
          console.log(`Fern Test Run ID: ${response.data.id}`);
        }
      } else {
        console.warn(`Unexpected response status from Fern API: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(`Failed to report to Fern API (${error.response.status}): ${error.response.statusText}`);
          if (error.response.data) {
            console.error('Response data:', error.response.data);
          }
        } else if (error.request) {
          console.error('Failed to reach Fern API:', error.message);
          console.error('URL:', `${this.baseUrl}${DEFAULT_CONFIG.API_ENDPOINT}`);
        } else {
          console.error('Error setting up request to Fern API:', error.message);
        }
      } else {
        console.error('Unexpected error reporting to Fern API:', error);
      }
      
      // Re-throw error to allow caller to handle it
      throw error;
    }
  }

  /**
   * Test connectivity to the Fern API
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/v1/health');
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.warn('Fern API health check failed:', error);
      return false;
    }
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the project ID
   */
  getProjectId(): string {
    return this.projectId;
  }


  /**
   * Setup retry interceptor for failed requests
   */
  private setupRetryInterceptor(retries: number, retryDelay: number): void {
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        if (!config || config.__retryCount >= retries) {
          return Promise.reject(error);
        }
        
        config.__retryCount = config.__retryCount || 0;
        config.__retryCount++;
        
        // Only retry on network errors or 5xx server errors
        if (
          !error.response || 
          (error.response.status >= 500 && error.response.status < 600) ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ECONNREFUSED'
        ) {
          console.log(`Retrying request (attempt ${config.__retryCount}/${retries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * config.__retryCount));
          
          return this.httpClient(config);
        }
        
        return Promise.reject(error);
      }
    );
  }
}

/**
 * Factory function to create a new Fern API client
 */
export function createFernClient(projectId: string, options?: FernClientOptions): FernApiClient {
  return new FernApiClient(projectId, options);
}