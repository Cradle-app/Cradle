'use client';

import { useEffect } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Image, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const FEATURES = [
  { value: 'ownable', label: 'Ownable', description: 'Owner can manage contract' },
  { value: 'mintable', label: 'Mintable', description: 'Owner can mint new NFTs' },
  { value: 'burnable', label: 'Burnable', description: 'Users can burn their NFTs' },
  { value: 'pausable', label: 'Pausable', description: 'Owner can pause transfers' },
  { value: 'enumerable', label: 'Enumerable', description: 'List all tokens (higher gas)' },
];

// All features enabled by default
const DEFAULT_FEATURES = FEATURES.map(f => f.value);

export function ERC721StylusForm({ nodeId, config }: Props) {
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
        'border-accent-purple/30 bg-accent-purple/5'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Image className="w-4 h-4 text-accent-purple" />
          <span className="text-sm font-medium text-white">ERC-721 NFT Interface</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple rounded font-medium">
            STYLUS
          </span>
        </div>
        <p className="text-xs text-forge-muted">
          Configure your ERC-721 NFT collection interface for Arbitrum Stylus
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
        <Info className="w-3 h-3 text-accent-purple shrink-0 mt-0.5" />
        <p className="text-[10px] text-forge-muted leading-relaxed">
          This component provides the interface configuration. The smart contract source code is available in the package for deployment via CLI.
        </p>
      </div>

      {/* Collection Configuration */}
      <div className="space-y-3">
        <Input
          label="Collection Name"
          value={(config.collectionName as string) || ''}
          onChange={(e) => handleChange('collectionName', e.target.value)}
          placeholder="My NFT Collection"
        />

        <Input
          label="Collection Symbol"
          value={(config.collectionSymbol as string) || ''}
          onChange={(e) => handleChange('collectionSymbol', e.target.value.toUpperCase())}
          placeholder="MNFT"
        />

        <Input
          label="Base URI"
          value={(config.baseUri as string) || ''}
          onChange={(e) => handleChange('baseUri', e.target.value)}
          placeholder="https://api.example.com/metadata/"
        />

        <Input
          label="Max Supply (optional)"
          value={(config.maxSupply as string) || ''}
          onChange={(e) => handleChange('maxSupply', e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="10000"
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

      {/* Features - All Active by Default */}
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
                    ? 'bg-accent-purple/10 border-accent-purple/30'
                    : 'bg-forge-bg border-forge-border'
                )}
              >
                <div className="flex items-center gap-2">
                  {isActive && <CheckCircle2 className="w-3 h-3 text-accent-purple" />}
                  <div>
                    <span className={cn('text-sm', isActive ? 'text-white' : 'text-forge-muted')}>
                      {feature.label}
                    </span>
                    <p className="text-[10px] text-forge-muted">{feature.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleFeature(feature.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
        <p className="text-xs font-medium text-white mb-2">Configuration Summary</p>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-forge-muted">Collection Name:</span>
            <span className="text-accent-purple">{(config.collectionName as string) || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Symbol:</span>
            <span className="text-accent-purple">{(config.collectionSymbol as string) || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Base URI:</span>
            <span className="text-accent-purple truncate max-w-[150px]">
              {(config.baseUri as string) || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Max Supply:</span>
            <span className="text-accent-purple">{(config.maxSupply as string) || 'Unlimited'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Network:</span>
            <span className="text-accent-purple capitalize">{network.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Active Features:</span>
            <span className="text-accent-purple">
              {((config.features as string[]) || DEFAULT_FEATURES).length} / {FEATURES.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
