'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  CreditCard,
  Bot,
  Layout,
  ShieldCheck,
  Search,
  Wallet,
  Globe,
  Database,
  HardDrive,
  Layers,
  Lock,
  Link,
  ArrowLeftRight,
  Key,
  Sparkles,
  X,
  TrendingUp,
  Zap,
  Coins,
  Star,
  GitBranch,
  ListTree,
  Mail,
  Timer,
  Variable,
  Shuffle,
  Repeat,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthGuard } from '@/components/auth/auth-guard';
import { useAuthStore } from '@/store/auth';
import {
  CATEGORY_DEFINITIONS,
  PLUGIN_REGISTRY,
  getPluginsByCategory,
  type PluginIcon,
  type PluginRegistryEntry,
} from '@cradle/plugin-config';
import { useSuggestedPlugins } from '@/hooks/use-suggested-plugins';
import { useBlueprintStore } from '@/store/blueprint';

// Logo asset imports
import AaveLogo from '@/assets/blocks/Aave.svg';
import CompoundLogo from '@/assets/blocks/Compound.svg';
import ChainlinkLogo from '@/assets/blocks/Chainlink.svg';
import PythLogo from '@/assets/blocks/Pyth.svg';
import UniswapLogo from '@/assets/blocks/Uniswap.svg';
import CSLogo from '@/assets/blocks/CS_logo.png';
import AuditwareLogo from '@/assets/blocks/auditware.png';
import StylusLogo from '@/assets/blocks/stylus.svg';
import OstiumLogo from '@/assets/blocks/Ostium.svg';
import MaxxitLogo from '@/assets/blocks/MaxxitLogo.png';
import AIbotLogo from '@/assets/blocks/AIbot.png';
import WalletLogoSvg from '@/assets/blocks/Wallet.svg';
import WalletLogoPng from '@/assets/blocks/Wallet.png';
import SuperpositionLogo from '@/assets/blocks/superposition.png';
import DuneLogo from '@/assets/blocks/dune.png';
import AixbtLogo from '@/assets/blocks/aixbt.png';
import TelegramLogo from '@/assets/blocks/Telegram.jpg';
import IpfsLogo from '@/assets/blocks/Ipfs.svg';
import PaymentLogo from '@/assets/blocks/payment.png';
import ArbitrumLogo from '@/assets/blocks/arbitrum.svg';
import NextjsLogo from '@/assets/blocks/Nextjs.png';
import GithubLogo from '@/assets/blocks/github.png';
import RobinhoodLogo from '@/assets/blocks/robinhood.png';
import OpenClawLogo from '@/assets/blocks/openclaw.jpg';
import EigenAILogo from '@/assets/blocks/EigenAI.svg';
import QuicknodeLogo from '@/assets/blocks/Quicknode.svg';

/**
 * Centralized logo asset mapping
 */
const LOGO_ASSETS: Record<string, any> = {
  'Aave.svg': AaveLogo,
  'Compound.svg': CompoundLogo,
  'Chainlink.svg': ChainlinkLogo,
  'Pyth.svg': PythLogo,
  'Uniswap.svg': UniswapLogo,
  'CS_logo.png': CSLogo,
  'auditware.png': AuditwareLogo,
  'stylus.svg': StylusLogo,
  'Ostium.svg': OstiumLogo,
  'MaxxitLogo.png': MaxxitLogo,
  'AIbot.png': AIbotLogo,
  'Wallet.svg': WalletLogoSvg,
  'Wallet.png': WalletLogoPng,
  'superposition.png': SuperpositionLogo,
  'dune.png': DuneLogo,
  'aixbt.png': AixbtLogo,
  'Telegram.jpg': TelegramLogo,
  'Ipfs.svg': IpfsLogo,
  'payment.png': PaymentLogo,
  'arbitrum.svg': ArbitrumLogo,
  'Nextjs.png': NextjsLogo,
  'github.png': GithubLogo,
  'robinhood.png': RobinhoodLogo,
  'openclaw.jpg': OpenClawLogo,
  'EigenAI.svg': EigenAILogo,
  'Quicknode.svg': QuicknodeLogo,
};

function getLogoAsset(logoAsset?: string): any | null {
  if (!logoAsset) return null;
  return LOGO_ASSETS[logoAsset] || null;
}

