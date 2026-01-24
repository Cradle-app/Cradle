'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, DollarSign, Wallet, TrendingUp, Image, Tag, Clock, Fuel, Lock } from 'lucide-react';

interface Props {
  nodeId: string;
  type:
  | 'dune-execute-sql'
  | 'dune-token-price'
  | 'dune-wallet-balances'
  | 'dune-dex-volume'
  | 'dune-nft-floor'
  | 'dune-address-labels'
  | 'dune-transaction-history'
  | 'dune-gas-price'
  | 'dune-protocol-tvl';
  config: Record<string, unknown>;
}

const nodeInfo = {
  'dune-execute-sql': {
    title: 'Execute SQL',
    description: 'Execute custom SQL queries on Dune\'s blockchain data warehouse',
    icon: Database,
    color: 'text-purple-400',
  },
  'dune-token-price': {
    title: 'Token Price',
    description: 'Fetch latest token prices across multiple blockchains',
    icon: DollarSign,
    color: 'text-green-400',
  },
  'dune-wallet-balances': {
    title: 'Wallet Balances',
    description: 'Fetch wallet token balances with USD values',
    icon: Wallet,
    color: 'text-blue-400',
  },
  'dune-dex-volume': {
    title: 'DEX Volume',
    description: 'Fetch DEX trading volume and statistics',
    icon: TrendingUp,
    color: 'text-cyan-400',
  },
  'dune-nft-floor': {
    title: 'NFT Floor Price',
    description: 'Fetch NFT collection floor prices and statistics',
    icon: Image,
    color: 'text-pink-400',
  },
  'dune-address-labels': {
    title: 'Address Labels',
    description: 'Fetch human-readable labels for blockchain addresses',
    icon: Tag,
    color: 'text-yellow-400',
  },
  'dune-transaction-history': {
    title: 'Transaction History',
    description: 'Fetch transaction history for wallets',
    icon: Clock,
    color: 'text-orange-400',
  },
  'dune-gas-price': {
    title: 'Gas Price Analytics',
    description: 'Fetch gas price analytics and statistics',
    icon: Fuel,
    color: 'text-red-400',
  },
  'dune-protocol-tvl': {
    title: 'Protocol TVL',
    description: 'Fetch Total Value Locked for DeFi protocols',
    icon: Lock,
    color: 'text-indigo-400',
  },
};

