'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  Play,
  Settings,
  Hexagon,
  ChevronDown,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Button } from '@/components/ui/button';
import { GenerateDialog } from '@/components/dialogs/generate-dialog';
import { ProjectSettingsDialog } from '@/components/dialogs/project-settings-dialog';
import { GitHubConnect } from '@/components/auth/github-connect';
import { WalletConnectButton } from '@/components/auth/wallet-connect-button';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AIChatModal } from '@/components/dialogs/ai-chat-modal';
import type { BlueprintNode, BlueprintEdge } from '@dapp-forge/blueprint-schema';
import { AuthFlowModal } from '../auth/auth-flow-modal';

export function Header() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const {
    blueprint,
    exportBlueprint,
    importBlueprint,
  } = useBlueprintStore();

  // Handle applying AI-generated workflow to canvas
  const handleApplyWorkflow = useCallback((
    blueprintNodes: BlueprintNode[],
    blueprintEdges: BlueprintEdge[]
  ) => {
    // Get current state and update the blueprint directly
    const currentState = useBlueprintStore.getState();

    // Update blueprint with new nodes and edges (append to existing)
    useBlueprintStore.setState({
      ...currentState,
      blueprint: {
        ...currentState.blueprint,
        nodes: [...currentState.blueprint.nodes, ...blueprintNodes],
        edges: [...currentState.blueprint.edges, ...blueprintEdges],
        updatedAt: new Date().toISOString(),
      },
    });
  }, []);

  const handleExport = () => {
    const json = exportBlueprint();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.config.project.name || 'blueprint'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          importBlueprint(text);
        } catch (error) {
          console.error('Failed to import blueprint:', error);
        }
      }
    };
    input.click();
  };

  return (
    <header className="h-14 border-b border-forge-border/50 bg-forge-surface/80 backdrop-blur-xl flex items-center justify-between px-4 z-50 relative">
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent" />

      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-cyan/60 p-[1.5px]">
            <div className="w-full h-full rounded-[6px] bg-forge-bg flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-accent-cyan" strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white leading-tight">
              Cradle
            </span>
            <span className="text-[9px] uppercase tracking-wider text-forge-muted -mt-0.5">
              Web3 Foundation Builder
            </span>
          </div>
        </motion.div>

        <div className="h-6 w-px bg-forge-border/40 mx-2" />

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-forge-elevated/50 transition-colors group"
        >
          <span className="text-[10px] text-forge-muted uppercase tracking-wide">Project</span>
          <span className="text-sm font-medium text-white group-hover:text-accent-cyan transition-colors">
            {blueprint.config.project.name || 'Untitled'}
          </span>
          <ChevronDown className="w-3 h-3 text-forge-muted" />
        </button>
      </div>

      {/* Center - Stats */}
      <motion.div
        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-forge-elevated/40 border border-forge-border/30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
          <span className="text-xs font-mono text-forge-text">
            <span className="text-accent-cyan font-medium">{blueprint.nodes.length}</span>
            <span className="text-forge-muted ml-1">nodes</span>
          </span>
        </div>
        <div className="w-px h-3 bg-forge-border/40" />
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
          <span className="text-xs font-mono text-forge-text">
            <span className="text-accent-purple font-medium">{blueprint.edges.length}</span>
            <span className="text-forge-muted ml-1">edges</span>
          </span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          className="h-8 px-2.5 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Import
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="h-8 px-2.5 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Export
        </Button>

        <div className="w-px h-5 bg-forge-border/40 mx-1" />

        <AuthGuard onClick={() => setShowAI(true)}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            AI Assist
          </Button>
        </AuthGuard>

        <div className="w-px h-5 bg-forge-border/40 mx-1" />

        {/* Wallet Connect Button */}
        <WalletConnectButton variant="default" />

        <div className="w-px h-5 bg-forge-border/40 mx-1" />

        <GitHubConnect />

        {/* <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="h-8 w-8 p-0 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button> */}

        <AuthGuard onClick={() => setShowGenerate(true)} requireGitHub={true}>
          <Button
            size="sm"
            className="h-8 ml-1 bg-accent-cyan hover:bg-accent-cyan/90 text-black font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Generate
            <Play className="w-2.5 h-2.5 ml-1 fill-current" />
          </Button>
        </AuthGuard>
      </motion.div>

      {/* Dialogs */}
      <GenerateDialog open={showGenerate} onOpenChange={setShowGenerate} />
      <ProjectSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <AIChatModal
        open={showAI}
        onOpenChange={setShowAI}
        onApplyWorkflow={handleApplyWorkflow}
      />
      {/* <AuthFlowModal
        open={showAuthModal}
        onOpenChange={closeAuthModal}
        requireGitHub={true}
      /> */}
    </header>
  );
}
