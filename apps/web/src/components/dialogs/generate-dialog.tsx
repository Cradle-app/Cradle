'use client';

import { useState, useEffect } from 'react';
import { Play, Github, Loader2, Check, AlertCircle, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useBlueprintStore } from '@/store/blueprint';
import { useToast } from '@/components/ui/toaster';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GenerationStatus = 'idle' | 'validating' | 'generating' | 'success' | 'error' | 'needs_auth';

interface GitHubSession {
  authenticated: boolean;
  github: { username: string; avatar: string } | null;
}

export function GenerateDialog({ open, onOpenChange }: Props) {
  const { blueprint } = useBlueprintStore();
  const { addToast } = useToast();

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [createGitHubRepo, setCreateGitHubRepo] = useState(false);
  const [repoName, setRepoName] = useState(
    blueprint.config.project.name?.toLowerCase().replace(/\s+/g, '-') || 'my-dapp'
  );
  const [repoOwner, setRepoOwner] = useState('');
  const [result, setResult] = useState<{
    repoUrl?: string;
    fileCount?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubSession, setGithubSession] = useState<GitHubSession | null>(null);

  // Fetch GitHub session status when dialog opens
  useEffect(() => {
    if (open) {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          setGithubSession(data);
          // Auto-fill owner from connected GitHub account
          if (data.github?.username && !repoOwner) {
            setRepoOwner(data.github.username);
          }
        })
        .catch(() => setGithubSession({ authenticated: false, github: null }));
    }
  }, [open]);

  const handleConnectGitHub = () => {
    // Save current dialog state to URL so we can restore after OAuth
    window.location.href = '/api/auth/github';
  };

  const handleGenerate = async () => {
    if (blueprint.nodes.length === 0) {
      addToast({
        title: 'No nodes',
        description: 'Add at least one node to generate a repository.',
        variant: 'error',
      });
      return;
    }

    setStatus('validating');
    setError(null);
    setResult(null);

    try {
      // First validate
      const validateResponse = await fetch('/api/blueprints/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint }),
      });

      const validation = await validateResponse.json();

      if (!validation.valid) {
        setStatus('error');
        setError(`Validation failed: ${validation.errors[0]?.message || 'Unknown error'}`);
        return;
      }

      setStatus('generating');

      // Update blueprint with GitHub config if needed
      const githubOwner = githubSession?.github?.username || repoOwner;
      const blueprintToGenerate = {
        ...blueprint,
        config: {
          ...blueprint.config,
          github: createGitHubRepo ? {
            owner: githubOwner,
            repoName: repoName,
            visibility: 'private',
            defaultBranch: 'main',
          } : undefined,
        },
      };

      // Generate
      const generateResponse = await fetch('/api/blueprints/generate/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint: blueprintToGenerate,
          options: {
            createGitHubRepo,
          },
        }),
      });

      const generateResult = await generateResponse.json();

      if (generateResult.status === 'failed') {
        // Check if auth is required
        if (generateResult.requiresAuth) {
          setStatus('needs_auth');
          setError(generateResult.error || 'Please connect your GitHub account.');
          return;
        }
        setStatus('error');
        setError(generateResult.error || 'Generation failed');
        return;
      }

      const repoUrl = generateResult.result?.repoUrl || generateResult.repoUrl;
      const fileCount = generateResult.result?.files?.length || 0;

      setStatus('success');
      setResult({
        repoUrl,
        fileCount,
      });

      if (createGitHubRepo && repoUrl) {
        addToast({
          title: 'Repository created!',
          description: `Your repository is ready at ${repoUrl}`,
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Generation complete!',
          description: `Generated ${fileCount} files.`,
          variant: 'success',
        });
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-lime flex items-center justify-center">
              <Play className="w-4 h-4 text-black" />
            </div>
            Build Foundation
          </DialogTitle>
          <DialogDescription>
            Generate your project&apos;s foundation - clean, structured code ready for AI-assisted development.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* GitHub option */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-forge-bg border border-forge-border">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-forge-muted" />
              <div>
                <p className="text-sm font-medium text-white">Create GitHub Repository</p>
                <p className="text-xs text-forge-muted">
                  {githubSession?.authenticated
                    ? `Connected as ${githubSession.github?.username}`
                    : 'Push generated code to GitHub'}
                </p>
              </div>
            </div>
            <Switch
              checked={createGitHubRepo}
              onCheckedChange={setCreateGitHubRepo}
            />
          </div>

          {/* GitHub config */}
          {createGitHubRepo && (
            <div className="space-y-3 pl-4 border-l-2 border-accent-cyan/30">
              {!githubSession?.authenticated && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400 mb-2">
                    You&apos;ll need to connect your GitHub account to create repositories.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleConnectGitHub}
                    className="bg-[#24292f] hover:bg-[#30363d] text-white text-xs"
                  >
                    <Github className="w-3 h-3 mr-1.5" />
                    Connect GitHub
                  </Button>
                </div>
              )}
              {githubSession?.authenticated && githubSession.github && (
                <div className="flex items-center gap-2 p-2 bg-accent-lime/10 border border-accent-lime/30 rounded-lg">
                  <img
                    src={githubSession.github.avatar}
                    alt={githubSession.github.username}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs text-accent-lime">
                    Creating as {githubSession.github.username}
                  </span>
                </div>
              )}
              <Input
                label="Repository Name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-dapp"
              />
            </div>
          )}

          {/* Status display */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-lg border ${status === 'error'
                ? 'bg-accent-coral/10 border-accent-coral/30'
                : status === 'needs_auth'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : status === 'success'
                    ? 'bg-accent-lime/10 border-accent-lime/30'
                    : 'bg-forge-elevated border-forge-border'
              }`}>
              {status === 'validating' && (
                <div className="flex items-center gap-2 text-forge-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Validating blueprint...</span>
                </div>
              )}
              {status === 'generating' && (
                <div className="flex items-center gap-2 text-accent-cyan">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating code...</span>
                </div>
              )}
              {status === 'success' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-accent-lime">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Generation complete!</span>
                  </div>
                  {result?.fileCount !== undefined && (
                    <p className="text-xs text-forge-muted">
                      Generated {result.fileCount} files
                    </p>
                  )}
                  {result?.repoUrl && (
                    <div className="p-3 bg-forge-bg border border-forge-border rounded-lg">
                      <p className="text-xs text-forge-muted mb-2">GitHub Repository:</p>
                      <a
                        href={result.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-accent-cyan hover:text-accent-lime transition-colors font-medium"
                      >
                        <Github className="w-4 h-4" />
                        <span className="break-all">{result.repoUrl}</span>
                        <span className="flex-shrink-0">→</span>
                      </a>
                      <p className="text-xs text-forge-muted mt-2">
                        Click to open in a new tab
                      </p>
                    </div>
                  )}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-start gap-2 text-accent-coral">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {status === 'needs_auth' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-amber-400">
                    <LogIn className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                  <Button
                    onClick={handleConnectGitHub}
                    className="w-full bg-[#24292f] hover:bg-[#30363d] text-white"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Connect GitHub Account
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            {status === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {status !== 'success' && (
            <Button
              onClick={handleGenerate}
              disabled={status === 'validating' || status === 'generating'}
              className="bg-gradient-to-r from-accent-cyan to-accent-lime text-black"
            >
              {(status === 'validating' || status === 'generating') && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {status === 'error' ? 'Retry' : 'Generate'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