export function DuneAnalyticsForm({ nodeId, type, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const info = nodeInfo[type];
  const Icon = info.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className={`p-2 rounded-lg bg-zinc-800 ${info.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{info.title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">{info.description}</p>
        </div>
      </div>

      {/* Execute SQL specific config */}
      {type === 'dune-execute-sql' && (
        <>
          <div>
            <label className="text-xs text-forge-muted mb-1.5 block">Performance Mode</label>
            <Select
              value={(config.performanceMode as string) ?? 'medium'}
              onValueChange={(v) => updateConfig('performanceMode', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="medium">Medium (Faster)</SelectItem>
                <SelectItem value="large">Large (More Resources)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-forge-muted mb-1.5 block">Timeout (ms)</label>
            <Input
              type="number"
              value={(config.timeout as number) ?? 60000}
              onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
              min={10000}
              max={300000}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Generate React Hooks</span>
            <Switch
              checked={(config.generateHooks as boolean) ?? true}
              onCheckedChange={(v) => updateConfig('generateHooks', v)}
            />
          </div>
        </>
      )}

      {/* Blockchain selector (common to many) */}
      {['dune-token-price', 'dune-wallet-balances', 'dune-dex-volume', 'dune-nft-floor', 'dune-transaction-history', 'dune-gas-price', 'dune-protocol-tvl'].includes(type) && (
        <div>
          <label className="text-xs text-forge-muted mb-1.5 block">Blockchain</label>
          <Select
            value={(config.blockchain as string) ?? 'arbitrum'}
            onValueChange={(v) => updateConfig('blockchain', v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="arbitrum">Arbitrum</SelectItem>
              <SelectItem value="optimism">Optimism</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="base">Base</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Token Price specific */}
      {type === 'dune-token-price' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Enable Cache</span>
            <Switch
              checked={(config.cacheEnabled as boolean) ?? true}
              onCheckedChange={(v) => updateConfig('cacheEnabled', v)}
            />
          </div>
          <div>
            <label className="text-xs text-forge-muted mb-1.5 block">Cache Duration (ms)</label>
            <Input
              type="number"
              value={(config.cacheDuration as number) ?? 60000}
              onChange={(e) => updateConfig('cacheDuration', parseInt(e.target.value))}
            />
          </div>
        </>
      )}

      {/* Wallet Balances specific */}
      {type === 'dune-wallet-balances' && (
        <>
          <div>
            <label className="text-xs text-forge-muted mb-1.5 block">Minimum Balance (USD)</label>
            <Input
              type="number"
              value={(config.minBalanceUsd as number) ?? 1}
              onChange={(e) => updateConfig('minBalanceUsd', parseFloat(e.target.value))}
              min={0}
              step={0.01}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Include NFTs</span>
            <Switch
              checked={(config.includeNFTs as boolean) ?? false}
              onCheckedChange={(v) => updateConfig('includeNFTs', v)}
            />
          </div>
        </>
      )}

      {/* DEX Volume specific */}
      {type === 'dune-dex-volume' && (
        <>
          <div>
            <label className="text-xs text-forge-muted mb-1.5 block">Time Range</label>
            <Select
              value={(config.timeRange as string) ?? '24h'}
              onValueChange={(v) => updateConfig('timeRange', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-forge-muted mb-1.5 block">Protocol Filter (optional)</label>
            <Input
              placeholder="e.g., uniswap-v3"
              value={(config.protocol as string) ?? ''}
              onChange={(e) => updateConfig('protocol', e.target.value || undefined)}
            />
          </div>
        </>
      )}

      {/* Address Labels specific */}
      {type === 'dune-address-labels' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Include ENS Names</span>
            <Switch
              checked={(config.includeENS as boolean) ?? true}
              onCheckedChange={(v) => updateConfig('includeENS', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Include Owner Info</span>
            <Switch
              checked={(config.includeOwnerInfo as boolean) ?? true}
              onCheckedChange={(v) => updateConfig('includeOwnerInfo', v)}
            />
          </div>
        </>
      )}

      {/* Transaction History specific */}
      {type === 'dune-transaction-history' && (
        <div>
          <label className="text-xs text-forge-muted mb-1.5 block">Transaction Limit</label>
          <Input
            type="number"
            value={(config.limit as number) ?? 100}
            onChange={(e) => updateConfig('limit', parseInt(e.target.value))}
            min={1}
            max={10000}
          />
        </div>
      )}

      {/* Generate UI toggle (common to many) */}
      {['dune-token-price', 'dune-wallet-balances', 'dune-dex-volume', 'dune-nft-floor', 'dune-transaction-history', 'dune-gas-price', 'dune-protocol-tvl'].includes(type) && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Generate UI Components</span>
          <Switch
            checked={(config.generateUI as boolean) ?? true}
            onCheckedChange={(v) => updateConfig('generateUI', v)}
          />
        </div>
      )}

      {/* NFT Floor, Gas, TVL cache duration */}
      {['dune-nft-floor', 'dune-gas-price', 'dune-protocol-tvl'].includes(type) && (
        <div>
          <label className="text-xs text-forge-muted mb-1.5 block">Cache Duration (ms)</label>
          <Input
            type="number"
            value={(config.cacheDuration as number) ?? (type === 'dune-nft-floor' ? 300000 : type === 'dune-gas-price' ? 60000 : 600000)}
            onChange={(e) => updateConfig('cacheDuration', parseInt(e.target.value))}
          />
        </div>
      )}

      {/* API Key Notice */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-400">
          <strong>Note:</strong> You must set the <code className="bg-amber-500/20 px-1 rounded">DUNE_API_KEY</code> environment variable to use Dune Analytics features.
        </p>
      </div>
    </div>
  );
}
