/**
 * React Hook for USDC Approval
 * Manages USDC approval state and transactions
 */

import { useState, useCallback, useEffect } from 'react';
import type { Address, PublicClient, WalletClient } from 'viem';
import { checkAllowance, approveUsdc, revokeUsdcApproval, getUsdcBalance } from '../approval';
import { DEFAULT_APPROVAL_AMOUNT } from '../constants';
import type { ApprovalStatus, TransactionState } from '../types';
import type { SupportedNetwork } from '../constants';

export interface UseUsdcApprovalOptions {
    publicClient: PublicClient;
    walletClient?: WalletClient;
    network: SupportedNetwork;
    userAddress?: Address;
    approvalAmount?: bigint;
}

export interface UseUsdcApprovalReturn {
    /** Current approval status */
    status: ApprovalStatus | null;
    /** User's USDC balance */
    balance: { balance: bigint; formatted: string } | null;
    /** Whether we're loading the initial status */
    isLoading: boolean;
    /** Current transaction state */
    txState: TransactionState;
    /** Approve USDC spending */
    approve: () => Promise<void>;
    /** Revoke USDC approval */
    revoke: () => Promise<void>;
    /** Refresh the approval status */
    refresh: () => Promise<void>;
    /** Any error that occurred */
    error: Error | null;
}

export function useUsdcApproval({
    publicClient,
    walletClient,
    network,
    userAddress,
    approvalAmount = DEFAULT_APPROVAL_AMOUNT,
}: UseUsdcApprovalOptions): UseUsdcApprovalReturn {
    const [status, setStatus] = useState<ApprovalStatus | null>(null);
    const [balance, setBalance] = useState<{ balance: bigint; formatted: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
    const [error, setError] = useState<Error | null>(null);

    // Fetch current approval status and balance
    const refresh = useCallback(async () => {
        if (!userAddress) {
            setStatus(null);
            setBalance(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [approvalStatus, usdcBalance] = await Promise.all([
                checkAllowance(publicClient, network, userAddress),
                getUsdcBalance(publicClient, network, userAddress),
            ]);

            setStatus(approvalStatus);
            setBalance(usdcBalance);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to check approval'));
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, network, userAddress]);

    // Auto-fetch on mount and when dependencies change
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Approve USDC
    const approve = useCallback(async () => {
        if (!walletClient) {
            setError(new Error('Wallet client required'));
            return;
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await approveUsdc(
                walletClient,
                publicClient,
                network,
                approvalAmount
            );

            setTxState({ status: 'success', hash: result.hash });

            // Refresh status after successful transaction
            await refresh();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Transaction failed');
            setError(error);
            setTxState({ status: 'error', error });
        }
    }, [walletClient, publicClient, network, approvalAmount, refresh]);

    // Revoke approval
    const revoke = useCallback(async () => {
        if (!walletClient) {
            setError(new Error('Wallet client required'));
            return;
        }

        setTxState({ status: 'pending' });
        setError(null);

        try {
            const result = await revokeUsdcApproval(walletClient, publicClient, network);

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
        balance,
        isLoading,
        txState,
        approve,
        revoke,
        refresh,
        error,
    };
}
