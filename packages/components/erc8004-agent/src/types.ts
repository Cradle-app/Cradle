import type { Address, Hash } from 'viem';
import type { AGENT_CAPABILITIES, OPENROUTER_MODELS, SupportedNetwork } from './constants';

/**
 * Agent capability type
 */
export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];

/**
 * OpenRouter model type
 */
export type OpenRouterModel = (typeof OPENROUTER_MODELS)[number] | string;

/**
 * Agent metadata stored on-chain
 */
export interface AgentMetadata {
    name: string;
    version: string;
    capabilities: AgentCapability[];
    selectedModel?: OpenRouterModel;
}

/**
 * Agent information from the registry
 */
export interface RegistryAgentInfo {
    agentId: Hash;
    owner: Address;
    name: string;
    version: string;
    capabilities: string[];
    stake: bigint;
    reputation: bigint;
    isActive: boolean;
    registeredAt: bigint;
}

/**
 * Registration status
 */
export interface RegistrationStatus {
    isRegistered: boolean;
    agentInfo?: RegistryAgentInfo;
}

/**
 * Transaction state for async operations
 */
export type TransactionState =
    | { status: 'idle' }
    | { status: 'pending'; hash?: Hash }
    | { status: 'success'; hash: Hash }
    | { status: 'error'; error: Error };

/**
 * Transaction result
 */
export interface TransactionResult {
    hash: Hash;
    agentId?: Hash;
}

/**
 * Async operation state
 */
export interface AsyncState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Configuration for registry operations
 */
export interface RegistryConfig {
    network: SupportedNetwork;
    registryAddress?: Address;
}

/**
 * Options for the useAgentRegistry hook
 */
export interface UseAgentRegistryOptions {
    publicClient: unknown; // PublicClient from viem
    walletClient?: unknown; // WalletClient from viem
    network: SupportedNetwork;
    userAddress?: Address;
    registryAddress?: Address;
}

/**
 * Return type for the useAgentRegistry hook
 */
export interface UseAgentRegistryReturn {
    // Status
    status: RegistrationStatus | null;
    isLoading: boolean;
    error: Error | null;

    // Transaction state
    txState: TransactionState;

    // Actions
    register: (metadata: AgentMetadata, stakeAmount?: bigint) => Promise<TransactionResult>;
    updateCapabilities: (capabilities: AgentCapability[]) => Promise<TransactionResult>;
    addStake: (amount: bigint) => Promise<TransactionResult>;
    withdrawStake: (amount: bigint) => Promise<TransactionResult>;
    deactivate: () => Promise<TransactionResult>;
    reactivate: () => Promise<TransactionResult>;

    // Refresh
    refetch: () => Promise<void>;
}

/**
 * Agent configuration from the form
 */
export interface AgentFormConfig {
    agentName: string;
    agentVersion: string;
    capabilities: AgentCapability[];
    selectedModel: OpenRouterModel;
    registryIntegration: boolean;
    stakeAmount?: string;
    isRegistered?: boolean;
    agentId?: string;
    rateLimit: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
}
