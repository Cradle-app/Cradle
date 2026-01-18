'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ZKPrimitivesForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Proof Types</label>
        <div className="space-y-2">
          {['membership', 'range', 'semaphore'].map((proofType) => (
            <div key={proofType} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white capitalize">{proofType}</span>
                <p className="text-xs text-forge-muted">
                  {proofType === 'membership' && 'Prove membership in a set'}
                  {proofType === 'range' && 'Prove value is in a range'}
                  {proofType === 'semaphore' && 'Anonymous signaling'}
                </p>
              </div>
              <Switch
                checked={((config.proofTypes as string[]) ?? ['membership']).includes(proofType)}
                onCheckedChange={(checked) => {
                  const current = (config.proofTypes as string[]) ?? ['membership'];
                  updateConfig('proofTypes', checked ? [...current, proofType] : current.filter((p) => p !== proofType));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Client-side Proving</span>
        <Switch
          checked={(config.clientSideProving as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('clientSideProving', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Generate Verifier Contracts</span>
        <Switch
          checked={(config.generateVerifiers as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('generateVerifiers', v)}
        />
      </div>
    </div>
  );
}

