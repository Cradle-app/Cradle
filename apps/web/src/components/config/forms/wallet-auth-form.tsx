'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function WalletAuthForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Provider</label>
        <Select
          value={(config.provider as string) ?? 'rainbowkit'}
          onValueChange={(v) => updateConfig('provider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rainbowkit">RainbowKit</SelectItem>
            <SelectItem value="web3modal">Web3Modal</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">App Name</label>
        <Input
          value={(config.appName as string) ?? ''}
          onChange={(e) => updateConfig('appName', e.target.value)}
          placeholder="My DApp"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">WalletConnect</span>
        <Switch
          checked={(config.walletConnectEnabled as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('walletConnectEnabled', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">SIWE (Sign-In With Ethereum)</span>
        <Switch
          checked={(config.siweEnabled as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('siweEnabled', v)}
        />
      </div>

      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Social Logins</label>
        <div className="space-y-2">
          {['google', 'twitter', 'discord', 'github'].map((provider) => (
            <div key={provider} className="flex items-center justify-between">
              <span className="text-sm text-white capitalize">{provider}</span>
              <Switch
                checked={((config.socialLogins as string[]) ?? []).includes(provider)}
                onCheckedChange={(checked) => {
                  const current = (config.socialLogins as string[]) ?? [];
                  updateConfig('socialLogins', checked ? [...current, provider] : current.filter((p) => p !== provider));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Session Persistence</span>
        <Switch
          checked={(config.sessionPersistence as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('sessionPersistence', v)}
        />
      </div>
    </div>
  );
}

