'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const MODEL_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'local', label: 'Local Model' },
  { value: 'custom', label: 'Custom' },
];

const CAPABILITIES = [
  { value: 'text-generation', label: 'Text Generation' },
  { value: 'image-generation', label: 'Image Generation' },
  { value: 'code-execution', label: 'Code Execution' },
  { value: 'web-search', label: 'Web Search' },
  { value: 'data-analysis', label: 'Data Analysis' },
  { value: 'custom', label: 'Custom' },
];

export function ERC8004AgentForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const toggleCapability = (capability: string) => {
    const currentCapabilities = (config.capabilities as string[]) || [];
    const newCapabilities = currentCapabilities.includes(capability)
      ? currentCapabilities.filter(c => c !== capability)
      : [...currentCapabilities, capability];
    handleChange('capabilities', newCapabilities);
  };

  const handleRateLimitChange = (key: string, value: number) => {
    const currentRateLimit = (config.rateLimit as Record<string, number>) || {};
    handleChange('rateLimit', { ...currentRateLimit, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Agent Name */}
      <Input
        label="Agent Name"
        value={(config.agentName as string) || ''}
        onChange={(e) => handleChange('agentName', e.target.value)}
        placeholder="MyAgent"
      />

      {/* Version */}
      <Input
        label="Version"
        value={(config.agentVersion as string) || '0.1.0'}
        onChange={(e) => handleChange('agentVersion', e.target.value)}
        placeholder="0.1.0"
      />

      {/* Model Provider */}
      <div>
        <Select
          value={(config.modelProvider as string) || 'openai'}
          onValueChange={(value) => handleChange('modelProvider', value)}
        >
          <SelectTrigger label="Model Provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Capabilities */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">
          Capabilities
        </label>
        <div className="space-y-2">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.value}
              className="flex items-center justify-between p-2 rounded-lg bg-forge-bg border border-forge-border"
            >
              <span className="text-sm text-white">{capability.label}</span>
              <Switch
                checked={((config.capabilities as string[]) || []).includes(capability.value)}
                onCheckedChange={() => toggleCapability(capability.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Registry Integration */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">ERC-8004 Registry</p>
          <p className="text-xs text-forge-muted">On-chain agent registration</p>
        </div>
        <Switch
          checked={(config.registryIntegration as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('registryIntegration', checked)}
        />
      </div>

      {/* Stake Amount */}
      {Boolean(config.registryIntegration) && (
        <Input
          label="Stake Amount (wei)"
          value={(config.stakeAmount as string) || ''}
          onChange={(e) => handleChange('stakeAmount', e.target.value)}
          placeholder="Optional stake amount"
        />
      )}

      {/* Rate Limits */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white block">Rate Limits</label>
        
        <Input
          label="Requests per minute"
          type="number"
          value={((config.rateLimit as Record<string, number>)?.requestsPerMinute) || 60}
          onChange={(e) => handleRateLimitChange('requestsPerMinute', parseInt(e.target.value))}
        />
        
        <Input
          label="Tokens per minute"
          type="number"
          value={((config.rateLimit as Record<string, number>)?.tokensPerMinute) || 100000}
          onChange={(e) => handleRateLimitChange('tokensPerMinute', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}

