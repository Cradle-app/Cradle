'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const CONTRACT_TYPES = [
  { value: 'erc20', label: 'ERC-20 Token' },
  { value: 'erc721', label: 'ERC-721 NFT' },
  { value: 'erc1155', label: 'ERC-1155 Multi-Token' },
  { value: 'custom', label: 'Custom Contract' },
];

const FEATURES = [
  { value: 'ownable', label: 'Ownable' },
  { value: 'pausable', label: 'Pausable' },
  { value: 'upgradeable', label: 'Upgradeable' },
  { value: 'access-control', label: 'Access Control' },
  { value: 'reentrancy-guard', label: 'Reentrancy Guard' },
];

export function StylusContractForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const toggleFeature = (feature: string) => {
    const currentFeatures = (config.features as string[]) || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    handleChange('features', newFeatures);
  };

  return (
    <div className="space-y-4">
      {/* Contract Name */}
      <Input
        label="Contract Name"
        value={(config.contractName as string) || ''}
        onChange={(e) => handleChange('contractName', e.target.value)}
        placeholder="MyContract"
      />

      {/* Contract Type */}
      <div>
        <Select
          value={(config.contractType as string) || 'custom'}
          onValueChange={(value) => handleChange('contractType', value)}
        >
          <SelectTrigger label="Contract Type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Features */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">
          Features
        </label>
        <div className="space-y-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.value}
              className="flex items-center justify-between p-2 rounded-lg bg-forge-bg border border-forge-border"
            >
              <span className="text-sm text-white">{feature.label}</span>
              <Switch
                checked={((config.features as string[]) || []).includes(feature.value)}
                onCheckedChange={() => toggleFeature(feature.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Test Coverage */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Test Coverage</p>
          <p className="text-xs text-forge-muted">Generate test files</p>
        </div>
        <Switch
          checked={(config.testCoverage as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('testCoverage', checked)}
        />
      </div>

      {/* Custom Code (if custom type) */}
      {config.contractType === 'custom' && (
        <div>
          <label className="text-sm font-medium text-white mb-1.5 block">
            Custom Code (optional)
          </label>
          <textarea
            value={(config.customCode as string) || ''}
            onChange={(e) => handleChange('customCode', e.target.value)}
            placeholder="// Add custom Rust code here..."
            className="w-full h-32 px-3 py-2 text-sm bg-forge-bg border border-forge-border rounded-lg text-white placeholder:text-forge-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent font-mono resize-none"
          />
        </div>
      )}
    </div>
  );
}

