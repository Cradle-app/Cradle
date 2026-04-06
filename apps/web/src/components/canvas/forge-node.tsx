'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import {
  Box, CreditCard, Bot, Layout, ShieldCheck, Trash2,
  Lock, Key, Wallet, Globe, ArrowLeftRight, Database,
  HardDrive, Layers, TrendingUp, Zap, Sparkles, Search,
  DollarSign, Fuel, Send, Link, Coins, Plus, X as XIcon,
  GitBranch, ListTree, Mail, Timer, Variable, Shuffle, Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';
import { nodeTypeToLabel, nodeTypeToColor } from '@/lib/utils';

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

/** Node types with custom logos (matches palette) */
const NODE_LOGO_MAP: Record<string, { src: typeof AaveLogo; alt: string }> = {
  // Protocol plugins
  'aave-lending': { src: AaveLogo, alt: 'Aave' },
  'compound-lending': { src: CompoundLogo, alt: 'Compound' },
  'chainlink-price-feed': { src: ChainlinkLogo, alt: 'Chainlink' },
  'pyth-oracle': { src: PythLogo, alt: 'Pyth' },
  'uniswap-swap': { src: UniswapLogo, alt: 'Uniswap' },
  // Contract plugins
  'smartcache-caching': { src: CSLogo, alt: 'SmartCache' },
  'auditware-analyzing': { src: AuditwareLogo, alt: 'Auditware' },
  'erc20-stylus': { src: StylusLogo, alt: 'Stylus' },
  'erc721-stylus': { src: StylusLogo, alt: 'Stylus' },
  'erc1155-stylus': { src: StylusLogo, alt: 'Stylus' },
  'stylus-contract': { src: StylusLogo, alt: 'Stylus' },
  'stylus-zk-contract': { src: StylusLogo, alt: 'Stylus' },
  'stylus-rust-contract': { src: StylusLogo, alt: 'Stylus' },
  'eip7702-smart-eoa': { src: WalletLogoPng, alt: 'Wallet' },
  'zk-primitives': { src: StylusLogo, alt: 'ZK Primitives' },
  // Agent plugins
  'ostium-trading': { src: OstiumLogo, alt: 'Ostium' },
  'maxxit': { src: MaxxitLogo, alt: 'Maxxit' },
  'erc8004-agent-runtime': { src: AIbotLogo, alt: 'AIbot' },
  'onchain-activity': { src: WalletLogoPng, alt: 'Wallet' },
  'eigen-ai-agent': { src: EigenAILogo, alt: 'EigenAI' },
  // Intelligence plugins
  'aixbt-momentum': { src: AixbtLogo, alt: 'AIXBT' },
  'aixbt-signals': { src: AixbtLogo, alt: 'AIXBT' },
  'aixbt-indigo': { src: AixbtLogo, alt: 'AIXBT' },
  'aixbt-observer': { src: AixbtLogo, alt: 'AIXBT' },
  // Telegram plugins
  'telegram-notifications': { src: TelegramLogo, alt: 'Telegram' },
  'telegram-commands': { src: TelegramLogo, alt: 'Telegram' },
  'telegram-ai-agent': { src: TelegramLogo, alt: 'Telegram' },
  'telegram-wallet-link': { src: TelegramLogo, alt: 'Telegram' },
  // Application plugins
  'wallet-auth': { src: WalletLogoPng, alt: 'Wallet' },
  'ipfs-storage': { src: IpfsLogo, alt: 'IPFS' },
  'frontend-scaffold': { src: NextjsLogo, alt: 'Next.js' },
  'rpc-provider': { src: ArbitrumLogo, alt: 'Arbitrum' },
  'quicknode': { src: QuicknodeLogo, alt: 'Quicknode' },
  'arbitrum-bridge': { src: ArbitrumLogo, alt: 'Arbitrum' },
  'chain-data': { src: ArbitrumLogo, alt: 'Arbitrum' },
  'chain-abstraction': { src: ArbitrumLogo, alt: 'Arbitrum' },
  'sdk-generator': { src: ArbitrumLogo, alt: 'Arbitrum' },
  'repo-quality-gates': { src: GithubLogo, alt: 'GitHub' },
  // Payment plugins
  'x402-paywall-api': { src: PaymentLogo, alt: 'Payment' },
  // Superposition plugins
  'superposition-network': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-bridge': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-longtail': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-super-assets': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-thirdweb': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-utility-mining': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-faucet': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-meow-domains': { src: SuperpositionLogo, alt: 'Superposition' },
  // Robinhood Chain plugins
  'robinhood-network': { src: RobinhoodLogo, alt: 'Robinhood Chain' },
  'robinhood-deployment': { src: RobinhoodLogo, alt: 'Robinhood Chain' },
  'robinhood-contracts': { src: RobinhoodLogo, alt: 'Robinhood Chain' },
  // OpenClaw Agent
  'openclaw-agent': { src: OpenClawLogo, alt: 'OpenClaw' },
  // Dune Analytics plugins
  'dune-execute-sql': { src: DuneLogo, alt: 'Dune' },
  'dune-token-price': { src: DuneLogo, alt: 'Dune' },
  'dune-wallet-balances': { src: DuneLogo, alt: 'Dune' },
  'dune-dex-volume': { src: DuneLogo, alt: 'Dune' },
  'dune-nft-floor': { src: DuneLogo, alt: 'Dune' },
  'dune-address-labels': { src: DuneLogo, alt: 'Dune' },
  'dune-transaction-history': { src: DuneLogo, alt: 'Dune' },
  'dune-gas-price': { src: DuneLogo, alt: 'Dune' },
  'dune-protocol-tvl': { src: DuneLogo, alt: 'Dune' },
};

