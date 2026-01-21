/**
 * React Hook for Ostium Delegation
 * Manages delegation state and transactions
 */

import { useState, useCallback, useEffect } from 'react';
import type { Address, PublicClient, WalletClient } from 'viem';
import { checkDelegation, enableDelegation, removeDelegation } from '../delegation';
import type { DelegationStatus, TransactionState } from '../types';
import { ZERO_ADDRESS, type SupportedNetwork } from '../constants';

export interface UseDelegationOptions {
    publicClient: PublicClient;
    walletClient?: WalletClient;
    network: SupportedNetwork;
    userAddress?: Address;
    delegateAddress?: Address;
}

export interface UseDelegationReturn {
    /** Current delegation status */
    status: DelegationStatus | null;
    /** Whether we're loading the initial status */
    isLoading: boolean;
    /** Current transaction state */
    txState: TransactionState;
    /** Enable delegation to the configured delegate address */
    enable: () => Promise<void>;
    /** Remove/disable delegation */
    disable: () => Promise<void>;
    /** Refresh the delegation status */
    refresh: () => Promise<void>;
    /** Any error that occurred */
    error: Error | null;
}

export function useDelegation({
    publicClient,
    walletClient,
    network,
    userAddress,
    delegateAddress,
}: UseDelegationOptions): UseDelegationReturn {
    const [status, setStatus] = useState<DelegationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
    const [error, setError] = useState<Error | null>(null);

    // Fetch current delegation status
    const refresh = useCallback(async () => {
        if (!userAddress) {
            setStatus(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const delegationStatus = await checkDelegation(
                publicClient,
                network,
                userAddress
            );
            setStatus(delegationStatus);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to check delegation'));
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, network, userAddress]);

    // Auto-fetch on mount and when dependencies change
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Enable delegation
    const enable = useCallback(async () => {
        if (!walletClient || !delegateAddress || delegateAddress === ZERO_ADDRESS) {
            setError(new Error('Wallet client and delegate address required'));
            return;
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await enableDelegation(
                walletClient,
                publicClient,
                network,
                delegateAddress
            );

            setTxState({ status: 'success', hash: result.hash });

            // Refresh status after successful transaction
            await refresh();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Transaction failed');
            setError(error);
            setTxState({ status: 'error', error });
        }
    }, [walletClient, publicClient, network, delegateAddress, refresh]);

    // Disable delegation
    const disable = useCallback(async () => {
        if (!walletClient) {
            setError(new Error('Wallet client required'));
            return;
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await removeDelegation(walletClient, publicClient, network);

            setTxState({ status: 'success', hash: result.hash });

            // Refresh status after successful transaction
            await refresh();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Transaction failed');
            setError(error);
            setTxState({ status: 'error', error });
        }
    }, [walletClient, publicClient, network, refresh]);

    return {
        status,
        isLoading,
        txState,
        enable,
        disable,
        refresh,
        error,
    };
}
