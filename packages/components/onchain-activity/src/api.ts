import type {
    OnchainActivityOptions,
    OnchainActivityResult,
    AssetTransfersResponse,
    TransactionCategory,
} from './types';
import { ALCHEMY_BASE_URLS, ALCHEMY_CATEGORY_MAP } from './constants';

/**
 * Fetch onchain activity for a wallet address using Alchemy's getAssetTransfers API
 * 
 * @param options - Configuration for the activity fetch
 * @returns Promise resolving to the activity result
 * 
 * @example
 * ```ts
 * const activity = await getOnchainActivity({
 *   address: '0x...',
 *   network: 'arbitrum',
 *   limit: '10',
 *   categories: ['erc20', 'erc721'],
 *   apiKey: process.env.ALCHEMY_API_KEY!,
 * });
 * console.log(activity.transfers);
 * ```
 */
export async function getOnchainActivity(
    options: OnchainActivityOptions
): Promise<OnchainActivityResult> {
    const { address, network, limit, categories, apiKey } = options;

    const baseUrl = ALCHEMY_BASE_URLS[network];
    const url = `${baseUrl}/${apiKey}`;

    // Convert our categories to Alchemy category strings
    const alchemyCategories = categories.map(cat => ALCHEMY_CATEGORY_MAP[cat]);

    const requestBody = {
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [
            {
                fromAddress: address,
                category: alchemyCategories,
                maxCount: `0x${limit.toString(16)}`,
                order: 'desc',
                withMetadata: true,
            },
        ],
    };

    // Fetch outgoing transfers
    const outgoingResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!outgoingResponse.ok) {
        throw new Error(`Alchemy API error: ${outgoingResponse.status} ${outgoingResponse.statusText}`);
    }

    const outgoingData = await outgoingResponse.json();

    if (outgoingData.error) {
        throw new Error(`Alchemy API error: ${outgoingData.error.message}`);
    }

    const outgoingTransfers: AssetTransfersResponse = outgoingData.result;

    // Fetch incoming transfers
    const incomingRequestBody = {
        id: 2,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [
            {
                toAddress: address,
                category: alchemyCategories,
                maxCount: `0x${limit.toString(16)}`,
                order: 'desc',
                withMetadata: true,
            },
        ],
    };

    const incomingResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomingRequestBody),
    });

    if (!incomingResponse.ok) {
        throw new Error(`Alchemy API error: ${incomingResponse.status} ${incomingResponse.statusText}`);
    }

    const incomingData = await incomingResponse.json();

    if (incomingData.error) {
        throw new Error(`Alchemy API error: ${incomingData.error.message}`);
    }

    const incomingTransfers: AssetTransfersResponse = incomingData.result;

    // Merge and sort transfers by block timestamp (descending)
    const allTransfers = [...outgoingTransfers.transfers, ...incomingTransfers.transfers]
        .sort((a, b) => {
            const timeA = new Date(a.metadata.blockTimestamp).getTime();
            const timeB = new Date(b.metadata.blockTimestamp).getTime();
            return timeB - timeA;
        })
        .slice(0, limit);

    return {
        address,
        network,
        transfers: allTransfers,
        totalCount: allTransfers.length,
        fetchedAt: new Date().toISOString(),
    };
}

/**
 * Get the display name for a transaction category
 */
export function getCategoryDisplayName(category: TransactionCategory): string {
    const names: Record<TransactionCategory, string> = {
        'erc20': 'ERC-20 Transfer',
        'erc721': 'NFT Transfer',
        'erc1155': 'Multi-Token Transfer',
        'external': 'Contract Interaction',
    };
    return names[category];
}

/**
 * Format a transfer value for display
 */
export function formatTransferValue(
    value: number | null,
    decimals: string | null,
    symbol: string | null
): string {
    if (value === null) return '—';

    const formatted = value.toLocaleString(undefined, {
        maximumFractionDigits: 6,
    });

    return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Shorten an address for display
 */
export function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
