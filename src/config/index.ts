/**
 * Configuration constants and utilities for fern-jest-client
 */

export const DEFAULT_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  TIMEOUT: 30000,
  RETRIES: 3,
  RETRY_DELAY: 1000,
  API_ENDPOINT: '/api/v1/test-runs',
} as const;

export const ENV_VARS = {
  FERN_REPORTER_BASE_URL: 'FERN_REPORTER_BASE_URL',
  FERN_PROJECT_ID: 'FERN_PROJECT_ID',
  FERN_ENABLED: 'FERN_ENABLED',
  GIT_REPO_PATH: 'GIT_REPO_PATH',
  
  // CI/CD Environment Variables
  GITHUB_ACTOR: 'GITHUB_ACTOR',
  GITHUB_SHA: 'GITHUB_SHA',
  GITHUB_REF: 'GITHUB_REF',
  GITHUB_SERVER_URL: 'GITHUB_SERVER_URL',
  GITHUB_REPOSITORY: 'GITHUB_REPOSITORY',
  GITHUB_RUN_ID: 'GITHUB_RUN_ID',
  
  // GitLab CI
  GITLAB_USER_LOGIN: 'GITLAB_USER_LOGIN',
  CI_COMMIT_SHA: 'CI_COMMIT_SHA',
  CI_COMMIT_REF_NAME: 'CI_COMMIT_REF_NAME',
  CI_PROJECT_URL: 'CI_PROJECT_URL',
  CI_PIPELINE_ID: 'CI_PIPELINE_ID',
  
  // Jenkins
  BUILD_USER: 'BUILD_USER',
  GIT_COMMIT: 'GIT_COMMIT',
  GIT_BRANCH: 'GIT_BRANCH',
  BUILD_URL: 'BUILD_URL',
  
  // CircleCI
  CIRCLE_USERNAME: 'CIRCLE_USERNAME',
  CIRCLE_SHA1: 'CIRCLE_SHA1',
  CIRCLE_BRANCH: 'CIRCLE_BRANCH',
  CIRCLE_BUILD_URL: 'CIRCLE_BUILD_URL',
} as const;

/**
 * Get configuration value from environment variables with fallback
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.JENKINS_URL
  );
}

/**
 * Get the current working directory for git operations
 */
export function getWorkingDirectory(): string {
  return getEnvVar(ENV_VARS.GIT_REPO_PATH) || process.cwd();
}