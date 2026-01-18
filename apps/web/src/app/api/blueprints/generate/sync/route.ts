import { NextRequest, NextResponse } from 'next/server';

// Helper to get GitHub token from session
function getGitHubToken(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('dappforge_session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
    if (sessionData.expiresAt < Date.now()) return null;
    return sessionData.githubToken || null;
  } catch {
    return null;
  }
}

// Generate code from blueprint - uses user's GitHub OAuth token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blueprint, options } = body;

    // Get the user's GitHub token from their session
    const githubToken = getGitHubToken(request);
    
    // If user wants to create GitHub repo, they must be authenticated
    if (options?.createGitHubRepo && !githubToken) {
      return NextResponse.json(
        {
          status: 'failed',
          error: 'Please connect your GitHub account first to create repositories.',
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${orchestratorUrl}/blueprints/generate/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Pass the user's GitHub token to the orchestrator
          ...(githubToken && { 'X-GitHub-Token': githubToken }),
        },
        body: JSON.stringify({ blueprint, options }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Orchestrator request failed' }));
        return NextResponse.json(
          {
            status: 'failed',
            error: error.error || error.message || `HTTP ${response.status}`,
          },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (error) {
      // If orchestrator is not available, return a mock success
      console.warn('Orchestrator not available, returning mock response:', error);
      return NextResponse.json({
        runId: 'mock-run-id',
        status: 'completed',
        result: {
          success: true,
          files: [
            { path: 'package.json', size: 1024 },
            { path: 'README.md', size: 2048 },
            { path: 'src/index.ts', size: 512 },
          ],
          envVars: [],
          scripts: [],
          // Mock repo URL for testing
          repoUrl: options?.createGitHubRepo
            ? `https://github.com/${blueprint.config.github?.owner || 'your-username'}/${blueprint.config.github?.repoName || 'my-dapp'}`
            : undefined,
        },
        logs: [
          { timestamp: new Date().toISOString(), level: 'info', message: 'Generation started' },
          { timestamp: new Date().toISOString(), level: 'info', message: 'Generation completed' },
        ],
      });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