const ICON_MAP: Record<PluginIcon, LucideIcon> = {
  Box, CreditCard, Bot, Layout, ShieldCheck, Wallet, Globe, Database,
  HardDrive, Layers, Lock, Link, ArrowLeftRight, Key, Sparkles, TrendingUp,
  Zap, Coins, Search, GitBranch, ListTree, Mail, Timer, Variable, Shuffle, Repeat,
};

function getIconComponent(iconName: PluginIcon): LucideIcon {
  return ICON_MAP[iconName] || Box;
}

interface NodeCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  plugins: PluginRegistryEntry[];
}

function buildCategories(): NodeCategory[] {
  return CATEGORY_DEFINITIONS.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: getIconComponent(cat.icon),
    color: cat.color,
    plugins: getPluginsByCategory(cat.id),
  }));
}

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isConnected } = useAccount();
  const { isWalletConnected } = useAuthGuard();
  const { openAuthModal } = useAuthStore();

  const categories = useMemo(() => buildCategories(), []);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cradle-favorite-nodes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem('cradle-favorite-nodes', JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = useCallback((pluginId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    const walletConnected = isConnected || isWalletConnected;
    if (!walletConnected) {
      event.preventDefault();
      openAuthModal();
      return;
    }
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      plugins: category.plugins.filter(
        plugin =>
          plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    })).filter(category => category.plugins.length > 0);
  }, [categories, searchQuery]);

  const favoritePlugins = useMemo(() => {
    const allPlugins = categories.flatMap(c => c.plugins);
    return allPlugins.filter(p => favorites.has(p.id));
  }, [categories, favorites]);

  const hasSearchResults = filteredCategories.length > 0;

  return (
    <aside
      data-tour="palette"
      className="h-full border-r border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-subtle))] flex flex-col overflow-hidden select-none"
    >
      {/* Header Section */}
      <div className="p-4 bg-[hsl(var(--color-bg-subtle)/0.8)] backdrop-blur-md z-20 border-b border-[hsl(var(--color-border-default)/0.5)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(var(--color-accent-primary)/0.2)] to-[hsl(var(--color-accent-secondary)/0.2)] border border-[hsl(var(--color-accent-primary)/0.1)] shadow-glow-sm">
              <Layers className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[hsl(var(--color-text-primary))] uppercase tracking-[0.15em]">
                Registry
              </h2>
              <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Component Library</p>
            </div>
          </div>
          {favorites.size > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden">
              {[...favorites].slice(0, 3).map((id) => (
                <div key={id} className="inline-block h-5 w-5 rounded-full ring-2 ring-[hsl(var(--color-bg-subtle))] bg-[hsl(var(--color-bg-elevated))] flex items-center justify-center border border-[hsl(var(--color-border-subtle))]">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-current" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-[hsl(var(--color-accent-primary)/0.03)] rounded-xl blur-md group-focus-within:bg-[hsl(var(--color-accent-primary)/0.08)] transition-all" />
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-text-muted))] group-focus-within:text-[hsl(var(--color-accent-primary))] transition-colors" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-10 py-2.5 text-sm",
                "bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))]",
                "rounded-xl text-[hsl(var(--color-text-primary))]",
                "placeholder:text-[hsl(var(--color-text-muted)/0.7)]",
                "focus:outline-none focus:border-[hsl(var(--color-accent-primary)/0.5)]",
                "focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.05)]",
                "transition-all duration-200"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[hsl(var(--color-bg-hover))] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">

        {/* Pinned Blocks Section */}
        {!searchQuery && favoritePlugins.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span className="text-[11px] font-bold text-[hsl(var(--color-text-secondary))] tracking-wider uppercase">
                Pinned Blocks
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-[hsl(var(--color-border-subtle))] to-transparent ml-2" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {favoritePlugins.map((plugin, idx) => (
                <PluginCard
                  key={`fav-${plugin.id}`}
                  plugin={plugin}
                  index={idx}
                  isFavorite
                  onDragStart={onDragStart}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {searchQuery && !hasSearchResults && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="w-8 h-8 text-[hsl(var(--color-text-disabled))] mb-3 opacity-20" />
            <h3 className="text-sm font-medium text-[hsl(var(--color-text-primary))]">No blocks found</h3>
            <p className="text-xs text-[hsl(var(--color-text-muted))] mt-1">Try a different search term</p>
          </div>
        )}

        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div className="sticky top-0 bg-[hsl(var(--color-bg-subtle)/0.95)] backdrop-blur-sm z-10 py-1.5 flex items-center gap-2.5 px-1 -mx-1">
              <div className={cn("p-1 rounded-md shrink-0", `bg-${category.color}/10 border border-${category.color}/20`)}>
                <category.icon className={cn("w-3 h-3", `text-${category.color}`)} />
              </div>
              <span className="text-[9px] font-black text-[hsl(var(--color-text-secondary))] tracking-[0.1em] uppercase">
                {category.name}
              </span>
              <div className="flex-1 h-px bg-[hsl(var(--color-border-subtle))] opacity-30 ml-1" />
              <span className="text-[10px] tabular-nums font-mono text-[hsl(var(--color-text-muted))] opacity-60">
                {category.plugins.length}
              </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {category.plugins.map((plugin, pluginIdx) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  index={pluginIdx}
                  onDragStart={onDragStart}
                  toggleFavorite={toggleFavorite}
                  isFavorite={favorites.has(plugin.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Minimal Footer */}
      <div className="p-4 bg-gradient-to-t from-[hsl(var(--color-bg-base))] to-transparent border-t border-[hsl(var(--color-border-default)/0.3)]">
        <div className="flex items-center justify-center gap-3 py-2.5 px-3 rounded-xl bg-[hsl(var(--color-bg-elevated)/0.5)] border border-[hsl(var(--color-border-subtle)/0.5)] backdrop-blur-sm shadow-sm">
          <Zap className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))] fill-current animate-pulse" />
          <span className="text-[10px] font-medium text-[hsl(var(--color-text-secondary))] tracking-tight">
            Drag component to canvas
          </span>
        </div>
      </div>
    </aside>
  );
}

