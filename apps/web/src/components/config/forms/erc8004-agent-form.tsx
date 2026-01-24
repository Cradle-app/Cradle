'use client';

import { useState, useMemo } from 'react';
import type { Address } from 'viem';
import { parseEther, formatEther, isAddress } from 'viem';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Bot, CheckCircle2, Shield, Wallet, ArrowRight, Info, Loader2,
  ExternalLink, Zap, AlertCircle, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import from the ERC-8004 component package
import {
  useAgentRegistry,
  CHAIN_IDS,
  REGISTRY_CONTRACTS,
  AGENT_CAPABILITIES,
  OPENROUTER_MODELS,
  DEFAULT_MODEL,
  DEFAULT_STAKE_AMOUNT,
  type SupportedNetwork,
  type AgentCapability,
} from '@cradle/erc8004-agent';

// Viem and wagmi for wallet connection
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { WalletDependencyNotice } from '@/components/config/wallet-dependency-notice';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const CAPABILITY_LABELS: Record<string, string> = {
  'text-generation': 'Text Generation',
  'image-generation': 'Image Generation',
  'code-execution': 'Code Execution',
  'web-search': 'Web Search',
  'data-analysis': 'Data Analysis',
};

const ENABLED_CAPABILITIES = ['text-generation'] as const;

const MODEL_LABELS: Record<string, string> = {
  'openai/gpt-4o': 'GPT-4o',
  'openai/gpt-4o-mini': 'GPT-4o Mini',
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'anthropic/claude-3-haiku': 'Claude 3 Haiku',
  'google/gemini-pro-1.5': 'Gemini Pro 1.5',
  'meta-llama/llama-3.1-70b-instruct': 'Llama 3.1 70B',
};

