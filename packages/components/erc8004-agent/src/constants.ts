import type { Address } from 'viem';
import { arbitrum, arbitrumSepolia } from 'viem/chains';

/**
 * Import the full ERC-8004 Registry ABI
 */
export { REGISTRY_ABI } from './abi';

/**
 * Supported networks for ERC-8004 Agent Registry
 */
export type SupportedNetwork = 'arbitrum' | 'arbitrum-sepolia';

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS: Record<SupportedNetwork, number> = {
    'arbitrum': arbitrum.id,
    'arbitrum-sepolia': arbitrumSepolia.id,
};

/**
 * Chain configurations
 */
export const CHAINS: Record<SupportedNetwork, typeof arbitrum | typeof arbitrumSepolia> = {
    'arbitrum': arbitrum,
    'arbitrum-sepolia': arbitrumSepolia,
};

/**
 * ERC-8004 Registry contract addresses
 *
 * Note: These are placeholder addresses. Replace with actual deployed contract addresses.
 */
export const REGISTRY_CONTRACTS: Record<SupportedNetwork, Address> = {
    'arbitrum': '0x0000000000000000000000000000000000000000' as Address, // TODO: Replace with mainnet address
    'arbitrum-sepolia': '0x517De4c9Afa737A46Dcba61e1548AB3807963094' as Address, // TODO: Replace with testnet address
};

/**
 * Default capabilities for agents
 */
export const DEFAULT_CAPABILITIES = [
    'text-generation',
] as const;

/**
 * Available agent capabilities
 */
export const AGENT_CAPABILITIES = [
    'text-generation',
    'image-generation',
    'code-execution',
    'web-search',
    'data-analysis',
    'custom',
] as const;

/**
 * OpenRouter model identifiers
 * Users can also use any model available on OpenRouter by specifying the model name
 * See: https://openrouter.ai/models
 */
export const OPENROUTER_MODELS = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.1-70b-instruct',
] as const;

/**
 * Default model for new agents
 */
export const DEFAULT_MODEL = 'openai/gpt-4o' as const;

/**
 * Default stake amount in wei (0.01 ETH)
 */
export const DEFAULT_STAKE_AMOUNT = 10000000000000000n; // 0.01 ETH
