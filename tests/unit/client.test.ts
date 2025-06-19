/**
 * Unit tests for FernApiClient
 */

import axios from 'axios';
import { FernApiClient, createFernClient } from '../../src/client';
import { TestRun } from '../../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FernApiClient [unit]', () => {
  let client: FernApiClient;
  const mockTestRun: TestRun = {
    test_project_id: 'test-project',
    test_seed: 12345,
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-01-01T00:01:00Z',
    git_branch: 'main',
    git_sha: 'abc123',
    build_trigger_actor: 'test-user',
    build_url: 'https://example.com/build/1',
    suite_runs: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    client = createFernClient('test-project', {
      baseUrl: 'http://localhost:8080',
      timeout: 5000
    });
  });

  describe('Client creation @client', () => {
    it('should create client with default options', () => {
      const defaultClient = createFernClient('test-project');
      expect(defaultClient).toBeInstanceOf(FernApiClient);
      expect(defaultClient.getProjectId()).toBe('test-project');
    });

    it('should create client with custom options', () => {
      const customClient = createFernClient('custom-project', {
        baseUrl: 'https://custom.example.com',
        timeout: 10000
      });
      
      expect(customClient.getProjectId()).toBe('custom-project');
      expect(customClient.getBaseUrl()).toBe('https://custom.example.com');
    });
  });

  describe('Reporting functionality @api', () => {
    it('should successfully report test run', async () => {
      const mockPost = jest.fn().mockResolvedValue({ status: 200 });
      (client as any).httpClient.post = mockPost;

      await client.report(mockTestRun);

      expect(mockPost).toHaveBeenCalledWith('/api/testrun', mockTestRun);
    });

    it('should handle API errors gracefully', async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error('Network error'));
      (client as any).httpClient.post = mockPost;

      await expect(client.report(mockTestRun)).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      const mockError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Server error' }
        }
      };
      
      const mockPost = jest.fn().mockRejectedValue(mockError);
      (client as any).httpClient.post = mockPost;

      await expect(client.report(mockTestRun)).rejects.toEqual(mockError);
    });
  });

  describe('Health check functionality @health', () => {
    it('should return true for healthy API', async () => {
      const mockGet = jest.fn().mockResolvedValue({ status: 200 });
      (client as any).httpClient.get = mockGet;

      const isHealthy = await client.ping();

      expect(isHealthy).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/health');
    });

    it('should return false for unhealthy API', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Connection failed'));
      (client as any).httpClient.get = mockGet;

      const isHealthy = await client.ping();

      expect(isHealthy).toBe(false);
    });
  });

  describe('Configuration @config', () => {
    it('should return correct base URL', () => {
      expect(client.getBaseUrl()).toBe('http://localhost:8080');
    });

    it('should return correct project ID', () => {
      expect(client.getProjectId()).toBe('test-project');
    });
  });
});