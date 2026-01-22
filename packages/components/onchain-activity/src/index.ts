/**
 * @cradle/onchain-activity
 *
 * Onchain Activity Integration
 * Fetch wallet transactions and activities from Arbitrum by category
 *
 * @example
 * ```tsx
 * import { useOnchainActivity, CATEGORY_LABELS } from '@cradle/onchain-activity';
 *
 * function WalletActivity() {
 *   const { data, loading, error, fetchActivity } = useOnchainActivity({
 *     network: 'arbitrum',
 *     limit: '10',
 *     categories: ['erc20', 'erc721'],
 *     apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY!,
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => fetchActivity('0x...')}>
 *         Fetch Activity
 *       </button>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       {data?.transfers.map((tx) => (
 *         <div key={tx.hash}>
 *           {tx.category}: {tx.value} {tx.asset}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

// Constants
export {
    CHAIN_IDS,
    ALCHEMY_BASE_URLS,
    ALCHEMY_CATEGORY_MAP,
    DEFAULT_LIMIT,
    LIMIT_OPTIONS,
    LIMIT_LABELS,
    ALL_CATEGORIES,
    CATEGORY_LABELS,
} from './constants';

// Types
export type {
    SupportedNetwork,
    TransactionCategory,
    TransactionLimit,
    TokenMetadata,
    AssetTransfer,
    AssetTransfersResponse,
    OnchainActivityOptions,
    OnchainActivityResult,
    AsyncState,
    OnchainActivityConfig,
} from './types';

// API functions
export {
    getOnchainActivity,
    getCategoryDisplayName,
    formatTransferValue,
    shortenAddress,
} from './api';

// React Hooks
export {
    useOnchainActivity,
    type UseOnchainActivityOptions,
    type UseOnchainActivityReturn,
} from './hooks';
