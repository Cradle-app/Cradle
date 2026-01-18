import type { 
  CreateRepoOptions, 
  CommitFilesOptions, 
  CreatePROptions,
  RepositoryInfo,
  PullRequestInfo,
  FileContent,
} from './types';
import { GitHubAppClient, getDefaultClient } from './client';

/**
 * Create a new GitHub repository
 */
export async function createRepository(
  options: CreateRepoOptions,
  client?: GitHubAppClient
): Promise<RepositoryInfo> {
  const ghClient = client || getDefaultClient();
  const octokit = await ghClient.getOctokit();

  try {
    let response;

    if (options.org) {
      // Create in organization
      response = await octokit.repos.createInOrg({
        org: options.org,
        name: options.name,
        description: options.description,
        private: options.private ?? true,
        auto_init: options.autoInit ?? false,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate,
      });
    } else {
      // Create for authenticated user
      response = await octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private ?? true,
        auto_init: options.autoInit ?? false,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate,
      });
    }

    const repo = response.data;

    ghClient.logAudit(
      'repo_create',
      'cradle',
      repo.full_name,
      { private: repo.private, autoInit: options.autoInit },
      true
    );

    return {
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      defaultBranch: repo.default_branch,
      private: repo.private,
    };
  } catch (error) {
    ghClient.logAudit(
      'repo_create',
      'cradle',
      options.name,
      { org: options.org },
      false,
      (error as Error).message
    );
    throw error;
  }
}

/**
 * Commit files to a repository using Git Data API
 */
export async function commitFiles(
  options: CommitFilesOptions,
  client?: GitHubAppClient
): Promise<{ sha: string; url: string }> {
  const ghClient = client || getDefaultClient();
  const octokit = await ghClient.getOctokit();
  const { owner, repo, branch, message, files } = options;

  try {
    // Get the current commit SHA for the branch (or create initial commit)
    let baseSha = options.baseSha;
    
    if (!baseSha) {
      try {
        const { data: ref } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });
        baseSha = ref.object.sha;
      } catch {
        // Branch doesn't exist yet - will create it
        baseSha = undefined;
      }
    }

    // Create blobs for all files
    const blobPromises = files.map(async (file) => {
      const content = typeof file.content === 'string'
        ? file.content
        : file.content.toString('base64');
      
      const encoding = typeof file.content === 'string' ? 'utf-8' : 'base64';

      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content,
        encoding,
      });

      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      };
    });

    const blobs = await Promise.all(blobPromises);

    // Create tree
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      tree: blobs,
      base_tree: baseSha,
    });

    // Create commit
    const commitData: Parameters<typeof octokit.git.createCommit>[0] = {
      owner,
      repo,
      message,
      tree: tree.sha,
    };

    if (baseSha) {
      commitData.parents = [baseSha];
    }

    const { data: commit } = await octokit.git.createCommit(commitData);

    // Update or create branch reference
    try {
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: commit.sha,
      });
    } catch {
      // Create new reference if it doesn't exist
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: commit.sha,
      });
    }

    ghClient.logAudit(
      'commit',
      'cradle',
      `${owner}/${repo}`,
      { branch, fileCount: files.length, sha: commit.sha },
      true
    );

    return {
      sha: commit.sha,
      url: commit.html_url,
    };
  } catch (error) {
    ghClient.logAudit(
      'commit',
      'cradle',
      `${owner}/${repo}`,
      { branch, fileCount: files.length },
      false,
      (error as Error).message
    );
    throw error;
  }
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  options: CreatePROptions,
  client?: GitHubAppClient
): Promise<PullRequestInfo> {
  const ghClient = client || getDefaultClient();
  const octokit = await ghClient.getOctokit();

  try {
    const { data: pr } = await octokit.pulls.create({
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      body: options.body,
      head: options.head,
      base: options.base,
      draft: options.draft,
    });

    ghClient.logAudit(
      'pr_create',
      'cradle',
      `${options.owner}/${options.repo}`,
      { prNumber: pr.number, head: options.head, base: options.base },
      true
    );

    return {
      number: pr.number,
      htmlUrl: pr.html_url,
      state: pr.state,
      title: pr.title,
      merged: pr.merged,
    };
  } catch (error) {
    ghClient.logAudit(
      'pr_create',
      'cradle',
      `${options.owner}/${options.repo}`,
      { head: options.head, base: options.base },
      false,
      (error as Error).message
    );
    throw error;
  }
}

/**
 * Helper to convert memfs files to GitHub file content
 */
export function convertToFileContent(
  files: Array<{ path: string; content: string | Buffer }>
): FileContent[] {
  return files.map(file => ({
    path: file.path,
    content: file.content,
    encoding: typeof file.content === 'string' ? 'utf-8' : 'base64',
  }));
}

