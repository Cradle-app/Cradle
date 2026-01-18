'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Upload, 
  Play, 
  Settings, 
  Hexagon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Button } from '@/components/ui/button';
import { GenerateDialog } from '@/components/dialogs/generate-dialog';
import { ProjectSettingsDialog } from '@/components/dialogs/project-settings-dialog';
import { GitHubConnect } from '@/components/auth/github-connect';

export function Header() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { blueprint, exportBlueprint, importBlueprint } = useBlueprintStore();

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
    <header className="h-16 border-b border-forge-border/50 bg-forge-surface/80 backdrop-blur-2xl flex items-center justify-between px-5 z-50 relative overflow-hidden">
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
      
      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent-cyan/20 blur-xl rounded-full" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan via-accent-purple to-accent-magenta p-[2px]">
              <div className="w-full h-full rounded-[10px] bg-forge-bg flex items-center justify-center">
                <Hexagon className="w-5 h-5 text-accent-cyan" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-white to-forge-muted bg-clip-text text-transparent">
              Cradle
            </span>
            <span className="text-[10px] uppercase tracking-widest text-forge-muted font-medium -mt-0.5">
              Web3 Foundation Builder
            </span>
          </div>
        </motion.div>
        
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-forge-border to-transparent mx-1" />
        
        <motion.button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-forge-elevated/50 transition-all duration-200 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xs text-forge-muted uppercase tracking-wide">Project</span>
          <span className="text-sm font-semibold text-white group-hover:text-accent-cyan transition-colors">
            {blueprint.config.project.name || 'Untitled'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-forge-muted group-hover:text-accent-cyan transition-colors" />
        </motion.button>
      </div>

      {/* Center - Stats */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-2 rounded-full bg-forge-elevated/50 border border-forge-border/50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-forge-border/50">
          <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-sm font-mono text-forge-text">
            <span className="text-accent-cyan font-semibold">{blueprint.nodes.length}</span>
            <span className="text-forge-muted ml-1">nodes</span>
          </span>
        </div>
        <div className="flex items-center gap-2 pl-3">
          <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" style={{ animationDelay: '0.5s' }} />
          <span className="text-sm font-mono text-forge-text">
            <span className="text-accent-purple font-semibold">{blueprint.edges.length}</span>
            <span className="text-forge-muted ml-1">edges</span>
          </span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleImport}
          className="text-forge-muted hover:text-white hover:bg-forge-elevated/50 transition-all duration-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleExport}
          className="text-forge-muted hover:text-white hover:bg-forge-elevated/50 transition-all duration-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <div className="h-6 w-px bg-forge-border/50 mx-1" />

        <GitHubConnect />

        <div className="h-6 w-px bg-forge-border/50 mx-1" />

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowSettings(true)}
          className="text-forge-muted hover:text-white hover:bg-forge-elevated/50 w-9 h-9 p-0"
        >
          <Settings className="w-4 h-4" />
        </Button>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={() => setShowGenerate(true)}
            className="relative overflow-hidden bg-gradient-to-r from-accent-cyan via-accent-lime to-accent-cyan bg-[length:200%_100%] animate-gradient-shift text-black font-semibold shadow-lg shadow-accent-cyan/20 hover:shadow-accent-cyan/40 transition-shadow duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
            <Play className="w-3 h-3 ml-1.5 fill-current" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Dialogs */}
      <GenerateDialog open={showGenerate} onOpenChange={setShowGenerate} />
      <ProjectSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </header>
  );
}