export function ERC8004AgentForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const network = (config.network as SupportedNetwork) ?? 'arbitrum';

  // Wallet connection
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_IDS[network] });
  const { data: walletClient } = useWalletClient({ chainId: CHAIN_IDS[network] });

  // Custom registry address from config
  const configuredRegistryAddress = config.registryAddress as string | undefined;
  const isValidRegistryAddress = configuredRegistryAddress && isAddress(configuredRegistryAddress);
  const registryAddress = isValidRegistryAddress ? (configuredRegistryAddress as Address) : undefined;

  // Use the registry hook
  const registry = useAgentRegistry({
    publicClient: publicClient!,
    walletClient: walletClient ?? undefined,
    network,
    userAddress,
    registryAddress,
  });

  // Form state
  const agentName = (config.agentName as string) ?? '';
  const agentVersion = (config.agentVersion as string) ?? '0.1.0';
  const capabilities = (config.capabilities as AgentCapability[]) ?? ['text-generation'];
  const selectedModel = (config.selectedModel as string) ?? DEFAULT_MODEL;
  const registryIntegration = (config.registryIntegration as boolean) ?? true;
  const stakeAmount = (config.stakeAmount as string) ?? '';

  // State for agent actions
  const [actionStakeAmount, setActionStakeAmount] = useState('');


  // Parse stake amount
  const parsedStakeAmount = useMemo(() => {
    if (!stakeAmount || stakeAmount.trim() === '') {
      return DEFAULT_STAKE_AMOUNT;
    }
    try {
      const parsed = parseEther(stakeAmount);
      return parsed > 0n ? parsed : DEFAULT_STAKE_AMOUNT;
    } catch {
      return DEFAULT_STAKE_AMOUNT;
    }
  }, [stakeAmount]);

  const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://sepolia.arbiscan.io';

  const registryAvailable = REGISTRY_CONTRACTS[network] !== '0x0000000000000000000000000000000000000000' || isValidRegistryAddress;

  useMemo(() => {
    if (registry.status?.isRegistered !== (config.isRegistered as boolean)) {
      updateConfig('isRegistered', registry.status?.isRegistered ?? false);
    }
    if (registry.status?.agentInfo?.agentId && registry.status.agentInfo.agentId !== (config.agentId as string)) {
      updateConfig('agentId', registry.status.agentInfo.agentId);
    }
  }, [registry.status?.isRegistered, registry.status?.agentInfo?.agentId]);

  const toggleCapability = (capability: AgentCapability) => {
    const newCapabilities = capabilities.includes(capability)
      ? capabilities.filter(c => c !== capability)
      : [...capabilities, capability];
    updateConfig('capabilities', newCapabilities);
  };

  const handleRegister = async () => {
    if (!agentName) {
      return;
    }
    await registry.register({
      name: agentName,
      version: agentVersion,
      capabilities,
    }, parsedStakeAmount);
  };

  // Parse action stake amount
  const parsedActionStakeAmount = useMemo(() => {
    if (!actionStakeAmount || actionStakeAmount.trim() === '') {
      return 0n;
    }
    try {
      return parseEther(actionStakeAmount);
    } catch {
      return 0n;
    }
  }, [actionStakeAmount]);

  const handleAddStake = async () => {
    if (parsedActionStakeAmount <= 0n) return;
    await registry.addStake(parsedActionStakeAmount);
    setActionStakeAmount('');
  };

  const handleWithdrawStake = async () => {
    if (parsedActionStakeAmount <= 0n) return;
    await registry.withdrawStake(parsedActionStakeAmount);
    setActionStakeAmount('');
  };

  const handleDeactivate = async () => {
    await registry.deactivate();
  };

  const handleReactivate = async () => {
    await registry.reactivate();
  };

  return (
    <div className="space-y-4">
      {/* Wallet Dependency Notice */}
      <WalletDependencyNotice nodeId={nodeId} />

      {/* Status Overview */}
      <div className={cn(
        'p-3 rounded-lg border',
        registry.status?.isRegistered
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-forge-border/50 bg-forge-bg/50'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Bot className={cn('w-4 h-4', registry.status?.isRegistered ? 'text-green-400' : 'text-accent-cyan')} />
          <span className="text-sm font-medium text-white">ERC-8004 Agent</span>
          {registry.status?.isRegistered && (
            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
              REGISTERED
            </span>
          )}
        </div>
        <p className="text-xs text-forge-muted">
          {registry.status?.isRegistered
            ? `Agent "${registry.status.agentInfo?.name}" is registered on-chain.`
            : 'Configure and register your AI agent on the ERC-8004 registry.'}
        </p>
      </div>

      {/* Network Selection */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Network</label>
        <Select
          value={network}
          onValueChange={(v) => updateConfig('network', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="arbitrum">Arbitrum One (Mainnet)</SelectItem>
            <SelectItem value="arbitrum-sepolia">Arbitrum Sepolia (Testnet)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent Name */}
      <Input
        label="Agent Name"
        value={agentName}
        onChange={(e) => updateConfig('agentName', e.target.value)}
        placeholder="MyAgent"
        disabled={registry.status?.isRegistered}
      />

      {/* Version */}
      <Input
        label="Version"
        value={agentVersion}
        onChange={(e) => updateConfig('agentVersion', e.target.value)}
        placeholder="0.1.0"
        disabled={registry.status?.isRegistered}
      />

      {/* Model Selection */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Model (via OpenRouter)</label>
        <Select
          value={selectedModel}
          onValueChange={(v) => updateConfig('selectedModel', v)}
          disabled={registry.status?.isRegistered}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {OPENROUTER_MODELS.map((model) => (
              <SelectItem key={model} value={model}>
                {MODEL_LABELS[model] || model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-forge-muted mt-1">
          Powered by OpenRouter. You can use any model from <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">openrouter.ai/models</a>
        </p>
      </div>

      {/* Capabilities */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">Capabilities</label>
        <div className="space-y-2">
          {AGENT_CAPABILITIES.filter(c => c !== 'custom').map((capability) => {
            const isEnabled = ENABLED_CAPABILITIES.includes(capability as typeof ENABLED_CAPABILITIES[number]);
            return (
              <div
                key={capability}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg bg-forge-bg border border-forge-border",
                  !isEnabled && "opacity-50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{CAPABILITY_LABELS[capability]}</span>
                  {!isEnabled && (
                    <span className="text-[10px] text-forge-muted">(coming soon)</span>
                  )}
                </div>
                <Switch
                  checked={capabilities.includes(capability)}
                  onCheckedChange={() => toggleCapability(capability)}
                  disabled={registry.status?.isRegistered || !isEnabled}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Registry Integration */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">ERC-8004 Registry</p>
          <p className="text-xs text-forge-muted">
            {registry.status?.isRegistered
              ? 'Agent is registered on-chain'
              : 'On-chain agent registration'}
          </p>
        </div>
        <Switch
          checked={registryIntegration}
          onCheckedChange={(checked) => updateConfig('registryIntegration', checked)}
          disabled={registry.status?.isRegistered}
        />
      </div>

      {/* Registration Section */}
      {registryIntegration && (
        <div className={cn(
          'p-3 rounded-lg border transition-all',
          registry.status?.isRegistered
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-forge-border/50 bg-forge-bg/50'
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
              registry.status?.isRegistered
                ? 'border-green-500 bg-green-500/10'
                : 'border-forge-border bg-forge-bg'
            )}>
              {registry.status?.isRegistered ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : registry.txState.status === 'pending' ? (
                <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
              ) : (
                <Shield className="w-4 h-4 text-forge-muted" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-white">On-Chain Registration</p>
                {registry.status?.isRegistered ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={!isConnected || registry.txState.status === 'pending' || !agentName || !registryAvailable}
                    className={cn(
                      'px-2 py-1 text-xs rounded font-medium transition-colors',
                      'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {registry.txState.status === 'pending' ? 'Registering...' : 'Register'}
                  </button>
                )}
              </div>
              <p className="text-xs text-forge-muted mb-2">
                Register your agent on the ERC-8004 registry for discoverability and reputation.
              </p>

              {/* Registry not available warning */}
              {!registryAvailable && (
                <div className="flex items-start gap-1.5 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 mb-2">
                  <AlertCircle className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-400 leading-relaxed">
                    Registry contract not deployed on this network. Specify a custom address below or proceed without on-chain registration.
                  </p>
                </div>
              )}

              {/* Custom Registry Address */}
              {!registry.status?.isRegistered && (
                <div className="mb-3">
                  <label className="text-[10px] text-forge-muted mb-1 block">Custom Registry Address (optional)</label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={configuredRegistryAddress ?? ''}
                    onChange={(e) => updateConfig('registryAddress', e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                  {configuredRegistryAddress && !isValidRegistryAddress && (
                    <p className="text-[10px] text-yellow-400 mt-1">
                      Please enter a valid Ethereum address
                    </p>
                  )}
                </div>
              )}

              {/* Stake Amount */}
              {!registry.status?.isRegistered && (
                <div className="mb-3">
                  <label className="text-[10px] text-forge-muted mb-1 block">Stake Amount (ETH)</label>
                  <Input
                    type="text"
                    placeholder="0.01"
                    value={stakeAmount}
                    onChange={(e) => updateConfig('stakeAmount', e.target.value)}
                    className="text-xs h-8"
                  />
                  <p className="text-[10px] text-forge-muted mt-1">
                    Leave empty for default (0.01 ETH)
                  </p>
                </div>
              )}

              {/* Registered Agent Info */}
              {registry.status?.isRegistered && registry.status.agentInfo && (
                <div className="p-2 rounded bg-forge-elevated/50 border border-forge-border/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-forge-muted">Agent ID</span>
                    <code className="text-[10px] text-accent-cyan font-mono">
                      {registry.status.agentInfo.agentId?.slice(0, 10)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-forge-muted">Stake</span>
                    <span className="text-[10px] text-white">
                      {registry.status.agentInfo.stake !== undefined
                        ? formatEther(registry.status.agentInfo.stake)
                        : '0'} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-forge-muted">Reputation</span>
                    <span className="text-[10px] text-white">
                      {registry.status.agentInfo.reputation?.toString() ?? '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-forge-muted">Status</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      registry.status.agentInfo.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {registry.status.agentInfo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}

              {registry.txState.status === 'success' && (
                <a
                  href={`${explorerUrl}/tx/${registry.txState.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-accent-cyan hover:underline mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  View transaction
                </a>
              )}

              {registry.error && (
                <p className="text-[10px] text-red-400 mt-1">
                  {registry.error.message}
                </p>
              )}

              {!registry.status?.isRegistered && !registry.isLoading && registryAvailable && (
                <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
                  <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
                  <p className="text-[10px] text-forge-muted leading-relaxed">
                    This calls <code className="text-accent-cyan">registerAgent()</code> on the ERC-8004 registry contract.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent Actions - Only show when registered */}
      {registryIntegration && registry.status?.isRegistered && (
        <div className="p-3 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm font-medium text-white">Agent Actions</span>
          </div>

          {/* Stake Management */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-forge-muted mb-1 block">Stake Amount (ETH)</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0.01"
                  value={actionStakeAmount}
                  onChange={(e) => setActionStakeAmount(e.target.value)}
                  className="text-xs h-8 flex-1"
                />
                <button
                  onClick={handleAddStake}
                  disabled={registry.txState.status === 'pending' || parsedActionStakeAmount <= 0n}
                  className={cn(
                    'px-3 py-1 text-xs rounded font-medium transition-colors',
                    'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Add
                </button>
                <button
                  onClick={handleWithdrawStake}
                  disabled={registry.txState.status === 'pending' || parsedActionStakeAmount <= 0n}
                  className={cn(
                    'px-3 py-1 text-xs rounded font-medium transition-colors',
                    'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Agent Status Controls */}
            <div className="flex items-center justify-between p-2 rounded bg-forge-bg border border-forge-border">
              <div>
                <p className="text-xs font-medium text-white">Agent Status</p>
                <p className="text-[10px] text-forge-muted">
                  {registry.status.agentInfo?.isActive
                    ? 'Your agent is currently active'
                    : 'Your agent is currently inactive'}
                </p>
              </div>
              {registry.status.agentInfo?.isActive ? (
                <button
                  onClick={handleDeactivate}
                  disabled={registry.txState.status === 'pending'}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded font-medium transition-colors',
                    'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {registry.txState.status === 'pending' ? 'Processing...' : 'Deactivate'}
                </button>
              ) : (
                <button
                  onClick={handleReactivate}
                  disabled={registry.txState.status === 'pending'}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded font-medium transition-colors',
                    'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {registry.txState.status === 'pending' ? 'Processing...' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
        <p className="text-xs font-medium text-forge-muted mb-2">Registry Contract ({network === 'arbitrum' ? 'Mainnet' : 'Testnet'})</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-forge-muted">Address</span>
          <code className="text-[10px] text-accent-cyan font-mono">
            {registryAddress
              ? `${registryAddress.slice(0, 6)}...${registryAddress.slice(-4)}`
              : REGISTRY_CONTRACTS[network] === '0x0000000000000000000000000000000000000000'
                ? 'Not deployed'
                : `${REGISTRY_CONTRACTS[network].slice(0, 6)}...${REGISTRY_CONTRACTS[network].slice(-4)}`
            }
          </code>
        </div>
      </div>

      {/* Summary */}
      {registry.status?.isRegistered && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-accent-cyan/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Agent Ready</span>
          </div>
          <p className="text-xs text-forge-muted">
            Your agent is registered on-chain. The same code powering this form will be included in your generated project.
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-accent-cyan">
            <ArrowRight className="w-3 h-3" />
            <span>Ready for code generation</span>
          </div>
        </div>
      )}
    </div>
  );
}
