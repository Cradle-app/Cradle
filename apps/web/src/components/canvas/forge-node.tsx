'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  Box, CreditCard, Bot, Layout, ShieldCheck, Trash2,
  Lock, Key, Wallet, Globe, ArrowLeftRight, Database,
  HardDrive, Layers, TrendingUp, Zap, Sparkles, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';
import { nodeTypeToLabel, nodeTypeToColor } from '@/lib/utils';

const iconMap: Record<string, typeof Box> = {
  'stylus-contract': Box,
  'stylus-zk-contract': Lock,
  'x402-paywall-api': CreditCard,
  'erc8004-agent-runtime': Bot,
  'repo-quality-gates': ShieldCheck,
  'frontend-scaffold': Layout,
  'sdk-generator': Layout,
  'eip7702-smart-eoa': Key,
  'wallet-auth': Wallet,
  'rpc-provider': Globe,
  'arbitrum-bridge': ArrowLeftRight,
  'chain-data': Database,
  'ipfs-storage': HardDrive,
  'chain-abstraction': Layers,
  'zk-primitives': Lock,
  'ostium-trading': TrendingUp,
  'aixbt-momentum': TrendingUp,
  'aixbt-signals': Zap,
  'aixbt-indigo': Sparkles,
  'aixbt-observer': Search,
};

const colorMap: Record<string, {
  bg: string;
  border: string;
  borderSelected: string;
  text: string;
  glow: string;
  accent: string;
}> = {
  'node-contracts': {
    bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/20',
    borderSelected: 'border-cyan-400/60',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-cyan-500/30',
    accent: 'bg-cyan-500',
  },
  'node-payments': {
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20',
    borderSelected: 'border-amber-400/60',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-amber-500/30',
    accent: 'bg-amber-500',
  },
  'node-agents': {
    bg: 'from-fuchsia-500/15 via-fuchsia-500/5 to-transparent',
    border: 'border-fuchsia-500/20',
    borderSelected: 'border-fuchsia-400/60',
    text: 'text-fuchsia-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-fuchsia-500/30',
    accent: 'bg-fuchsia-500',
  },
  'node-app': {
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20',
    borderSelected: 'border-emerald-400/60',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-emerald-500/30',
    accent: 'bg-emerald-500',
  },
  'node-quality': {
    bg: 'from-rose-500/15 via-rose-500/5 to-transparent',
    border: 'border-rose-500/20',
    borderSelected: 'border-rose-400/60',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-rose-500/30',
    accent: 'bg-rose-500',
  },
  'node-intelligence': {
    bg: 'from-purple-500/15 via-purple-500/5 to-transparent',
    border: 'border-purple-500/20',
    borderSelected: 'border-purple-400/60',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_30_px_-5px] shadow-purple-500/30',
    accent: 'bg-purple-500',
  },
};

function ForgeNodeComponent({ id, data, selected }: NodeProps) {
  const { selectedNodeId, removeNode } = useBlueprintStore();
  const nodeType = data.nodeType as string;
  const colorClass = nodeTypeToColor(nodeType);
  const colors = colorMap[colorClass] || colorMap['node-contracts'];
  const Icon = iconMap[nodeType] || Box;
  const isSelected = selected || selectedNodeId === id;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  return (
    <div
      className={cn(
        'group relative min-w-[200px] rounded-2xl border-2 backdrop-blur-md',
        'bg-gradient-to-br bg-forge-surface/90',
        'transition-all duration-300 ease-out',
        isSelected ? colors.borderSelected : colors.border,
        isSelected && colors.glow,
        !isSelected && 'hover:scale-[1.02]'
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50',
        colors.bg
      )} />

      {/* Top accent line */}
      <div className={cn(
        'absolute top-0 left-4 right-4 h-[2px] rounded-full',
        colors.accent,
        'opacity-60'
      )} />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-4 !h-4 !-left-2 !border-[3px] !rounded-full',
          '!bg-forge-bg !border-forge-border',
          'hover:!border-white/50 transition-colors duration-200',
          isSelected && '!border-white/40'
        )}
      />

      {/* Node content */}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon container */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              'bg-forge-bg/80 border border-white/5',
              'group-hover:border-white/10 transition-colors duration-200'
            )}
          >
            <Icon className={cn('w-5 h-5', colors.text)} />
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {data.label || data.contractName || data.agentName || nodeTypeToLabel(nodeType)}
            </p>
            <p className={cn('text-[11px] truncate mt-1 font-medium', colors.text, 'opacity-80')}>
              {nodeTypeToLabel(nodeType)}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={cn(
              'p-1.5 rounded-lg text-forge-muted transition-all duration-200',
              'hover:bg-red-500/20 hover:text-red-400',
              'opacity-0 group-hover:opacity-100',
              isSelected && 'opacity-100'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {nodeType === 'stylus-contract' && data.contractType && (
            <span className={cn(
              'text-[10px] px-2 py-1 rounded-md font-mono uppercase tracking-wide',
              'bg-forge-bg/60 border border-white/5',
              colors.text
            )}>
              {String(data.contractType)}
            </span>
          )}

          {nodeType === 'x402-paywall-api' && data.currency && (
            <span className={cn(
              'text-[10px] px-2 py-1 rounded-md font-mono uppercase tracking-wide',
              'bg-forge-bg/60 border border-white/5',
              colors.text
            )}>
              {data.currency}
            </span>
          )}

          {nodeType === 'erc8004-agent-runtime' && data.modelProvider && (
            <span className={cn(
              'text-[10px] px-2 py-1 rounded-md font-mono tracking-wide',
              'bg-forge-bg/60 border border-white/5',
              colors.text
            )}>
              {data.modelProvider}
            </span>
          )}

          {nodeType === 'ostium-trading' && (
            <span className={cn(
              'text-[10px] px-2 py-1 rounded-md font-mono uppercase tracking-wide',
              'bg-forge-bg/60 border border-white/5',
              colors.text
            )}>
              {data.network || 'arbitrum'}
            </span>
          )}

          {/* Show a subtle ID indicator */}
          <span className="text-[9px] px-2 py-1 rounded-md font-mono text-forge-muted/50 bg-forge-bg/30">
            {id.slice(0, 6)}
          </span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          '!w-4 !h-4 !-right-2 !border-[3px] !rounded-full',
          '!bg-forge-bg !border-forge-border',
          'hover:!border-white/50 transition-colors duration-200',
          isSelected && '!border-white/40'
        )}
      />

      {/* Selection indicator ring */}
      {isSelected && (
        <div className={cn(
          'absolute -inset-1 rounded-[20px] border-2 pointer-events-none',
          'border-white/20 animate-pulse'
        )} />
      )}
    </div>
  );
}

export const ForgeNode = memo(ForgeNodeComponent);