const iconMap: Record<string, typeof Box> = {
  'stylus-contract': Box,
  'stylus-zk-contract': Lock,
  'stylus-rust-contract': Box,
  'smartcache-caching': Database,
  'auditware-analyzing': ShieldCheck,
  'x402-paywall-api': CreditCard,
  'erc8004-agent-runtime': Bot,
  'repo-quality-gates': ShieldCheck,
  'frontend-scaffold': Layout,
  'sdk-generator': Layout,
  'eip7702-smart-eoa': Key,
  'wallet-auth': Wallet,
  'rpc-provider': Globe,
  'quicknode': Globe,
  'arbitrum-bridge': ArrowLeftRight,
  'chain-data': Database,
  'onchain-activity': Database,
  'ipfs-storage': HardDrive,
  'chain-abstraction': Layers,
  'zk-primitives': Lock,
  'ostium-trading': TrendingUp,
  'maxxit': Bot,
  'uniswap-swap': Coins,
  'aave-lending': DollarSign,
  'compound-lending': DollarSign,
  'eigen-ai-agent': Bot,
  'aixbt-momentum': TrendingUp,
  'aixbt-signals': Zap,
  'aixbt-indigo': Sparkles,
  'aixbt-observer': Search,
  // Telegram
  'telegram-notifications': Send,
  'telegram-commands': Send,
  'telegram-wallet-link': Send,
  'telegram-ai-agent': Send,
  // Dune Analytics
  'dune-execute-sql': Database,
  'dune-token-price': DollarSign,
  'dune-wallet-balances': Wallet,
  'dune-dex-volume': TrendingUp,
  'dune-nft-floor': Sparkles,
  'dune-address-labels': Key,
  'dune-transaction-history': Database,
  'dune-gas-price': Fuel,
  'dune-protocol-tvl': Lock,
  // Logic & Automation (Web2)
  'if-else': GitBranch,
  'switch-case': ListTree,
  'http-api': Globe,
  'email-smtp': Mail,
  'delay-timer': Timer,
  'variable-store': Variable,
  'transform': Shuffle,
  'loop-iterator': Repeat,
  'web2-frontend-scaffold': Layout,
};

/**
 * Node color mapping - Modern, refined palette
 * Each category has consistent, muted colors with enhanced selection states
 */
type NodeColorScheme = {
  bgGradient: string;
  iconBg: string;
  border: string;
  borderHover: string;
  borderSelected: string;
  text: string;
  glow: string;
  accentBar?: string;
  handleActive: string;
  handleDefault?: string;
};

