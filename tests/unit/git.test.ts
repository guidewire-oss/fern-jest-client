/**
 * Unit tests for git utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { findGitRoot, getGitInfo, getCIInfo, toAbsolutePath } from '../../src/utils/git';

// Mock fs and path modules
jest.mock('fs');
jest.mock('simple-git');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Git utilities [unit] @git', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.GITHUB_ACTOR;
    delete process.env.GITHUB_SHA;
    delete process.env.GITHUB_REF;
    delete process.env.CI;
  });

  describe('Git root discovery @git-root', () => {
    it('should find git root in current directory', () => {
      mockedFs.existsSync.mockImplementation((path: any) => {
        return path.includes('.git');
      });

      const gitRoot = findGitRoot('/project/src/test');
      
      expect(gitRoot).toBeTruthy();
      expect(mockedFs.existsSync).toHaveBeenCalled();
    });

    it('should return null when no git root found', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const gitRoot = findGitRoot('/project/src/test');
      
      expect(gitRoot).toBeNull();
    });

    it('should use current working directory by default', () => {
      mockedFs.existsSync.mockImplementation((path: any) => {
        return path.includes('.git') && path.includes(process.cwd());
      });

      const gitRoot = findGitRoot();
      
      expect(mockedFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(process.cwd())
      );
    });
  });

  describe('Git information extraction @git-info', () => {
    it('should get git info from GitHub Actions environment', async () => {
      process.env.GITHUB_SHA = 'abc123def456';
      process.env.GITHUB_REF = 'refs/heads/feature/test';
      process.env.CI = 'true';

      const gitInfo = await getGitInfo();

      expect(gitInfo.branch).toBe('feature/test');
      expect(gitInfo.sha).toBe('abc123def456');
    });

    it('should handle pull request refs correctly', async () => {
      process.env.GITHUB_SHA = 'abc123def456';
      process.env.GITHUB_REF = 'refs/pull/123/merge';
      process.env.CI = 'true';

      const gitInfo = await getGitInfo();

      expect(gitInfo.branch).toBe('pr-123');
      expect(gitInfo.sha).toBe('abc123def456');
    });

    it('should return default values when git info unavailable', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const gitInfo = await getGitInfo();

      expect(gitInfo.branch).toBe('unknown');
      expect(gitInfo.sha).toBe('unknown');
    });
  });

  describe('CI information extraction @ci-info', () => {
    it('should detect GitHub Actions CI', () => {
      process.env.GITHUB_ACTOR = 'test-user';
      process.env.GITHUB_SERVER_URL = 'https://github.com';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_RUN_ID = '123456';

      const ciInfo = getCIInfo();

      expect(ciInfo.actor).toBe('test-user');
      expect(ciInfo.buildUrl).toBe('https://github.com/owner/repo/actions/runs/123456');
      expect(ciInfo.isCI).toBe(true);
      expect(ciInfo.provider).toBe('github-actions');
    });

    it('should detect GitLab CI', () => {
      process.env.GITLAB_USER_LOGIN = 'gitlab-user';
      process.env.CI_PROJECT_URL = 'https://gitlab.com/owner/repo';
      process.env.CI_PIPELINE_ID = '789';

      const ciInfo = getCIInfo();

      expect(ciInfo.actor).toBe('gitlab-user');
      expect(ciInfo.buildUrl).toBe('https://gitlab.com/owner/repo/-/pipelines/789');
      expect(ciInfo.isCI).toBe(true);
      expect(ciInfo.provider).toBe('gitlab-ci');
    });

    it('should detect local development environment', () => {
      // No CI environment variables set
      const ciInfo = getCIInfo();

      expect(ciInfo.actor).toBe('local-developer');
      expect(ciInfo.buildUrl).toBe('');
      expect(ciInfo.isCI).toBe(false);
    });

    it('should handle Jenkins CI', () => {
      process.env.BUILD_USER = 'jenkins-user';
      process.env.BUILD_URL = 'https://jenkins.example.com/job/test/123/';

      const ciInfo = getCIInfo();

      expect(ciInfo.actor).toBe('jenkins-user');
      expect(ciInfo.buildUrl).toBe('https://jenkins.example.com/job/test/123/');
      expect(ciInfo.isCI).toBe(true);
      expect(ciInfo.provider).toBe('jenkins');
    });
  });

  describe('Path utilities @path-utils', () => {
    const originalHome = process.env.HOME;

    afterEach(() => {
      process.env.HOME = originalHome;
    });

    it('should expand home directory path', () => {
      process.env.HOME = '/Users/testuser';
      
      const absolutePath = toAbsolutePath('~/projects/test');
      
      expect(absolutePath).toBe('/Users/testuser/projects/test');
    });

    it('should handle absolute paths correctly', () => {
      const absolutePath = toAbsolutePath('/absolute/path/to/project');
      
      expect(absolutePath).toBe('/absolute/path/to/project');
    });

    it('should resolve relative paths', () => {
      const absolutePath = toAbsolutePath('./relative/path');
      
      expect(absolutePath).toBe(path.resolve('./relative/path'));
    });

    it('should handle Windows home directory', () => {
      delete process.env.HOME;
      process.env.USERPROFILE = 'C:\\Users\\testuser';
      
      const absolutePath = toAbsolutePath('~/projects/test');
      
      expect(absolutePath).toBe(path.join('C:\\Users\\testuser', 'projects/test'));
    });
  });
});