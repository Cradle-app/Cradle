'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function IPFSStorageForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Storage Provider</label>
        <Select
          value={(config.provider as string) ?? 'pinata'}
          onValueChange={(v) => updateConfig('provider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pinata">Pinata</SelectItem>
            <SelectItem value="web3storage">Web3.Storage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Generate Metadata Schemas</span>
        <Switch
          checked={(config.generateMetadataSchemas as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('generateMetadataSchemas', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Generate Upload UI</span>
        <Switch
          checked={(config.generateUI as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('generateUI', v)}
        />
      </div>
    </div>
  );
}