const colorMap: Record<string, NodeColorScheme> = {
  'node-contracts': {
    bgGradient: 'from-[hsl(200_55%_50%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(200_55%_50%/0.12)]',
    border: 'border-[hsl(200_55%_50%/0.18)]',
    borderHover: 'hover:border-[hsl(200_55%_50%/0.35)]',
    borderSelected: 'border-[hsl(200_55%_50%/0.55)]',
    text: 'text-[hsl(200_55%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(200_55%_50%/0.3),_0_0_6px_-1px_hsl(200_55%_50%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(200_55%_50%/0.6)] via-[hsl(200_55%_50%/0.3)] to-transparent',
    handleActive: '!border-[hsl(200_55%_50%/0.6)]',
  },
  'node-payments': {
    bgGradient: 'from-[hsl(38_60%_50%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(38_60%_50%/0.12)]',
    border: 'border-[hsl(38_60%_50%/0.18)]',
    borderHover: 'hover:border-[hsl(38_60%_50%/0.35)]',
    borderSelected: 'border-[hsl(38_60%_50%/0.55)]',
    text: 'text-[hsl(38_60%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(38_60%_50%/0.3),_0_0_6px_-1px_hsl(38_60%_50%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(38_60%_50%/0.6)] via-[hsl(38_60%_50%/0.3)] to-transparent',
    handleActive: '!border-[hsl(38_60%_50%/0.6)]',
  },
  'node-agents': {
    bgGradient: 'from-[hsl(285_45%_52%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(285_45%_52%/0.12)]',
    border: 'border-[hsl(285_45%_52%/0.18)]',
    borderHover: 'hover:border-[hsl(285_45%_52%/0.35)]',
    borderSelected: 'border-[hsl(285_45%_52%/0.55)]',
    text: 'text-[hsl(285_45%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(285_45%_52%/0.3),_0_0_6px_-1px_hsl(285_45%_52%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(285_45%_52%/0.6)] via-[hsl(285_45%_52%/0.3)] to-transparent',
    handleActive: '!border-[hsl(285_45%_52%/0.6)]',
  },
  'node-app': {
    bgGradient: 'from-[hsl(152_45%_45%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(152_45%_45%/0.12)]',
    border: 'border-[hsl(152_45%_45%/0.18)]',
    borderHover: 'hover:border-[hsl(152_45%_45%/0.35)]',
    borderSelected: 'border-[hsl(152_45%_45%/0.55)]',
    text: 'text-[hsl(152_45%_50%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(152_45%_45%/0.3),_0_0_6px_-1px_hsl(152_45%_45%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(152_45%_45%/0.6)] via-[hsl(152_45%_45%/0.3)] to-transparent',
    handleActive: '!border-[hsl(152_45%_45%/0.6)]',
  },
  'node-quality': {
    bgGradient: 'from-[hsl(0_50%_52%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(0_50%_52%/0.12)]',
    border: 'border-[hsl(0_50%_52%/0.18)]',
    borderHover: 'hover:border-[hsl(0_50%_52%/0.35)]',
    borderSelected: 'border-[hsl(0_50%_52%/0.55)]',
    text: 'text-[hsl(0_50%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(0_50%_52%/0.3),_0_0_6px_-1px_hsl(0_50%_52%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(0_50%_52%/0.6)] via-[hsl(0_50%_52%/0.3)] to-transparent',
    handleActive: '!border-[hsl(0_50%_52%/0.6)]',
  },
  'node-intelligence': {
    bgGradient: 'from-[hsl(255_45%_55%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(255_45%_55%/0.12)]',
    border: 'border-[hsl(255_45%_55%/0.18)]',
    borderHover: 'hover:border-[hsl(255_45%_55%/0.35)]',
    borderSelected: 'border-[hsl(255_45%_55%/0.55)]',
    text: 'text-[hsl(255_45%_58%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(255_45%_55%/0.3),_0_0_6px_-1px_hsl(255_45%_55%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(255_45%_55%/0.6)] via-[hsl(255_45%_55%/0.3)] to-transparent',
    handleActive: '!border-[hsl(255_45%_55%/0.6)]',
  },
  'node-telegram': {
    bgGradient: 'from-[hsl(200_70%_45%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(200_70%_45%/0.12)]',
    border: 'border-[hsl(200_70%_45%/0.18)]',
    borderHover: 'hover:border-[hsl(200_70%_45%/0.35)]',
    borderSelected: 'border-[hsl(200_70%_45%/0.55)]',
    text: 'text-[hsl(200_70%_48%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(200_70%_45%/0.3),_0_0_6px_-1px_hsl(200_70%_45%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(200_70%_45%/0.6)] via-[hsl(200_70%_45%/0.3)] to-transparent',
    handleActive: '!border-[hsl(200_70%_45%/0.6)]',
  },
  // Logic & Automation (Web2)
  'accent-amber': {
    bgGradient: 'from-[hsl(38_92%_50%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(38_92%_50%/0.12)]',
    border: 'border-[hsl(38_92%_50%/0.18)]',
    borderHover: 'hover:border-[hsl(38_92%_50%/0.35)]',
    borderSelected: '!border-[hsl(38_92%_50%/0.5)]',
    text: 'text-[hsl(38_92%_50%)]',
    glow: 'shadow-[0_0_15px_hsl(38_92%_50%/0.15)]',
    handleDefault: 'border-[hsl(38_92%_50%/0.3)]',
    handleActive: '!border-[hsl(38_92%_50%/0.6)]',
  },
  // Fallback for legacy types
  'accent-purple': {
    bgGradient: 'from-[hsl(255_45%_55%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(255_45%_55%/0.12)]',
    border: 'border-[hsl(255_45%_55%/0.18)]',
    borderHover: 'hover:border-[hsl(255_45%_55%/0.35)]',
    borderSelected: 'border-[hsl(255_45%_55%/0.55)]',
    text: 'text-[hsl(255_45%_58%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(255_45%_55%/0.3),_0_0_6px_-1px_hsl(255_45%_55%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(255_45%_55%/0.6)] via-[hsl(255_45%_55%/0.3)] to-transparent',
    handleActive: '!border-[hsl(255_45%_55%/0.6)]',
  },
  'accent-cyan': {
    bgGradient: 'from-[hsl(18_76%_55%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(18_76%_55%/0.12)]',
    border: 'border-[hsl(18_76%_55%/0.18)]',
    borderHover: 'hover:border-[hsl(18_76%_55%/0.35)]',
    borderSelected: 'border-[hsl(18_76%_55%/0.55)]',
    text: 'text-[hsl(18_76%_58%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(18_76%_55%/0.3),_0_0_6px_-1px_hsl(18_76%_55%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(18_76%_55%/0.6)] via-[hsl(18_76%_55%/0.3)] to-transparent',
    handleActive: '!border-[hsl(18_76%_55%/0.6)]',
  },
};

