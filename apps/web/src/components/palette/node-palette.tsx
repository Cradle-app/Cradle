'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  CreditCard,
  Bot,
  Layout,
  ShieldCheck,
  ChevronRight,
  Search,
  Wallet,
  Globe,
  Database,
  HardDrive,
  Layers,
  Lock,
  ArrowLeftRight,
  Key,
  Sparkles,
  X,
  TrendingUp,
  Zap,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthGuard } from '@/components/auth/auth-guard';
import { useAuthStore } from '@/store/auth';

interface NodeTypeDefinition {
  id: string;
  name: string;
  description: string;
  icon: typeof Box;
  color: string;
}

interface NodeCategory {
  id: string;
  name: string;
  icon: typeof Box;
  color: string;
  nodes: NodeTypeDefinition[];
}

const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'contracts',
    name: 'Contracts',
    icon: Box,
    color: 'node-contracts',
    nodes: [
      {
        id: 'erc20-stylus',
        name: 'ERC-20 Token',
        description: 'Deploy ERC-20 token on Arbitrum Stylus',
        icon: Coins,
        color: 'node-contracts',
      },
      {
        id: 'erc721-stylus',
        name: 'ERC-721 NFT',
        description: 'Deploy NFT collection on Arbitrum Stylus',
        icon: Sparkles,
        color: 'node-contracts',
      },
      {
        id: 'erc1155-stylus',
        name: 'ERC-1155 Multi-Token',
        description: 'Deploy multi-token contract on Arbitrum Stylus',
        icon: Layers,
        color: 'node-contracts',
      },
      {
        id: 'stylus-contract',
        name: 'Stylus Contract',
        description: 'Rust/WASM smart contract for Arbitrum',
        icon: Box,
        color: 'node-contracts',
      },
      {
        id: 'stylus-zk-contract',
        name: 'Stylus ZK Contract',
        description: 'Privacy-preserving contract with ZK proofs',
        icon: Lock,
        color: 'node-contracts',
      },
      {
        id: 'eip7702-smart-eoa',
        name: 'EIP-7702 Smart EOA',
        description: 'Smart EOA delegation (trending)',
        icon: Key,
        color: 'node-contracts',
      },
      {
        id: 'zk-primitives',
        name: 'ZK Primitives',
        description: 'Privacy proofs: membership, range, semaphore',
        icon: Lock,
        color: 'node-contracts',
      },
      {
        id: 'stylus-rust-contract',
        name: 'Stylus Rust Contract',
        description: 'Build Rust smart contracts for Arbitrum',
        icon: Box,
        color: 'node-contracts',
      },
      {
        id: 'smartcache-caching',
        name: 'SmartCache Caching',
        description: 'Enable contract caching for cheaper gas',
        icon: Database,
        color: 'node-contracts',
      },
      {
        id: 'auditware-analyzing',
        name: 'Auditware Analyzer',
        description: 'Security analysis with Radar',
        icon: ShieldCheck,
        color: 'node-contracts',
      },
    ],
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: CreditCard,
    color: 'node-payments',
    nodes: [
      {
        id: 'x402-paywall-api',
        name: 'x402 Paywall',
        description: 'HTTP 402 payment endpoint',
        icon: CreditCard,
        color: 'node-payments',
      },
    ],
  },
  {
    id: 'agents',
    name: 'Agents',
    icon: Bot,
    color: 'node-agents',
    nodes: [
      {
        id: 'erc8004-agent-runtime',
        name: 'ERC-8004 Agent',
        description: 'AI agent with on-chain registry',
        icon: Bot,
        color: 'node-agents',
      },
      {
        id: 'ostium-trading',
        name: 'Ostium Trading',
        description: 'One-click trading setup for Ostium',
        icon: Zap,
        color: 'node-agents',
      },
      {
        id: 'maxxit',
        name: 'Maxxit Lazy Trader',
        description: 'Connect and message Maxxit Lazy Trader agents',
        icon: Bot,
        color: 'node-agents',
      },
      {
        id: 'onchain-activity',
        name: 'Onchain Activity',
        description: 'Fetch wallet transactions by category from Arbitrum',
        icon: TrendingUp,
        color: 'node-agents',
      },
    ],
  },
  {
    id: 'app',
    name: 'App',
    icon: Layout,
    color: 'node-app',
    nodes: [
      {
        id: 'wallet-auth',
        name: 'Wallet Auth',
        description: 'WalletConnect, social login, SIWE',
        icon: Wallet,
        color: 'node-app',
      },
      {
        id: 'rpc-provider',
        name: 'RPC Provider',
        description: 'Multi-provider RPC with failover',
        icon: Globe,
        color: 'node-app',
      },
      {
        id: 'arbitrum-bridge',
        name: 'Arbitrum Bridge',
        description: 'L1-L2 bridging with @arbitrum/sdk',
        icon: ArrowLeftRight,
        color: 'node-app',
      },
      {
        id: 'chain-data',
        name: 'Chain Data',
        description: 'Token/NFT data with Alchemy/Moralis',
        icon: Database,
        color: 'node-app',
      },
      {
        id: 'ipfs-storage',
        name: 'IPFS Storage',
        description: 'Decentralized storage (Pinata/Web3.Storage)',
        icon: HardDrive,
        color: 'node-app',
      },
      {
        id: 'chain-abstraction',
        name: 'Chain Abstraction',
        description: 'Unified multi-chain UX',
        icon: Layers,
        color: 'node-app',
      },
      {
        id: 'frontend-scaffold',
        name: 'Frontend',
        description: 'Next.js/React frontend scaffold',
        icon: Layout,
        color: 'node-app',
      },
      {
        id: 'sdk-generator',
        name: 'SDK Generator',
        description: 'TypeScript SDK from ABIs',
        icon: Layout,
        color: 'node-app',
      },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Bot,
    color: 'node-app', // Reusing node-app color or could define 'node-telegram'
    nodes: [
      {
        id: 'telegram-notifications',
        name: 'Notifications',
        description: 'Trigger alerts and updates to users',
        icon: Sparkles,
        color: 'node-app',
      },
      {
        id: 'telegram-commands',
        name: 'Commands',
        description: 'Handle interactive commands via webhooks',
        icon: Box,
        color: 'node-app',
      },
      {
        id: 'telegram-ai-agent',
        name: 'AI Agent',
        description: 'Conversational AI bot with LLM integration',
        icon: Sparkles,
        color: 'node-telegram',
      },
      {
        id: 'telegram-wallet-link',
        name: 'Wallet Link',
        description: 'Link Telegram profiles with Web3 wallets',
        icon: Lock,
        color: 'node-app',
      },
    ],
  },
  {
    id: 'quality',
    name: 'Quality',
    icon: ShieldCheck,
    color: 'node-quality',
    nodes: [
      {
        id: 'repo-quality-gates',
        name: 'Quality Gates',
        description: 'CI/CD, testing, linting',
        icon: ShieldCheck,
        color: 'node-quality',
      },
    ],
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    icon: Sparkles,
    color: 'node-intelligence',
    nodes: [
      {
        id: 'aixbt-momentum',
        name: 'Momentum',
        description: 'Track social heat and project trends',
        icon: TrendingUp,
        color: 'node-intelligence',
      },
      {
        id: 'aixbt-signals',
        name: 'Signals',
        description: 'Real-time project activity alerts',
        icon: Zap,
        color: 'node-intelligence',
      },
      {
        id: 'aixbt-indigo',
        name: 'Indigo',
        description: 'Conversational market research',
        icon: Sparkles,
        color: 'node-intelligence',
      },
      {
        id: 'aixbt-observer',
        name: 'Observer',
        description: 'Correlate on-chain activity',
        icon: Search,
        color: 'node-intelligence',
      },
    ],
  },
  {
    id: 'superposition',
    name: 'Superposition',
    icon: Layers,
    color: 'accent-cyan',
    nodes: [
      {
        id: 'superposition-network',
        name: 'Network Config',
        description: 'Chain config, RPC, and contract addresses',
        icon: Globe,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-bridge',
        name: 'Bridge',
        description: 'Bridge assets from Arbitrum via Li.Fi',
        icon: ArrowLeftRight,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-longtail',
        name: 'Longtail AMM',
        description: 'Swap and liquidity on Longtail DEX',
        icon: TrendingUp,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-super-assets',
        name: 'Super Assets',
        description: 'Yield-bearing wrapped tokens',
        icon: Sparkles,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-thirdweb',
        name: 'Thirdweb Deploy',
        description: 'Deploy contracts using Thirdweb SDK',
        icon: Box,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-utility-mining',
        name: 'Utility Mining',
        description: 'Track and claim activity rewards',
        icon: Zap,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-faucet',
        name: 'Testnet Faucet',
        description: 'Request testnet tokens for development',
        icon: Database,
        color: 'accent-cyan',
      },
      {
        id: 'superposition-meow-domains',
        name: 'Meow Domains',
        description: '.meow Web3 identity and resolution',
        icon: Key,
        color: 'accent-cyan',
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: Database,
    color: 'accent-purple',
    nodes: [
      {
        id: 'dune-execute-sql',
        name: 'Execute SQL',
        description: 'Custom SQL queries on Dune blockchain data',
        icon: Database,
        color: 'accent-purple',
      },
      {
        id: 'dune-token-price',
        name: 'Token Price',
        description: 'Fetch latest token prices across blockchains',
        icon: TrendingUp,
        color: 'accent-purple',
      },
      {
        id: 'dune-wallet-balances',
        name: 'Wallet Balances',
        description: 'Token balances with USD valuations',
        icon: Wallet,
        color: 'accent-purple',
      },
      {
        id: 'dune-dex-volume',
        name: 'DEX Volume',
        description: 'Trading volume and DEX statistics',
        icon: TrendingUp,
        color: 'accent-purple',
      },
      {
        id: 'dune-nft-floor',
        name: 'NFT Floor Price',
        description: 'Collection floor prices and stats',
        icon: Sparkles,
        color: 'accent-purple',
      },
      {
        id: 'dune-address-labels',
        name: 'Address Labels',
        description: 'Human-readable names for addresses',
        icon: Key,
        color: 'accent-purple',
      },
      {
        id: 'dune-transaction-history',
        name: 'Transaction History',
        description: 'Wallet transaction history',
        icon: Database,
        color: 'accent-purple',
      },
      {
        id: 'dune-gas-price',
        name: 'Gas Price',
        description: 'Gas price analytics and stats',
        icon: Zap,
        color: 'accent-purple',
      },
      {
        id: 'dune-protocol-tvl',
        name: 'Protocol TVL',
        description: 'Total Value Locked for DeFi protocols',
        icon: Lock,
        color: 'accent-purple',
      },
    ],
  },
];

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');
  // Start with all categories collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const { isConnected } = useAccount();
  const { isWalletConnected, isFullyAuthenticated } = useAuthGuard();
  const { showAuthModal, openAuthModal, closeAuthModal } = useAuthStore();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    // Require wallet connection before allowing drag
    // Use isConnected from wagmi for real-time status, fallback to store
    const walletConnected = isConnected || isWalletConnected;
    if (!walletConnected) {
      event.preventDefault();
      openAuthModal();
      return;
    }
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = NODE_CATEGORIES.map(category => ({
    ...category,
    nodes: category.nodes.filter(
      node =>
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.nodes.length > 0 || searchQuery === '');

  return (
    <>
      <aside className="h-full border-r border-forge-border/50 bg-gradient-to-b from-forge-surface/80 to-forge-bg/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-forge-border/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-accent-cyan/10">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-wide">Components</h2>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted group-focus-within:text-accent-cyan transition-colors" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-forge-bg/50 border border-forge-border/50 rounded-xl text-white placeholder:text-forge-muted focus:outline-none focus:border-accent-cyan/50 focus:bg-forge-bg transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.05 }}
              className="rounded-xl overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  'hover:bg-forge-elevated/50',
                  expandedCategories.has(category.id) && 'bg-forge-elevated/30'
                )}
              >
                <motion.div
                  animate={{ rotate: expandedCategories.has(category.id) ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-forge-muted" />
                </motion.div>
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                  expandedCategories.has(category.id)
                    ? `bg-${category.color}/20`
                    : 'bg-forge-elevated/50'
                )}>
                  <category.icon className={cn(
                    'w-4 h-4 transition-colors duration-200',
                    expandedCategories.has(category.id) ? `text-${category.color}` : 'text-forge-muted'
                  )} />
                </div>
                <span className="text-sm font-medium text-white flex-1 text-left">
                  {category.name}
                </span>
                <span className={cn(
                  'text-xs font-mono px-2 py-0.5 rounded-full transition-colors duration-200',
                  expandedCategories.has(category.id)
                    ? `bg-${category.color}/20 text-${category.color}`
                    : 'bg-forge-elevated/50 text-forge-muted'
                )}>
                  {category.nodes.length}
                </span>
              </button>

              {/* Nodes */}
              <AnimatePresence>
                {expandedCategories.has(category.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-6 pr-2 pb-2 pt-1 space-y-1.5">
                      {category.nodes.map((node, nodeIndex) => (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: nodeIndex * 0.03 }}
                        >
                          <div
                            draggable
                            onDragStart={(e) => onDragStart(e, node.id)}
                            className={cn(
                              'p-3 rounded-xl cursor-grab active:cursor-grabbing',
                              'bg-forge-bg/50 border border-transparent',
                              'hover:border-forge-border/50 hover:bg-forge-elevated/50',
                              'hover:shadow-lg hover:shadow-black/20',
                              'transition-all duration-200',
                              'group'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                  'bg-gradient-to-br transition-all duration-200',
                                  `from-${node.color}/20 to-${node.color}/5`,
                                  'group-hover:from-' + node.color + '/30 group-hover:to-' + node.color + '/10'
                                )}
                              >
                                <node.icon className={cn('w-4.5 h-4.5', `text-${node.color}`)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate group-hover:text-accent-cyan transition-colors">
                                  {node.name}
                                </p>
                                <p className="text-xs text-forge-muted truncate mt-0.5 leading-relaxed">
                                  {node.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t border-forge-border/50 bg-forge-bg/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-forge-muted mb-2">
              <div className="w-5 h-5 rounded bg-forge-elevated/50 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <span>Drag to build your foundation</span>
            </div>
            <p className="text-[10px] text-forge-muted/60">
              Structure first, then vibe ✨
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

