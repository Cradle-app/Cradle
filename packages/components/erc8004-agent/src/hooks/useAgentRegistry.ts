import { useState, useEffect, useCallback } from 'react';
import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import type { SupportedNetwork } from '../constants';
import type {
    AgentMetadata,
    RegistrationStatus,
    TransactionState,
    TransactionResult,
    UseAgentRegistryOptions,
    UseAgentRegistryReturn,
    AgentCapability,
} from '../types';
import {
    checkRegistration,
    registerAgent,
    updateAgentCapabilities,
    addAgentStake,
    withdrawAgentStake,
    deactivateAgent,
    reactivateAgent,
} from '../registry';

export type { UseAgentRegistryOptions, UseAgentRegistryReturn };

/**
 * React hook for interacting with the ERC-8004 Agent Registry
 * 
 * @example
 * ```tsx
 * const registry = useAgentRegistry({
 *   publicClient,
 *   walletClient,
 *   network: 'arbitrum',
 *   userAddress,
 * });
 * 
 * // Check status
 * if (registry.status?.isRegistered) {
 *   console.log('Agent ID:', registry.status.agentInfo?.agentId);
 * }
 * 
 * // Register
 * await registry.register({
 *   name: 'MyAgent',
 *   version: '0.1.0',
 *   capabilities: ['text-generation'],
 * });
 * ```
 */
export function useAgentRegistry(options: UseAgentRegistryOptions): UseAgentRegistryReturn {
    const { publicClient, walletClient, network, userAddress, registryAddress } = options;

    const [status, setStatus] = useState<RegistrationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });

    // Fetch registration status
    const fetchStatus = useCallback(async () => {
        if (!publicClient || !userAddress) {
            setStatus(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await checkRegistration(
                publicClient as PublicClient,
                network,
                userAddress,
                registryAddress
            );
            setStatus(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to check registration'));
            setStatus(null);
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, network, userAddress, registryAddress]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Register agent
    const register = useCallback(async (
        metadata: AgentMetadata,
        stakeAmount?: bigint
    ): Promise<TransactionResult> => {
        if (!publicClient || !walletClient) {
            throw new Error('Wallet not connected');
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await registerAgent(
                publicClient as PublicClient,
                walletClient as WalletClient,
                network,
                metadata,
                stakeAmount,
                registryAddress
            );

            setTxState({ status: 'success', hash: result.hash });
            await fetchStatus();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Registration failed');
            setTxState({ status: 'error', error });
            setError(error);
            throw error;
        }
    }, [publicClient, walletClient, network, registryAddress, fetchStatus]);

    // Update capabilities
    const updateCapabilities = useCallback(async (
        capabilities: AgentCapability[]
    ): Promise<TransactionResult> => {
        if (!publicClient || !walletClient || !status?.agentInfo?.agentId) {
            throw new Error('Agent not registered or wallet not connected');
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await updateAgentCapabilities(
                publicClient as PublicClient,
                walletClient as WalletClient,
                network,
                status.agentInfo.agentId,
                capabilities,
                registryAddress
            );

            setTxState({ status: 'success', hash: result.hash });
            await fetchStatus();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Update failed');
            setTxState({ status: 'error', error });
            setError(error);
            throw error;
        }
    }, [publicClient, walletClient, network, status, registryAddress, fetchStatus]);

    // Add stake
    const addStake = useCallback(async (amount: bigint): Promise<TransactionResult> => {
        if (!publicClient || !walletClient || !status?.agentInfo?.agentId) {
            throw new Error('Agent not registered or wallet not connected');
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await addAgentStake(
                publicClient as PublicClient,
                walletClient as WalletClient,
                network,
                status.agentInfo.agentId,
                amount,
                registryAddress
            );

            setTxState({ status: 'success', hash: result.hash });
            await fetchStatus();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Staking failed');
            setTxState({ status: 'error', error });
            setError(error);
            throw error;
        }
    }, [publicClient, walletClient, network, status, registryAddress, fetchStatus]);

    // Withdraw stake
    const withdrawStake = useCallback(async (amount: bigint): Promise<TransactionResult> => {
        if (!publicClient || !walletClient || !status?.agentInfo?.agentId) {
            throw new Error('Agent not registered or wallet not connected');
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await withdrawAgentStake(
                publicClient as PublicClient,
                walletClient as WalletClient,
                network,
                status.agentInfo.agentId,
                amount,
                registryAddress
            );

            setTxState({ status: 'success', hash: result.hash });
            await fetchStatus();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Withdrawal failed');
            setTxState({ status: 'error', error });
            setError(error);
            throw error;
        }
    }, [publicClient, walletClient, network, status, registryAddress, fetchStatus]);

    // Deactivate
    const deactivate = useCallback(async (): Promise<TransactionResult> => {
        if (!publicClient || !walletClient || !status?.agentInfo?.agentId) {
            throw new Error('Agent not registered or wallet not connected');
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await deactivateAgent(
                publicClient as PublicClient,
                walletClient as WalletClient,
                network,
                status.agentInfo.agentId,
                registryAddress
            );

            setTxState({ status: 'success', hash: result.hash });
            await fetchStatus();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Deactivation failed');
            setTxState({ status: 'error', error });
            setError(error);
            throw error;
        }
    }, [publicClient, walletClient, network, status, registryAddress, fetchStatus]);

    // Reactivate
    const reactivate = useCallback(async (): Promise<TransactionResult> => {
        if (!publicClient || !walletClient || !status?.agentInfo?.agentId) {
            throw new Error('Agent not registered or wallet not connected');
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await reactivateAgent(
                publicClient as PublicClient,
                walletClient as WalletClient,
                network,
                status.agentInfo.agentId,
                registryAddress
            );

            setTxState({ status: 'success', hash: result.hash });
            await fetchStatus();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Reactivation failed');
            setTxState({ status: 'error', error });
            setError(error);
            throw error;
        }
    }, [publicClient, walletClient, network, status, registryAddress, fetchStatus]);

    return {
        status,
        isLoading,
        error,
        txState,
        register,
        updateCapabilities,
        addStake,
        withdrawStake,
        deactivate,
        reactivate,
        refetch: fetchStatus,
    };
}
