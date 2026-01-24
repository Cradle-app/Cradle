'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function WalletAuthForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const { address, isConnected, chain } = useAccount();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const provider = (config.provider as string) ?? 'rainbowkit';
  const appName = (config.appName as string) ?? '';

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={cn(
        'p-3 rounded-lg border',
        isConnected
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-forge-border/50 bg-forge-bg/50'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className={cn('w-4 h-4', isConnected ? 'text-green-400' : 'text-accent-cyan')} />
          <span className="text-sm font-medium text-white">Wallet Connection</span>
          {isConnected && (
            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
              CONNECTED
            </span>
          )}
        </div>
        {isConnected ? (
          <div className="space-y-1">
            <p className="text-xs text-forge-muted">
              <span className="text-white">Address:</span>{' '}
              <code className="text-accent-cyan">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
            </p>
            <p className="text-xs text-forge-muted">
              <span className="text-white">Network:</span> {chain?.name}
            </p>
          </div>
        ) : (
          <p className="text-xs text-forge-muted mb-3">
            Connect your wallet to test the authentication flow.
          </p>
        )}
        <div className="mt-3">
          <ConnectButton.Custom>
            {({ openConnectModal, openAccountModal, mounted }) => {
              if (!mounted) return null;

              if (isConnected) {
                return (
                  <button
                    onClick={openAccountModal}
                    className="w-full px-3 py-2 text-xs font-medium rounded bg-forge-elevated text-white hover:bg-forge-elevated/80 transition-colors"
                  >
                    Manage Wallet
                  </button>
                );
              }

              return (
                <button
                  onClick={openConnectModal}
                  className="w-full px-3 py-2 text-xs font-medium rounded bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors"
                >
                  Connect Wallet
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Provider</label>
        <Select
          value={provider}
          onValueChange={(v) => updateConfig('provider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rainbowkit">RainbowKit (Recommended)</SelectItem>
            <SelectItem value="privy" disabled>Privy (Coming Soon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* App Name */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">App Name</label>
        <Input
          value={appName}
          onChange={(e) => updateConfig('appName', e.target.value)}
          placeholder="My DApp"
        />
        <p className="text-[10px] text-forge-muted mt-1">
          Displayed in wallet connection dialogs
        </p>
      </div>

      {/* Setup Instructions */}
      <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-3.5 h-3.5 text-accent-cyan mt-0.5" />
          <p className="text-xs font-medium text-white">Setup Required</p>
        </div>
        <p className="text-[10px] text-forge-muted mb-2">
          To enable mobile wallet connections, you need a Project ID from WalletConnect Cloud:
        </p>
        <a
          href="https://dashboard.reown.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Get WalletConnect Project ID
        </a>
        <div className="mt-2 p-2 rounded bg-forge-elevated/50">
          <code className="text-[10px] text-forge-muted">
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-id
          </code>
        </div>
      </div>

      {/* What's Included */}
      {isConnected && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-accent-cyan/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Ready for Code Generation</span>
          </div>
          <p className="text-xs text-forge-muted">
            The <code className="text-accent-cyan">@cradle/wallet-auth</code> component will be included in your generated project with RainbowKit pre-configured.
          </p>
        </div>
      )}
    </div>
  );
}
