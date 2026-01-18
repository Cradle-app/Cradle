import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import type { GitHubAppConfig, AuditLogEntry } from './types';

/**
 * GitHub App client with authentication and audit logging
 */
export class GitHubAppClient {
  private octokit: Octokit | null = null;
  private config: GitHubAppConfig;
  private auditLog: AuditLogEntry[] = [];

  constructor(config: GitHubAppConfig) {
    this.config = config;
  }

  /**
   * Get authenticated Octokit instance
   */
  async getOctokit(): Promise<Octokit> {
    if (this.octokit) {
      return this.octokit;
    }

    // If we have a simple token (for development)
    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
      this.logAudit('auth', 'token', 'github-api', { method: 'token' }, true);
      return this.octokit;
    }

    // Use GitHub App authentication
    if (!this.config.appId || !this.config.privateKey) {
      throw new Error('GitHub App ID and private key are required');
    }

    try {
      this.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.config.appId,
          privateKey: this.config.privateKey,
          installationId: this.config.installationId,
        },
      });

      this.logAudit('auth', 'app', 'github-api', { 
        appId: this.config.appId,
        installationId: this.config.installationId,
      }, true);

      return this.octokit;
    } catch (error) {
      this.logAudit('auth', 'app', 'github-api', {
        appId: this.config.appId,
      }, false, (error as Error).message);
      throw error;
    }
  }

  /**
   * Log an audit entry
   */
  logAudit(
    action: AuditLogEntry['action'],
    actor: string,
    target: string,
    details: Record<string, unknown>,
    success: boolean,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      actor,
      target,
      details,
      success,
      error,
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[GitHub Audit]', JSON.stringify(entry));
    }
  }

  /**
   * Get recent audit log entries
   */
  getAuditLog(limit = 100): AuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get authenticated user info
   */
  async getAuthenticatedUser(): Promise<{ login: string; id: number }> {
    const octokit = await this.getOctokit();
    const { data } = await octokit.users.getAuthenticated();
    return { login: data.login, id: data.id };
  }

  /**
   * List installations for the app
   */
  async listInstallations(): Promise<Array<{ id: number; account: string }>> {
    const octokit = await this.getOctokit();
    const { data } = await octokit.apps.listInstallations();
    
    return data.map(installation => ({
      id: installation.id,
      account: installation.account?.login || 'unknown',
    }));
  }

  /**
   * Check rate limit status
   */
  async getRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    const octokit = await this.getOctokit();
    const { data } = await octokit.rateLimit.get();
    
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
    };
  }
}

/**
 * Create a singleton instance with environment config
 */
let defaultClient: GitHubAppClient | null = null;

export function getDefaultClient(): GitHubAppClient {
  if (!defaultClient) {
    defaultClient = new GitHubAppClient({
      appId: process.env.GITHUB_APP_ID || '',
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY || '',
      installationId: process.env.GITHUB_INSTALLATION_ID 
        ? parseInt(process.env.GITHUB_INSTALLATION_ID) 
        : undefined,
    });
  }
  return defaultClient;
}

