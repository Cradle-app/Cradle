/**
 * GitHub App configuration
 */
export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  installationId?: number;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Repository information
 */
export interface RepositoryInfo {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  private: boolean;
}

/**
 * Options for creating a repository
 */
export interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
  org?: string;
}

/**
 * File content for commits
 */
export interface FileContent {
  path: string;
  content: string | Buffer;
  encoding?: 'utf-8' | 'base64';
}

/**
 * Options for committing files
 */
export interface CommitFilesOptions {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: FileContent[];
  baseSha?: string;
}

/**
 * Options for creating a pull request
 */
export interface CreatePROptions {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  head: string;
  base: string;
  draft?: boolean;
}

/**
 * Pull request information
 */
export interface PullRequestInfo {
  number: number;
  htmlUrl: string;
  state: string;
  title: string;
  merged: boolean;
}

/**
 * Audit log entry for security tracking
 */
export interface AuditLogEntry {
  timestamp: string;
  action: 'repo_create' | 'commit' | 'pr_create' | 'auth';
  actor: string;
  target: string;
  details: Record<string, unknown>;
  success: boolean;
  error?: string;
}

