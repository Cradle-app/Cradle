/**
 * @cradle/ostium-onect
 *
 * Ostium One-Click Trading Integration
 * Provides utilities for delegation and USDC approval on Ostium
 *
 * @example
 * ```tsx
 * import { useDelegation, useUsdcApproval, CONTRACTS } from '@cradle/ostium-onect';
 *
 * function OneClickSetup() {
 *   const delegation = useDelegation({ publicClient, walletClient, network: 'arbitrum', userAddress });
 *   const approval = useUsdcApproval({ publicClient, walletClient, network: 'arbitrum', userAddress });
 *
 *   return (
 *     <div>
 *       <button onClick={delegation.enable} disabled={delegation.txState.status === 'pending'}>
 *         Enable Delegation
 *       </button>
 *       <button onClick={approval.approve} disabled={approval.txState.status === 'pending'}>
 *         Approve USDC
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

// Constants
export {
    CHAIN_IDS,
    CONTRACTS,
    TRADING_ABI,
    ERC20_ABI,
    USDC_DECIMALS,
    DEFAULT_APPROVAL_AMOUNT,
    MAX_UINT256,
    type SupportedNetwork,
} from './constants';

// Types
export type {
    DelegationStatus,
    ApprovalStatus,
    OneClickTradingStatus,
    TransactionResult,
    OstiumConfig,
    AsyncState,
    TransactionState,
} from './types';

// Core functions
export {
    checkDelegation,
    enableDelegation,
    removeDelegation,
} from './delegation';

export {
    checkAllowance,
    getUsdcBalance,
    approveUsdc,
    revokeUsdcApproval,
} from './approval';

// React Hooks
export {
    useDelegation,
    useUsdcApproval,
    type UseDelegationOptions,
    type UseDelegationReturn,
    type UseUsdcApprovalOptions,
    type UseUsdcApprovalReturn,
} from './hooks';
