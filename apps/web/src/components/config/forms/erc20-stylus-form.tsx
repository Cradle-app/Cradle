'use client';

import { useEffect } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Coins, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const FEATURES = [
  { value: 'ownable', label: 'Ownable', description: 'Owner can manage contract' },
  { value: 'mintable', label: 'Mintable', description: 'Owner can mint new tokens' },
  { value: 'burnable', label: 'Burnable', description: 'Users can burn their tokens' },
  { value: 'pausable', label: 'Pausable', description: 'Owner can pause transfers' },
];

// All features enabled by default
const DEFAULT_FEATURES = FEATURES.map(f => f.value);

export function ERC20StylusForm({ nodeId, config }: Props) {
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
        'border-accent-cyan/30 bg-accent-cyan/5'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-white">ERC-20 Token Interface</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-accent-cyan/20 text-accent-cyan rounded font-medium">
            STYLUS
          </span>
        </div>
        <p className="text-xs text-forge-muted">
          Configure your ERC-20 token interface for Arbitrum Stylus
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
        <Info className="w-3 h-3 text-accent-cyan shrink-0 mt-0.5" />
        <p className="text-[10px] text-forge-muted leading-relaxed">
          This component provides the interface configuration. The smart contract source code is available in the package for deployment via CLI.
        </p>
      </div>

      {/* Token Configuration */}
      <div className="space-y-3">
        <Input
          label="Token Name"
          value={(config.tokenName as string) || ''}
          onChange={(e) => handleChange('tokenName', e.target.value)}
          placeholder="My Token"
        />

        <Input
          label="Token Symbol"
          value={(config.tokenSymbol as string) || ''}
          onChange={(e) => handleChange('tokenSymbol', e.target.value.toUpperCase())}
          placeholder="MTK"
        />

        <Input
          label="Initial Supply"
          value={(config.initialSupply as string) || ''}
          onChange={(e) => handleChange('initialSupply', e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="1000000"
        />

        <Input
          label="Decimals"
          value={(config.decimals as string) || '18'}
          onChange={(e) => handleChange('decimals', e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="18"
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
                    ? 'bg-accent-cyan/10 border-accent-cyan/30'
                    : 'bg-forge-bg border-forge-border'
                )}
              >
                <div className="flex items-center gap-2">
                  {isActive && <CheckCircle2 className="w-3 h-3 text-accent-cyan" />}
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
            <span className="text-forge-muted">Token Name:</span>
            <span className="text-accent-cyan">{(config.tokenName as string) || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Symbol:</span>
            <span className="text-accent-cyan">{(config.tokenSymbol as string) || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Initial Supply:</span>
            <span className="text-accent-cyan">{(config.initialSupply as string) || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Network:</span>
            <span className="text-accent-cyan capitalize">{network.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">Active Features:</span>
            <span className="text-accent-cyan">
              {((config.features as string[]) || DEFAULT_FEATURES).length} / {FEATURES.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
