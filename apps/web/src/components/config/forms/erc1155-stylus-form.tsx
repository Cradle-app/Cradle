'use client';

import { useEffect } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Layers, Info, CheckCircle2, Code, Terminal, Zap, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const FEATURES = [
  { value: 'ownable', label: 'Ownable', description: 'Owner can manage contract', required: true },
  { value: 'mintable', label: 'Mintable', description: 'Owner can mint new tokens (single or batch)', required: false },
  { value: 'burnable', label: 'Burnable', description: 'Holders can burn their tokens', required: false },
  { value: 'pausable', label: 'Pausable', description: 'Owner can pause/unpause transfers', required: false },
  { value: 'supply-tracking', label: 'Supply Tracking', description: 'Track total supply per token ID', required: true },
  { value: 'batch-operations', label: 'Batch Operations', description: 'Efficient batch transfers and minting', required: true },
];

const DEPLOYMENT_REQUIREMENTS = {
  prerequisites: [
    'Rust & Cargo installed',
    'cargo-stylus CLI tool',
    'WASM target: wasm32-unknown-unknown',
    'Funded wallet for gas fees',
  ],
  buildSteps: [
    'cd contract',
    'cargo stylus check',
    'cargo build --release --target wasm32-unknown-unknown',
  ],
  deploymentCommands: {
    testnet: 'cargo stylus deploy --private-key <KEY> --endpoint https://sepolia-rollup.arbitrum.io/rpc',
    mainnet: 'cargo stylus deploy --private-key <KEY> --endpoint https://arb1.arbitrum.io/rpc',
  },
  estimatedGas: '~0.01-0.05 ETH (varies by network)',
};

const USE_CASES = [
  { icon: '🎮', name: 'Gaming Assets', description: 'Multiple item types in one contract' },
  { icon: '🎫', name: 'Event Tickets', description: 'Different ticket tiers' },
  { icon: '🃏', name: 'Collectibles', description: 'Trading cards with varying rarity' },
  { icon: '🏦', name: 'DeFi Positions', description: 'LP tokens for multiple pools' },
];

// All features enabled by default
const DEFAULT_FEATURES = FEATURES.map(f => f.value);

