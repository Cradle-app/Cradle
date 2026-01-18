'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function EIP7702Form({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Delegate Name</label>
        <Input
          value={(config.delegateName as string) ?? 'BatchExecutor'}
          onChange={(e) => updateConfig('delegateName', e.target.value)}
          placeholder="BatchExecutor"
        />
      </div>

      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Delegate Type</label>
        <Select
          value={(config.delegateType as string) ?? 'batch-executor'}
          onValueChange={(v) => updateConfig('delegateType', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="batch-executor">Batch Executor</SelectItem>
            <SelectItem value="session-manager">Session Manager</SelectItem>
            <SelectItem value="sponsored-executor">Sponsored Executor</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Features</label>
        <div className="space-y-2">
          {['batch-calls', 'sponsored-tx', 'session-keys', 'permissions'].map((feature) => (
            <div key={feature} className="flex items-center justify-between">
              <span className="text-sm text-white capitalize">{feature.replace('-', ' ')}</span>
              <Switch
                checked={((config.features as string[]) ?? ['batch-calls']).includes(feature)}
                onCheckedChange={(checked) => {
                  const current = (config.features as string[]) ?? ['batch-calls'];
                  updateConfig('features', checked ? [...current, feature] : current.filter((f) => f !== feature));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Security Warnings</span>
        <Switch
          checked={(config.securityWarnings as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('securityWarnings', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Generate UI Components</span>
        <Switch
          checked={(config.generateUI as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('generateUI', v)}
        />
      </div>
    </div>
  );
}

