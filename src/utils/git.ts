/**
 * Git utilities for extracting repository information
 * Similar to fern-ginkgo-client utils
 */

import * as path from 'path';
import * as fs from 'fs';
import { simpleGit, SimpleGit } from 'simple-git';
import { GitInfo, CIInfo } from '../types';
import { getEnvVar, ENV_VARS, isCI, getWorkingDirectory } from '../config';

/**
 * Find the git root directory by walking up the directory tree
 */
export function findGitRoot(startPath?: string): string | null {
  const searchPath = startPath || getWorkingDirectory();
  let currentPath = path.resolve(searchPath);
  
  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return null;
}

/**
 * Get git information from the repository
 */
export async function getGitInfo(): Promise<GitInfo> {
  const defaultGitInfo: GitInfo = {
    branch: 'unknown',
    sha: 'unknown'
  };

  try {
    // First try to get from CI environment variables
    if (isCI()) {
      const ciGitInfo = getGitInfoFromCI();
      if (ciGitInfo.branch !== 'unknown' || ciGitInfo.sha !== 'unknown') {
        return ciGitInfo;
      }
    }

    // Fall back to git repository
    const gitRoot = findGitRoot();
    if (!gitRoot) {
      console.warn('Git repository not found, using default values');
      return defaultGitInfo;
    }

    const git: SimpleGit = simpleGit(gitRoot);
    
    // Check if this is a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      console.warn('Not a git repository, using default values');
      return defaultGitInfo;
    }

    // Get current branch
    let branch = 'unknown';
    try {
      const branchSummary = await git.branch();
      branch = branchSummary.current || 'unknown';
    } catch (error) {
      console.warn('Failed to get git branch:', error);
    }

    // Get latest commit SHA
    let sha = 'unknown';
    try {
      const log = await git.log({ maxCount: 1 });
      sha = log.latest?.hash || 'unknown';
    } catch (error) {
      console.warn('Failed to get git commit SHA:', error);
    }

    return {
      branch,
      sha,
      repoPath: gitRoot
    };
    
  } catch (error) {
    console.warn('Failed to get git information:', error);
    return defaultGitInfo;
  }
}

/**
 * Extract git information from CI environment variables
 */
function getGitInfoFromCI(): GitInfo {
  // GitHub Actions
  if (getEnvVar(ENV_VARS.GITHUB_SHA)) {
    const ref = getEnvVar(ENV_VARS.GITHUB_REF) || '';
    const branch = ref.replace('refs/heads/', '').replace('refs/pull/', 'pr-').replace('/merge', '');
    
    return {
      branch: branch || 'unknown',
      sha: getEnvVar(ENV_VARS.GITHUB_SHA) || 'unknown'
    };
  }

  // GitLab CI
  if (getEnvVar(ENV_VARS.CI_COMMIT_SHA)) {
    return {
      branch: getEnvVar(ENV_VARS.CI_COMMIT_REF_NAME) || 'unknown',
      sha: getEnvVar(ENV_VARS.CI_COMMIT_SHA) || 'unknown'
    };
  }

  // Jenkins
  if (getEnvVar(ENV_VARS.GIT_COMMIT)) {
    return {
      branch: getEnvVar(ENV_VARS.GIT_BRANCH) || 'unknown',
      sha: getEnvVar(ENV_VARS.GIT_COMMIT) || 'unknown'
    };
  }

  // CircleCI
  if (getEnvVar(ENV_VARS.CIRCLE_SHA1)) {
    return {
      branch: getEnvVar(ENV_VARS.CIRCLE_BRANCH) || 'unknown',
      sha: getEnvVar(ENV_VARS.CIRCLE_SHA1) || 'unknown'
    };
  }

  return {
    branch: 'unknown',
    sha: 'unknown'
  };
}

/**
 * Get CI/CD information
 */
export function getCIInfo(): CIInfo {
  // Check CI providers in order of preference
  
  // GitHub Actions
  if (getEnvVar(ENV_VARS.GITHUB_ACTOR)) {
    const serverUrl = getEnvVar(ENV_VARS.GITHUB_SERVER_URL) || 'https://github.com';
    const repository = getEnvVar(ENV_VARS.GITHUB_REPOSITORY) || '';
    const runId = getEnvVar(ENV_VARS.GITHUB_RUN_ID) || '';
    
    return {
      actor: getEnvVar(ENV_VARS.GITHUB_ACTOR) || 'github-actions',
      buildUrl: `${serverUrl}/${repository}/actions/runs/${runId}`,
      isCI: true,
      provider: 'github-actions'
    };
  }

  // GitLab CI
  if (getEnvVar(ENV_VARS.GITLAB_USER_LOGIN)) {
    const projectUrl = getEnvVar(ENV_VARS.CI_PROJECT_URL) || '';
    const pipelineId = getEnvVar(ENV_VARS.CI_PIPELINE_ID) || '';
    
    return {
      actor: getEnvVar(ENV_VARS.GITLAB_USER_LOGIN) || 'gitlab-ci',
      buildUrl: `${projectUrl}/-/pipelines/${pipelineId}`,
      isCI: true,
      provider: 'gitlab-ci'
    };
  }

  // Jenkins
  if (getEnvVar(ENV_VARS.BUILD_USER)) {
    return {
      actor: getEnvVar(ENV_VARS.BUILD_USER) || 'jenkins',
      buildUrl: getEnvVar(ENV_VARS.BUILD_URL) || '',
      isCI: true,
      provider: 'jenkins'
    };
  }

  // CircleCI
  if (getEnvVar(ENV_VARS.CIRCLE_USERNAME)) {
    return {
      actor: getEnvVar(ENV_VARS.CIRCLE_USERNAME) || 'circleci',
      buildUrl: getEnvVar(ENV_VARS.CIRCLE_BUILD_URL) || '',
      isCI: true,
      provider: 'circleci'
    };
  }

  // Local development or unknown CI
  if (!isCI()) {
    return {
      actor: 'local-developer',
      buildUrl: '',
      isCI: false
    };
  }

  // Generic CI
  return {
    actor: 'ci-user',
    buildUrl: '',
    isCI: true,
    provider: 'unknown'
  };
}

/**
 * Convert path to absolute path, expanding ~ for home directory
 */
export function toAbsolutePath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, inputPath.slice(1));
  }
  
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  
  return path.resolve(inputPath);
}