import { useState, useCallback } from 'react';
import type {
    SupportedNetwork,
    TransactionCategory,
    TransactionLimit,
    OnchainActivityResult,
    AsyncState,
} from '../types';
import { getOnchainActivity } from '../api';

/**
 * Options for the useOnchainActivity hook
 */
export interface UseOnchainActivityOptions {
    /** Network to fetch from */
    network: SupportedNetwork;
    /** Preset limit option or 'custom' */
    limit: TransactionLimit;
    /** Custom limit value (used when limit is 'custom') */
    customLimit?: number;
    /** Transaction categories to include */
    categories: TransactionCategory[];
    /** Alchemy API key */
    apiKey: string;
}

/**
 * Return type for the useOnchainActivity hook
 */
export interface UseOnchainActivityReturn extends AsyncState<OnchainActivityResult> {
    /** Fetch activity for the given address */
    fetchActivity: (address: string) => Promise<void>;
    /** Reset the state */
    reset: () => void;
}

/**
 * React hook for fetching onchain activity
 * 
 * @param options - Configuration options
 * @returns Object with activity data, loading state, error, and fetch function
 * 
 * @example
 * ```tsx
 * function ActivityComponent() {
 *   const { data, loading, error, fetchActivity } = useOnchainActivity({
 *     network: 'arbitrum',
 *     limit: '10',
 *     categories: ['erc20', 'erc721'],
 *     apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY!,
 *   });
 *   
 *   return (
 *     <div>
 *       <input
 *         placeholder="Enter wallet address"
 *         onKeyDown={(e) => {
 *           if (e.key === 'Enter') fetchActivity(e.currentTarget.value);
 *         }}
 *       />
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       {data && (
 *         <ul>
 *           {data.transfers.map((tx) => (
 *             <li key={tx.hash}>{tx.category}: {tx.value}</li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnchainActivity(
    options: UseOnchainActivityOptions
): UseOnchainActivityReturn {
    const { network, limit, customLimit, categories, apiKey } = options;

    // Compute the actual numeric limit
    const numericLimit = limit === 'custom' && customLimit ? customLimit : parseInt(limit, 10);

    const [data, setData] = useState<OnchainActivityResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchActivity = useCallback(async (address: string) => {
        if (!address) {
            setError(new Error('Wallet address is required'));
            return;
        }

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            setError(new Error('Invalid wallet address format'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getOnchainActivity({
                address,
                network,
                limit: numericLimit,
                categories,
                apiKey,
            });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error occurred'));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [network, numericLimit, categories, apiKey]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        fetchActivity,
        reset,
    };
}
