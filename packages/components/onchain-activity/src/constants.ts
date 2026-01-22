import type { SupportedNetwork, TransactionCategory } from './types';

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS: Record<SupportedNetwork, number> = {
    'arbitrum': 42161,
    'arbitrum-sepolia': 421614,
};

/**
 * Alchemy API base URLs per network
 */
export const ALCHEMY_BASE_URLS: Record<SupportedNetwork, string> = {
    'arbitrum': 'https://arb-mainnet.g.alchemy.com/v2',
    'arbitrum-sepolia': 'https://arb-sepolia.g.alchemy.com/v2',
};

/**
 * Map TransactionCategory to Alchemy category strings
 */
export const ALCHEMY_CATEGORY_MAP: Record<TransactionCategory, string> = {
    'erc20': 'erc20',
    'erc721': 'erc721',
    'erc1155': 'erc1155',
    'external': 'external',
};

/**
 * Default transaction limit
 */
export const DEFAULT_LIMIT = '10';

/**
 * Available transaction limit options
 */
export const LIMIT_OPTIONS = ['5', '10', '15', '20', 'custom'] as const;

/**
 * Human-readable limit labels
 */
export const LIMIT_LABELS: Record<string, string> = {
    '5': '5 transactions',
    '10': '10 transactions',
    '15': '15 transactions',
    '20': '20 transactions',
    'custom': 'Custom amount',
};

/**
 * All available transaction categories
 */
export const ALL_CATEGORIES: TransactionCategory[] = ['erc20', 'erc721', 'erc1155', 'external'];

/**
 * Human-readable category labels
 */
export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
    'erc20': 'ERC-20 Tokens',
    'erc721': 'NFTs (ERC-721)',
    'erc1155': 'Multi-tokens (ERC-1155)',
    'external': 'Contract Interactions',
};