function PluginCard({
  plugin,
  index,
  onDragStart,
  toggleFavorite,
  isFavorite
}: {
  plugin: PluginRegistryEntry,
  index: number,
  onDragStart?: (e: React.DragEvent, id: string) => void,
  toggleFavorite?: (id: string, e: React.MouseEvent) => void,
  isFavorite: boolean
}) {
  const PluginIcon = getIconComponent(plugin.icon);
  const logoAsset = getLogoAsset(plugin.logoAsset);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.03,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <div
        draggable={!!onDragStart}
        onDragStart={onDragStart ? (e) => onDragStart(e, plugin.id) : undefined}
        className={cn(
          'group relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-300',
          'bg-[hsl(var(--color-bg-base)/0.3)] border-[hsl(var(--color-border-default)/0.4)]',
          'hover:bg-[hsl(var(--color-bg-elevated)/0.6)] hover:border-[hsl(var(--color-accent-primary)/0.2)]',
          'hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5),0_0_15px_-5px_hsl(var(--color-accent-primary)/0.15)]',
          'cursor-grab active:cursor-grabbing active:scale-95',
          'overflow-hidden'
        )}
      >
        {/* Favorite Button - Positioned in top-right */}
        {toggleFavorite && (
          <button
            onClick={(e) => toggleFavorite(plugin.id, e)}
            className={cn(
              'absolute top-2 right-2 p-1 rounded-md transition-all duration-200 z-10',
              isFavorite
                ? 'text-amber-400 bg-amber-400/10 opacity-100 scale-100'
                : 'text-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:scale-110'
            )}
          >
            <Star className={cn('w-3 h-3', isFavorite && 'fill-current')} />
          </button>
        )}

        {/* Icon Section - Focal point */}
        <div className="relative w-12 h-12 flex items-center justify-center mt-1">
          {/* Subtle glow behind icon */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
            `bg-${plugin.color}`
          )} />

          <div className={cn(
            "relative w-full h-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1",
            !logoAsset && `text-${plugin.color}`
          )}>
            {logoAsset ? (
              <div className="relative w-11 h-11 p-1">
                <Image
                  src={logoAsset}
                  alt={plugin.name}
                  fill
                  className={cn(
                    "object-contain drop-shadow-sm transition-all",
                    plugin.logoAsset === 'Telegram.jpg' && "rounded-full"
                  )}
                  unoptimized
                />
              </div>
            ) : (
              <div className="p-3 w-full h-full opacity-80 group-hover:opacity-100">
                <PluginIcon className="w-full h-full" />
              </div>
            )}
          </div>
        </div>

        {/* Text Section - Integrated */}
        <div className="mt-2 w-full text-center px-1">
          <h4 className="text-[10px] font-semibold text-[hsl(var(--color-text-secondary))] leading-tight truncate group-hover:text-[hsl(var(--color-text-primary))] transition-colors">
            {plugin.name}
          </h4>
        </div>
      </div>
    </motion.div>
  );
}