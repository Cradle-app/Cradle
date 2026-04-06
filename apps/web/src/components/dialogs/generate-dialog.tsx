'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Play, Github, Loader2, Check, AlertCircle, LogIn, Sparkles, Code, Layers } from 'lucide-react';
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
import { useBlueprintStore } from '@/store/blueprint';
import { useToast } from '@/components/ui/toaster';
import { generateContractInstructions } from '@/lib/contract-instructions-generator';
import { GenerationProgress, useGenerationProgress, type ProgressStep } from '@/components/ui/generation-progress';
import { GeneratedFilesExplorer } from '@/components/ui/generated-files-explorer';
import { SkeletonText } from '@/components/ui/skeleton';

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
  const toast = useToast();
  const { address: walletAddress } = useAccount();
  const { defaultSteps } = useGenerationProgress();
  const stableDefaultSteps = useMemo(() => defaultSteps, []); // ensure effect deps don't loop

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const createGitHubRepo = true;
  const [repoName, setRepoName] = useState(
    blueprint.config.project.name?.toLowerCase().replace(/\s+/g, '-') || 'my-dapp'
  );
  const [repoOwner, setRepoOwner] = useState('');
  const [result, setResult] = useState<{
    repoUrl?: string;
    fileCount?: number;
    files?: Array<{ path: string; size?: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubSession, setGithubSession] = useState<GitHubSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>(stableDefaultSteps);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [generateMode, setGenerateMode] = useState<'codebase' | 'skills' | 'both'>('codebase');

  // Fetch GitHub session status when dialog opens
  useEffect(() => {
    if (open) {
      setSessionLoading(true);
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          setGithubSession(data);
          // Auto-fill owner from connected GitHub account
          if (data.github?.username && !repoOwner) {
            setRepoOwner(data.github.username);
          }
        })
        .catch(() => setGithubSession({ authenticated: false, github: null }))
        .finally(() => setSessionLoading(false));
    }
  }, [open]);

  // Drive progress UI from generation status
  useEffect(() => {
    const next = stableDefaultSteps.map((s) => ({ ...s }));
    const setStep = (id: string, st: ProgressStep['status']) => {
      const idx = next.findIndex((x) => x.id === id);
      if (idx >= 0) next[idx].status = st;
    };

    if (status === 'idle') {
      setSteps(stableDefaultSteps);
      setCurrentStepId(null);
      return;
    }

    if (status === 'validating') {
      setStep('validate', 'active');
      setCurrentStepId('validate');
    } else if (status === 'generating') {
      setStep('validate', 'completed');
      setStep('prepare', 'completed');
      setStep('generate', 'active');
      setCurrentStepId('generate');
    } else if (status === 'success') {
      setStep('validate', 'completed');
      setStep('prepare', 'completed');
      setStep('generate', 'completed');
      if (createGitHubRepo) setStep('push', 'completed');
      setStep('complete', 'completed');
      // No active step when fully complete
      setCurrentStepId(null);
    } else if (status === 'error' || status === 'needs_auth') {
      setStep('generate', 'error');
      setCurrentStepId('generate');
    }

    setSteps(next);
  }, [status, stableDefaultSteps, createGitHubRepo]);

  const fileTree = useMemo(() => {
    const files = result?.files ?? [];
    type Node = { name: string; type: 'file' | 'folder'; children?: Node[] };
    const root: Node[] = [];

    const ensureFolder = (children: Node[], name: string) => {
      let folder = children.find((n) => n.type === 'folder' && n.name === name);
      if (!folder) {
        folder = { name, type: 'folder', children: [] };
        children.push(folder);
      }
      return folder;
    };

    for (const f of files) {
      const parts = f.path.split('/').filter(Boolean);
      let cursor = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (isLast) {
          cursor.push({ name: part, type: 'file' });
        } else {
          const folder = ensureFolder(cursor, part);
          cursor = folder.children!;
        }
      }
    }

    return root as any;
  }, [result?.files]);

  const handleConnectGitHub = () => {
    // Save current dialog state to URL so we can restore after OAuth
    window.location.href = '/api/auth/github';
  };

  const handleGenerate = async () => {
    if (blueprint.nodes.length === 0) {
      toast.error('No nodes', 'Add at least one node to generate a repository.');
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

      // Generate contract instruction markdown files for any stylus contract nodes
      const instructionFiles = generateContractInstructions(blueprint.nodes);

      // Update blueprint with GitHub config and instruction files if needed
      const githubOwner = githubSession?.github?.username || repoOwner;
      const blueprintToGenerate = {
        ...blueprint,
        generatedFiles: instructionFiles, // Include instruction markdown files
        config: {
          ...blueprint.config,
          github: createGitHubRepo ? {
            owner: githubOwner,
            repoName: repoName,
            visibility: 'public',
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
            generateMode,
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
      const files = (generateResult.result?.files || generateResult.files || []) as Array<{ path: string; size?: number }>;
      const fileCount = files.length || 0;

      setStatus('success');
      setResult({
        repoUrl,
        fileCount,
        files,
      });

      // Save repo and selected nodes/plugins to user_github_repos when created and wallet is connected
      if (createGitHubRepo && repoUrl && walletAddress) {
        const githubOwner = githubSession?.github?.username || repoOwner;
        const selected_nodes = blueprint.nodes.map((n) => ({
          type: n.type,
          label: (n.config as { label?: string })?.label,
        }));
        fetch('/api/user/repos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            repo_owner: githubOwner,
            repo_name: repoName,
            repo_url: repoUrl,
            selected_nodes,
          }),
        }).catch((err) => console.warn('Failed to save repo to profile:', err));
      }

      if (createGitHubRepo && repoUrl) {
        toast.success('Repository created!', `Your ${generateMode === 'skills' ? 'skills ' : ''}repository is ready at ${repoUrl}`);
      } else {
        const label = generateMode === 'skills' ? 'context' : generateMode === 'both' ? 'code + context' : '';
        toast.success('Generation complete!', `Generated ${fileCount} ${label} files.`);
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
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--color-accent-primary))] to-[hsl(var(--color-success))] flex items-center justify-center">
              <Play className="w-4 h-4 text-black" />
            </div>
            Build Your Project
          </DialogTitle>
          <DialogDescription>
            Choose your output mode and provide a repo name — your project will be pushed to GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-6 flex-1 overflow-y-auto">
          {/* Output mode selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[hsl(var(--color-text-muted))] uppercase tracking-wider">Output Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'codebase' as const, icon: Code, label: 'Codebase', desc: 'Production scaffold' },
                { value: 'skills' as const, icon: Sparkles, label: 'Skills Repo', desc: 'For Claude Code' },
                { value: 'both' as const, icon: Layers, label: 'Both', desc: 'Scaffold + skills' },
              ]).map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGenerateMode(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-150 ${
                    generateMode === value
                      ? 'bg-[hsl(var(--color-accent-primary)/0.08)] border-[hsl(var(--color-accent-primary)/0.4)] ring-1 ring-[hsl(var(--color-accent-primary)/0.2)]'
                      : 'bg-[hsl(var(--color-bg-base))] border-[hsl(var(--color-border-default))] hover:bg-[hsl(var(--color-bg-hover))]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    generateMode === value
                      ? 'text-[hsl(var(--color-accent-primary))]'
                      : 'text-[hsl(var(--color-text-muted))]'
                  }`} />
                  <span className={`text-xs font-medium ${
                    generateMode === value
                      ? 'text-[hsl(var(--color-accent-primary))]'
                      : 'text-[hsl(var(--color-text-primary))]'
                  }`}>{label}</span>
                  <span className="text-[10px] text-[hsl(var(--color-text-muted))]">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GitHub repo — always on */}
          <div className="space-y-3 p-4 rounded-lg bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))]">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-[hsl(var(--color-text-muted))]" />
              <div>
                <p className="text-sm font-medium text-[hsl(var(--color-text-primary))]">GitHub Repository</p>
                <p className="text-xs text-[hsl(var(--color-text-muted))]">
                  Your project will be pushed to a new GitHub repository.
                </p>
              </div>
            </div>

            {!githubSession?.authenticated && (
              <div className="p-3 bg-[hsl(var(--color-warning)/0.1)] border border-[hsl(var(--color-warning)/0.3)] rounded-lg">
                <p className="text-xs text-[hsl(var(--color-warning))] mb-2">
                  Connect your GitHub account to create the repository.
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
              <div className="flex items-center gap-2 p-2 bg-[hsl(var(--color-success)/0.1)] border border-[hsl(var(--color-success)/0.3)] rounded-lg">
                <img
                  src={githubSession.github.avatar}
                  alt={githubSession.github.username}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-xs text-[hsl(var(--color-success))]">
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

          {/* Status display */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-lg border ${status === 'error'
              ? 'bg-[hsl(var(--color-error)/0.1)] border-[hsl(var(--color-error)/0.3)]'
              : status === 'needs_auth'
                ? 'bg-[hsl(var(--color-warning)/0.1)] border-[hsl(var(--color-warning)/0.3)]'
                : status === 'success'
                  ? 'bg-[hsl(var(--color-success)/0.1)] border-[hsl(var(--color-success)/0.3)]'
                  : 'bg-[hsl(var(--color-bg-elevated))] border-[hsl(var(--color-border-default))]'
              }`}>
              {/* Step-by-step progress */}
              <div className="mb-4">
                <GenerationProgress steps={steps} currentStepId={currentStepId} />
              </div>

              {status === 'validating' && (
                <div className="flex items-center gap-2 text-[hsl(var(--color-text-muted))]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Validating blueprint...</span>
                </div>
              )}
              {status === 'generating' && (
                <div className="flex items-center gap-2 text-[hsl(var(--color-accent-primary))]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {generateMode === 'skills'
                      ? 'Analyzing components...'
                      : generateMode === 'both'
                        ? 'Generating code + context...'
                        : 'Generating code...'}
                  </span>
                </div>
              )}
              {status === 'success' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[hsl(var(--color-success))]">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Generation complete!</span>
                  </div>
                  {result?.fileCount !== undefined && (
                    <p className="text-xs text-[hsl(var(--color-text-muted))]">
                      Generated {result.fileCount} {generateMode === 'skills' ? 'context' : generateMode === 'both' ? 'code + context' : ''} files
                    </p>
                  )}

                  {/* Generated Files Explorer */}
                  {Boolean(fileTree?.length) && (
                    <div className="mt-2 rounded-lg border border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-base))] overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <GeneratedFilesExplorer files={fileTree as any} />
                      </div>
                    </div>
                  )}

                  {result?.repoUrl && (
                    <div className="p-3 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))] rounded-lg">
                      <p className="text-xs text-[hsl(var(--color-text-muted))] mb-2">GitHub Repository:</p>
                      <a
                        href={result.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[hsl(var(--color-accent-primary))] hover:text-[hsl(var(--color-success))] transition-colors font-medium"
                      >
                        <Github className="w-4 h-4" />
                        <span className="break-all">{result.repoUrl}</span>
                        <span className="flex-shrink-0">→</span>
                      </a>
                      <p className="text-xs text-[hsl(var(--color-text-muted))] mt-2">
                        Click to open in a new tab
                      </p>
                    </div>
                  )}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-start gap-2 text-[hsl(var(--color-error))]">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {status === 'needs_auth' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-[hsl(var(--color-warning))]">
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
              className="bg-gradient-to-r from-[hsl(var(--color-accent-primary))] to-[hsl(var(--color-success))] text-black"
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

