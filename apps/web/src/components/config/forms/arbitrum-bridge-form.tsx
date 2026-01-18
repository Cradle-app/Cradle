'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ArbitrumBridgeForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Target Network</label>
        <Select
          value={(config.targetNetwork as string) ?? 'arbitrum'}
          onValueChange={(v) => updateConfig('targetNetwork', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="arbitrum">Arbitrum One</SelectItem>
            <SelectItem value="arbitrumSepolia">Arbitrum Sepolia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">ERC-20 Bridging</span>
        <Switch
          checked={(config.enableERC20 as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('enableERC20', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Cross-chain Messaging</span>
        <Switch
          checked={(config.enableMessaging as boolean) ?? false}
          onCheckedChange={(v) => updateConfig('enableMessaging', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Generate Bridge UI</span>
        <Switch
          checked={(config.generateUI as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('generateUI', v)}
        />
      </div>
    </div>
  );
}

