/**
 * Ostium One-Click Trading Types
 */

import type { Address, Hash } from 'viem';
import type { SupportedNetwork } from './constants';

/**
 * Status of a delegation
 */
export interface DelegationStatus {
    isDelegated: boolean;
    delegateAddress: Address | null;
}

/**
 * Status of USDC approval
 */
export interface ApprovalStatus {
    hasApproval: boolean;
    currentAllowance: bigint;
    formattedAllowance: string;
}

/**
 * Combined status for one-click trading setup
 */
export interface OneClickTradingStatus {
    delegation: DelegationStatus;
    approval: ApprovalStatus;
    isReady: boolean;
}

/**
 * Transaction result
 */
export interface TransactionResult {
    hash: Hash;
    success: boolean;
}

/**
 * Configuration for Ostium one-click trading
 */
export interface OstiumConfig {
    network: SupportedNetwork;
    delegateAddress?: Address;
    approvalAmount?: bigint;
}

/**
 * Hook state for async operations
 */
export type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

/**
 * Transaction state
 */
export type TransactionState =
    | { status: 'idle' }
    | { status: 'pending' }
    | { status: 'confirming'; hash: Hash }
    | { status: 'success'; hash: Hash }
    | { status: 'error'; error: Error };