export function ERC1155StylusForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  // Initialize features with all enabled by default
  useEffect(() => {
    if (!config.features || (config.features as string[]).length === 0) {
      updateNodeConfig(nodeId, { features: DEFAULT_FEATURES });
    }
  }, []);

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const toggleFeature = (feature: string) => {
    // Don't allow toggling required features
    const featureInfo = FEATURES.find(f => f.value === feature);
    if (featureInfo?.required) return;

    const currentFeatures = (config.features as string[]) || DEFAULT_FEATURES;
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    handleChange('features', newFeatures);
  };

  const network = (config.network as string) || 'arbitrum-sepolia';

  return (
    <div className="space-y-4">
      {/* Component Header */}
      <div className={cn(
        'p-3 rounded-lg border',
        'border-accent-amber/30 bg-accent-amber/5'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-accent-amber" />
          <span className="text-sm font-medium text-white">ERC-1155 Multi-Token Interface</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-accent-amber/20 text-accent-amber rounded font-medium">
            STYLUS
          </span>
        </div>
        <p className="text-xs text-forge-muted">
          Configure your ERC-1155 multi-token interface for Arbitrum Stylus
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
        <Info className="w-3 h-3 text-accent-amber shrink-0 mt-0.5" />
        <p className="text-[10px] text-forge-muted leading-relaxed">
          ERC-1155 is ideal for managing multiple token types (fungible & non-fungible) in a single contract with efficient batch operations.
        </p>
      </div>

      {/* Collection Configuration */}
      <div className="space-y-3">
        <Input
          label="Collection Name"
          value={(config.collectionName as string) || ''}
          onChange={(e) => handleChange('collectionName', e.target.value)}
          placeholder="My Multi-Token Collection"
        />

        <Input
          label="Base URI"
          value={(config.baseUri as string) || ''}
          onChange={(e) => handleChange('baseUri', e.target.value)}
          placeholder="https://api.example.com/metadata/"
        />

        <div>
          <Select
            value={network}
            onValueChange={(v) => handleChange('network', v)}
          >
            <SelectTrigger label="Target Network">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arbitrum-sepolia">Arbitrum Sepolia (Testnet)</SelectItem>
              <SelectItem value="arbitrum">Arbitrum One (Mainnet)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Features Section */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">
          Features
        </label>
        <div className="space-y-2">
          {FEATURES.map((feature) => {
            const currentFeatures = (config.features as string[]) || DEFAULT_FEATURES;
            const isActive = currentFeatures.includes(feature.value);
            return (
              <div
                key={feature.value}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border transition-all',
                  isActive
                    ? 'bg-accent-amber/10 border-accent-amber/30'
                    : 'bg-forge-bg border-forge-border',
                  feature.required && 'opacity-80'
                )}
              >
                <div className="flex items-center gap-2">
                  {isActive && <CheckCircle2 className="w-3 h-3 text-accent-amber" />}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-sm', isActive ? 'text-white' : 'text-forge-muted')}>
                        {feature.label}
                      </span>
                      {feature.required && (
                        <span className="text-[8px] px-1 py-0.5 bg-accent-amber/20 text-accent-amber rounded">
                          CORE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-forge-muted">{feature.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleFeature(feature.value)}
                  disabled={feature.required}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Use Cases */}
      <div>
        <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-accent-amber" />
          Common Use Cases
        </label>
        <div className="grid grid-cols-2 gap-2">
          {USE_CASES.map((useCase) => (
            <div
              key={useCase.name}
              className="p-2 rounded-lg bg-forge-bg/50 border border-forge-border/30"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{useCase.icon}</span>
                <span className="text-xs font-medium text-white">{useCase.name}</span>
              </div>
              <p className="text-[10px] text-forge-muted">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Requirements */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-accent-amber" />
          Deployment Requirements
        </label>

        {/* Prerequisites */}
        <div className="p-2 rounded-lg bg-forge-bg/50 border border-forge-border/30">
          <p className="text-[10px] font-medium text-white mb-1.5">Prerequisites</p>
          <ul className="space-y-1">
            {DEPLOYMENT_REQUIREMENTS.prerequisites.map((prereq, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[10px] text-forge-muted">
                <div className="w-1 h-1 rounded-full bg-accent-amber/50" />
                {prereq}
              </li>
            ))}
          </ul>
        </div>

        {/* Build Commands */}
        <div className="p-2 rounded-lg bg-forge-bg/50 border border-forge-border/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Terminal className="w-3 h-3 text-accent-amber" />
            <p className="text-[10px] font-medium text-white">Build Commands</p>
          </div>
          <div className="space-y-1 font-mono">
            {DEPLOYMENT_REQUIREMENTS.buildSteps.map((step, idx) => (
              <div key={idx} className="text-[10px] text-forge-muted bg-forge-elevated/30 px-1.5 py-0.5 rounded">
                $ {step}
              </div>
            ))}
          </div>
        </div>

        {/* Deploy Command */}
        <div className="p-2 rounded-lg bg-forge-bg/50 border border-forge-border/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Code className="w-3 h-3 text-accent-amber" />
            <p className="text-[10px] font-medium text-white">
              Deploy to {network === 'arbitrum' ? 'Mainnet' : 'Testnet'}
            </p>
          </div>
          <div className="text-[9px] text-forge-muted bg-forge-elevated/30 px-1.5 py-1 rounded font-mono break-all">
            $ {network === 'arbitrum'
              ? DEPLOYMENT_REQUIREMENTS.deploymentCommands.mainnet
              : DEPLOYMENT_REQUIREMENTS.deploymentCommands.testnet}
          </div>
        </div>

        {/* Gas Estimate */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-forge-elevated/30 border border-forge-border/30">
          <span className="text-[10px] text-forge-muted">Estimated Gas Cost</span>
          <span className="text-[10px] text-accent-amber font-medium">
            {DEPLOYMENT_REQUIREMENTS.estimatedGas}
          </span>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
        <p className="text-xs font-medium text-white mb-2">Configuration Summary</p>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-forge-muted">Collection Name:</span>
            <span className="text-accent-amber">{(config.collectionName as string) || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Base URI:</span>
            <span className="text-accent-amber truncate max-w-[150px]">
              {(config.baseUri as string) || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Network:</span>
            <span className="text-accent-amber capitalize">{network.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Active Features:</span>
            <span className="text-accent-amber">
              {((config.features as string[]) || DEFAULT_FEATURES).length} / {FEATURES.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Token Standard:</span>
            <span className="text-accent-amber">ERC-1155 Multi-Token</span>
          </div>
        </div>
      </div>

      {/* Contract Source Info */}
      <div className="flex items-start gap-1.5 p-2 rounded bg-accent-amber/5 border border-accent-amber/20">
        <Code className="w-3 h-3 text-accent-amber shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-white font-medium mb-0.5">Contract Source Available</p>
          <p className="text-[10px] text-forge-muted leading-relaxed">
            The Rust smart contract source code is available in the package at{' '}
            <code className="text-accent-amber">@cradle/erc1155-stylus/contract</code>
          </p>
        </div>
      </div>
    </div>
  );
}
