'use client';

import { useState, useMemo } from 'react';
import type { Address } from 'viem';
import { parseUnits, isAddress } from 'viem';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Zap, CheckCircle2, Shield, Wallet, ArrowRight, Info, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
    useDelegation,
    useUsdcApproval,
    CONTRACTS,
    CHAIN_IDS,
    USDC_DECIMALS,
    DEFAULT_APPROVAL_AMOUNT,
    type SupportedNetwork,
} from '@cradle/ostium-onect';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { WalletDependencyNotice } from '@/components/config/wallet-dependency-notice';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function OstiumTradingForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const network = (config.network as SupportedNetwork) ?? 'arbitrum';

    const { blueprint } = useBlueprintStore();
    const connectedMaxxitNode = useMemo(() => {
        const incomingEdge = blueprint.edges.find((e) => e.target === nodeId);
        if (incomingEdge) {
            const sourceNode = blueprint.nodes.find((n) => n.id === incomingEdge.source && n.type === 'maxxit');
            if (sourceNode) return sourceNode;
        }
        const outgoingEdge = blueprint.edges.find((e) => e.source === nodeId);
        if (outgoingEdge) {
            const targetNode = blueprint.nodes.find((n) => n.id === outgoingEdge.target && n.type === 'maxxit');
            if (targetNode) return targetNode;
        }
        return null;
    }, [blueprint.edges, blueprint.nodes, nodeId]);

    const maxxitAgentAddress = connectedMaxxitNode?.config?.ostiumAgentAddress as string | undefined;
    const isAddressFromMaxxit = !!maxxitAgentAddress;

    const { address: userAddress, isConnected } = useAccount();
    const publicClient = usePublicClient({ chainId: CHAIN_IDS[network] });
    const { data: walletClient } = useWalletClient({ chainId: CHAIN_IDS[network] });

    const configuredDelegateAddress = isAddressFromMaxxit
        ? maxxitAgentAddress
        : (config.delegateAddress as string | undefined);
    const isValidDelegateAddress = configuredDelegateAddress && isAddress(configuredDelegateAddress);
    const delegateAddress = isValidDelegateAddress ? (configuredDelegateAddress as Address) : undefined;

    // USDC approval amount from config (user can input their own)
    const configuredApprovalAmount = config.usdcApprovalAmount as string | undefined;
    const parsedApprovalAmount = useMemo(() => {
        if (!configuredApprovalAmount || configuredApprovalAmount.trim() === '') {
            return DEFAULT_APPROVAL_AMOUNT;
        }
        try {
            const parsed = parseUnits(configuredApprovalAmount, USDC_DECIMALS);
            return parsed > 0n ? parsed : DEFAULT_APPROVAL_AMOUNT;
        } catch {
            return DEFAULT_APPROVAL_AMOUNT;
        }
    }, [configuredApprovalAmount]);

    // Use the real hooks from @cradle/ostium-onect
    const delegation = useDelegation({
        publicClient: publicClient!,
        walletClient: walletClient ?? undefined,
        network,
        userAddress,
        delegateAddress,
    });

    const approval = useUsdcApproval({
        publicClient: publicClient!,
        walletClient: walletClient ?? undefined,
        network,
        userAddress,
        approvalAmount: parsedApprovalAmount,
    });

    const isComplete = delegation.status?.isDelegated && approval.status?.hasApproval;

    // Explorer URL for transaction links
    const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://sepolia.arbiscan.io';

    // Sync state back to config when transactions complete
    useMemo(() => {
        if (delegation.status?.isDelegated !== (config.delegationEnabled as boolean)) {
            updateConfig('delegationEnabled', delegation.status?.isDelegated ?? false);
        }
        if (approval.status?.hasApproval !== (config.usdcApproved as boolean)) {
            updateConfig('usdcApproved', approval.status?.hasApproval ?? false);
        }
    }, [delegation.status?.isDelegated, approval.status?.hasApproval]);

    return (
        <div className="space-y-4">
            {/* Wallet Dependency Notice */}
            <WalletDependencyNotice nodeId={nodeId} />

            {/* Status Overview */}
            <div className={cn(
                'p-3 rounded-lg border',
                isComplete
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-forge-border/50 bg-forge-bg/50'
            )}>
                <div className="flex items-center gap-2 mb-2">
                    <Zap className={cn('w-4 h-4', isComplete ? 'text-green-400' : 'text-accent-cyan')} />
                    <span className="text-sm font-medium text-white">One-Click Trading</span>
                    {isComplete && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
                            READY
                        </span>
                    )}
                </div>
                <p className="text-xs text-forge-muted">
                    {isComplete
                        ? 'Your wallet is configured for automated trading on Ostium.'
                        : 'Enable delegation and USDC approval to allow automated trading.'}
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

            {/* Step 1: Delegation */}
            <div className={cn(
                'p-3 rounded-lg border transition-all',
                delegation.status?.isDelegated
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-forge-border/50 bg-forge-bg/50'
            )}>
                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
                        delegation.status?.isDelegated
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-forge-border bg-forge-bg'
                    )}>
                        {delegation.status?.isDelegated ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : delegation.txState.status === 'pending' ? (
                            <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
                        ) : (
                            <Shield className="w-4 h-4 text-forge-muted" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-white">Enable Delegation</p>
                            {delegation.status?.isDelegated ? (
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                    Active
                                </span>
                            ) : (
                                <button
                                    onClick={() => delegation.enable()}
                                    disabled={!isConnected || delegation.txState.status === 'pending' || !isValidDelegateAddress}
                                    className={cn(
                                        'px-2 py-1 text-xs rounded font-medium transition-colors',
                                        'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {delegation.txState.status === 'pending' ? 'Signing...' : 'Enable'}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-forge-muted mb-2">
                            Delegate signatures to enable gasless transactions.
                        </p>

                        {!delegation.status?.isDelegated && (
                            <div className="mb-3">
                                <label className="text-[10px] text-forge-muted mb-1 block">
                                    Delegate Address
                                    {isAddressFromMaxxit && (
                                        <span className="ml-2 text-cyan-400">(from Lazy Trader)</span>
                                    )}
                                </label>
                                <Input
                                    type="text"
                                    placeholder="0x..."
                                    value={configuredDelegateAddress ?? ''}
                                    onChange={(e) => !isAddressFromMaxxit && updateConfig('delegateAddress', e.target.value)}
                                    readOnly={isAddressFromMaxxit}
                                    className={cn(
                                        "text-xs h-8 font-mono",
                                        isAddressFromMaxxit && "bg-forge-bg/50 cursor-not-allowed opacity-80"
                                    )}
                                />
                                {configuredDelegateAddress && !isValidDelegateAddress && (
                                    <p className="text-[10px] text-yellow-400 mt-1">
                                        Please enter a valid Ethereum address
                                    </p>
                                )}
                            </div>
                        )}

                        {delegation.txState.status === 'success' && (
                            <a
                                href={`${explorerUrl}/tx/${delegation.txState.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View transaction
                            </a>
                        )}

                        {delegation.error && (
                            <p className="text-[10px] text-red-400 mt-1">
                                {delegation.error.message}
                            </p>
                        )}

                        {!delegation.status?.isDelegated && !delegation.isLoading && (
                            <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
                                <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
                                <p className="text-[10px] text-forge-muted leading-relaxed">
                                    This calls <code className="text-accent-cyan">setDelegate()</code> on the Ostium trading contract.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Step 2: USDC Approval */}
            <div className={cn(
                'p-3 rounded-lg border transition-all',
                approval.status?.hasApproval
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-forge-border/50 bg-forge-bg/50'
            )}>
                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
                        approval.status?.hasApproval
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-forge-border bg-forge-bg'
                    )}>
                        {approval.status?.hasApproval ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : approval.txState.status === 'pending' ? (
                            <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
                        ) : (
                            <Wallet className="w-4 h-4 text-forge-muted" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-white">Approve USDC</p>
                            {approval.status?.hasApproval ? (
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                    {approval.status.formattedAllowance} USDC
                                </span>
                            ) : (
                                <button
                                    onClick={() => approval.approve()}
                                    disabled={!isConnected || approval.txState.status === 'pending'}
                                    className={cn(
                                        'px-2 py-1 text-xs rounded font-medium transition-colors',
                                        'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {approval.txState.status === 'pending' ? 'Signing...' : 'Approve'}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-forge-muted mb-2">
                            Set USDC allowance for the Ostium storage contract.
                        </p>

                        {/* USDC Approval Amount Input */}
                        {!approval.status?.hasApproval && (
                            <div className="mb-3">
                                <label className="text-[10px] text-forge-muted mb-1 block">Approval Amount (USDC)</label>
                                <Input
                                    type="text"
                                    placeholder="1000000"
                                    value={configuredApprovalAmount ?? ''}
                                    onChange={(e) => updateConfig('usdcApprovalAmount', e.target.value)}
                                    className="text-xs h-8"
                                />
                                <p className="text-[10px] text-forge-muted mt-1">
                                    Leave empty for default (1,000,000 USDC)
                                </p>
                            </div>
                        )}

                        {approval.balance && (
                            <p className="text-[10px] text-forge-muted mb-2">
                                Balance: {approval.balance.formatted} USDC
                            </p>
                        )}

                        {approval.txState.status === 'success' && (
                            <a
                                href={`${explorerUrl}/tx/${approval.txState.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View transaction
                            </a>
                        )}

                        {approval.error && (
                            <p className="text-[10px] text-red-400 mt-1">
                                {approval.error.message}
                            </p>
                        )}

                        {!approval.status?.hasApproval && !approval.isLoading && (
                            <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
                                <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
                                <p className="text-[10px] text-forge-muted leading-relaxed">
                                    This calls <code className="text-accent-cyan">approve()</code> on the USDC contract with a high allowance.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contract Info */}
            <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                <p className="text-xs font-medium text-forge-muted mb-2">Contract Addresses ({network === 'arbitrum' ? 'Mainnet' : 'Testnet'})</p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-forge-muted">Trading Contract</span>
                        <code className="text-[10px] text-accent-cyan font-mono">
                            {CONTRACTS[network].trading.slice(0, 6)}...{CONTRACTS[network].trading.slice(-4)}
                        </code>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-forge-muted">Storage Contract</span>
                        <code className="text-[10px] text-accent-cyan font-mono">
                            {CONTRACTS[network].storage.slice(0, 6)}...{CONTRACTS[network].storage.slice(-4)}
                        </code>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-forge-muted">USDC Token</span>
                        <code className="text-[10px] text-accent-cyan font-mono">
                            {CONTRACTS[network].usdc.slice(0, 6)}...{CONTRACTS[network].usdc.slice(-4)}
                        </code>
                    </div>
                </div>
            </div>

            {/* Summary */}
            {isComplete && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-accent-cyan/5 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-white">Setup Complete</span>
                    </div>
                    <p className="text-xs text-forge-muted">
                        Your wallet is configured for automated trading on Ostium. The same code powering this form will be included in your generated project.
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