function ForgeNodeComponent({ id, data, selected }: NodeProps) {
  const { selectedNodeId, removeNode, activateGhostNode, dismissGhostNode } = useBlueprintStore();
  const nodeType = data.nodeType as string;
  const colorClass = nodeTypeToColor(nodeType);
  const colors = colorMap[colorClass] || colorMap['node-contracts'];
  const Icon = iconMap[nodeType] || Box;
  const isGhost = data.isGhost === true;
  const logoInfo = NODE_LOGO_MAP[nodeType];
  const isSelected = !isGhost && (selected || selectedNodeId === id);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleActivate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      activateGhostNode(id);
    },
    [id, activateGhostNode],
  );

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dismissGhostNode(id);
    },
    [id, dismissGhostNode],
  );

  // ── Ghost node rendering ────────────────────────────────────────────
  if (isGhost) {
    return (
      <div className="relative">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !-left-[6px] !border-2 !rounded-full !bg-transparent !border-[hsl(var(--color-border-default)/0.3)]"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={handleActivate}
          className={cn(
            'group relative w-[200px] rounded-xl border-[1.5px] border-dashed cursor-pointer',
            'bg-[hsl(var(--color-bg-muted)/0.4)]',
            'transition-all duration-200 ease-out',
            colors.border,
            'hover:border-[hsl(var(--color-accent-primary)/0.5)]',
            'hover:bg-[hsl(var(--color-bg-muted)/0.6)]',
            'animate-[ghostPulse_3s_ease-in-out_infinite]',
          )}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[ghostShimmer_2.5s_ease-in-out_infinite]" />
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'absolute -top-2 -right-2 z-10 p-1 rounded-full',
              'bg-[hsl(var(--color-bg-elevated))] border border-[hsl(var(--color-border-default)/0.5)]',
              'text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-error))]',
              'opacity-0 group-hover:opacity-100 transition-all duration-150',
              'hover:bg-[hsl(var(--color-error)/0.1)]',
            )}
          >
            <XIcon className="w-3 h-3" />
          </button>

          {/* Node content */}
          <div className="relative p-3 opacity-50 group-hover:opacity-80 transition-opacity duration-200">
            <div className="flex items-start gap-2.5">
              {/* Icon / Logo */}
              <div
                className={cn(
                  'relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
                  colors.iconBg,
                  'border border-dashed border-[hsl(var(--color-border-subtle))]',
                )}
              >
                {logoInfo ? (
                  <Image
                    src={logoInfo.src}
                    alt={logoInfo.alt}
                    fill
                    className="object-contain p-0.5"
                    unoptimized
                  />
                ) : (
                  <Icon className={cn('w-4.5 h-4.5', colors.text)} />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] font-semibold truncate leading-tight text-[hsl(var(--color-text-primary))]">
                  {nodeTypeToLabel(nodeType)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={cn('text-[10px] font-medium', 'text-[hsl(var(--color-accent-primary))]')}>
                    Click to add
                  </p>
                  {data.suggestionReason && (
                    <span className={cn(
                      'text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider',
                      'bg-[hsl(var(--color-accent-primary)/0.15)] text-[hsl(var(--color-accent-primary))] border border-[hsl(var(--color-accent-primary)/0.2)]'
                    )}>
                      {data.suggestionReason as string}
                    </span>
                  )}
                </div>
              </div>

              {/* Plus icon */}
              <div
                className={cn(
                  'p-1.5 rounded-md',
                  'bg-[hsl(var(--color-accent-primary)/0.1)]',
                  'text-[hsl(var(--color-accent-primary))]',
                  'group-hover:bg-[hsl(var(--color-accent-primary)/0.2)]',
                  'transition-colors duration-150',
                )}
              >
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !-right-[6px] !border-2 !rounded-full !bg-transparent !border-[hsl(var(--color-border-default)/0.3)]"
        />
      </div>
    );
  }

  // ── Regular node rendering ──────────────────────────────────────────

  // Check if there's extra context to show
  const hasExtraInfo = (
    (nodeType === 'stylus-contract' && (data.contractName || data.contractInstructions)) ||
    (nodeType === 'x402-paywall-api' && data.currency) ||
    (nodeType === 'erc8004-agent-runtime' && data.modelProvider) ||
    nodeType === 'ostium-trading' ||
    nodeType === 'maxxit'
  );

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isSelected ? 1.02 : 1,
        y: isSelected ? -2 : 0,
      }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative w-[200px] rounded-xl border-[1.5px]',
        'bg-[hsl(var(--color-bg-muted))]',
        'transition-all duration-200 ease-out',
        isSelected ? colors.borderSelected : colors.border,
        isSelected && colors.glow,
        !isSelected && colors.borderHover,
        !isSelected && 'hover:shadow-md'
      )}
    >
      {/* Gradient overlay - stronger when selected */}
      <div className={cn(
        'absolute inset-0 rounded-xl bg-gradient-to-br transition-opacity duration-200',
        colors.bgGradient,
        isSelected ? 'opacity-100' : 'opacity-60'
      )} />

      {/* Top accent bar - animated on selection */}
      <motion.div
        initial={false}
        animate={{
          scaleX: isSelected ? 1 : 0.6,
          opacity: isSelected ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute top-0 left-4 right-4 h-[2px] rounded-full origin-left',
          colors.accentBar
        )}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-3.5 !h-3.5 !-left-[7px] !border-2 !rounded-full',
          '!bg-[hsl(var(--color-bg-elevated))]',
          '!border-[hsl(var(--color-border-default))]',
          'hover:!border-[hsl(var(--color-border-strong))]',
          'hover:!scale-110',
          'transition-all duration-150',
          isSelected && colors.handleActive
        )}
      />

      {/* Node content */}
      <div className="relative p-2.5">
        <div className="flex items-center gap-2">
          {/* Icon / Logo container */}
          <div
            className={cn(
              'relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
              'bg-forge-bg/70 border border-white/5',
              'group-hover:border-white/10 transition-colors duration-200'
            )}
          >
            {logoInfo ? (
              <Image
                src={logoInfo.src}
                alt={logoInfo.alt}
                fill
                className="object-contain p-0.5"
                unoptimized
              />
            ) : (
              <Icon className={cn('w-4 h-4', colors.text)} />
            )}
          </div>

          {/* Label section */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className={cn(
              'text-[13px] font-semibold truncate leading-tight',
              'text-[hsl(var(--color-text-primary))]',
              'transition-colors duration-200'
            )}>
              {data.label || data.contractName || data.agentName || nodeTypeToLabel(nodeType)}
            </p>
            <p className={cn(
              'text-[10px] truncate mt-1 font-medium tracking-wide',
              colors.text,
              isSelected ? 'opacity-90' : 'opacity-65'
            )}>
              {nodeTypeToLabel(nodeType)}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              'text-[hsl(var(--color-text-muted))]',
              'hover:bg-[hsl(var(--color-error)/0.12)] hover:text-[hsl(var(--color-error))]',
              'opacity-0 group-hover:opacity-100 -mt-0.5',
              isSelected && 'opacity-80'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tags - only show if there's relevant data */}
        {hasExtraInfo && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {nodeType === 'stylus-contract' && (data.contractName || data.contractInstructions) && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono tracking-wide truncate max-w-[120px]',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )} title={data.contractInstructions as string}>
                {String(data.contractName || 'Stylus')}
              </span>
            )}

            {nodeType === 'x402-paywall-api' && data.currency && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )}>
                {data.currency}
              </span>
            )}

            {nodeType === 'erc8004-agent-runtime' && data.modelProvider && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono tracking-wide',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )}>
                {data.modelProvider}
              </span>
            )}

            {nodeType === 'ostium-trading' && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )}>
                {data.network || 'arbitrum'}
              </span>
            )}

            {nodeType === 'maxxit' && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                data.setupComplete || data.linkedStatus === 'LINKED'
                  ? 'text-[hsl(var(--color-success))]'
                  : colors.text
              )}>
                {data.setupComplete || data.linkedStatus === 'LINKED'
                  ? 'LINKED'
                  : data.linkedStatus || 'NOT LINKED'}
              </span>
            )}
          </div>
        )}

        {/* Node ID badge */}
        <div className="mt-2 flex items-center justify-between">
          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-md font-mono',
            'text-[hsl(var(--color-text-disabled))]',
            'bg-[hsl(var(--color-bg-base)/0.4)]'
          )}>
            {id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          '!w-3.5 !h-3.5 !-right-[7px] !border-2 !rounded-full',
          '!bg-[hsl(var(--color-bg-elevated))]',
          '!border-[hsl(var(--color-border-default))]',
          'hover:!border-[hsl(var(--color-border-strong))]',
          'hover:!scale-110',
          'transition-all duration-150',
          isSelected && colors.handleActive
        )}
      />

      {/* Selection ring - subtle outer glow indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute -inset-1 rounded-[16px] pointer-events-none',
            'border border-[hsl(var(--color-border-focus)/0.3)]'
          )}
        />
      )}
    </motion.div>
  );
}

export const ForgeNode = memo(ForgeNodeComponent);
