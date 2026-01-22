/**
 * Supported networks for Onchain Activity
 */
export type SupportedNetwork = 'arbitrum' | 'arbitrum-sepolia';

/**
 * Transaction category types
 */
export type TransactionCategory = 'erc20' | 'erc721' | 'erc1155' | 'external';

/**
 * Transaction limit options
 */
export type TransactionLimit = '5' | '10' | '15' | '20' | 'custom';

/**
 * Token metadata from Alchemy
 */
export interface TokenMetadata {
    name: string | null;
    symbol: string | null;
    decimals: number | null;
    logo: string | null;
}

/**
 * Asset transfer from Alchemy getAssetTransfers
 */
export interface AssetTransfer {
    blockNum: string;
    hash: string;
    from: string;
    to: string | null;
    value: number | null;
    erc721TokenId: string | null;
    erc1155Metadata: Array<{ tokenId: string; value: string }> | null;
    asset: string | null;
    category: TransactionCategory;
    rawContract: {
        value: string | null;
        address: string | null;
        decimal: string | null;
    };
    metadata: {
        blockTimestamp: string;
    };
}

/**
 * Response from Alchemy getAssetTransfers
 */
export interface AssetTransfersResponse {
    transfers: AssetTransfer[];
    pageKey?: string;
}

/**
 * Options for fetching onchain activity
 */
export interface OnchainActivityOptions {
    /** Wallet address to fetch activity for */
    address: string;
    /** Network to fetch from */
    network: SupportedNetwork;
    /** Number of transactions to fetch (can be preset value or custom number) */
    limit: number;
    /** Transaction categories to include */
    categories: TransactionCategory[];
    /** Alchemy API key */
    apiKey: string;
}

/**
 * Onchain activity result
 */
export interface OnchainActivityResult {
    address: string;
    network: SupportedNetwork;
    transfers: AssetTransfer[];
    totalCount: number;
    fetchedAt: string;
}

/**
 * Async state for React hooks
 */
export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Config for the Onchain Activity node
 */
export interface OnchainActivityConfig {
    label?: string;
    description?: string;
    network: SupportedNetwork;
    transactionLimit: TransactionLimit;
    customLimit?: number;
    categories: TransactionCategory[];
}
