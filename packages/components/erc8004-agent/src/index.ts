/**
 * @cradle/erc8004-agent
 *
 * ERC-8004 Agent Registry Integration
 * Provides utilities for on-chain agent registration and management
 *
 * @example
 * ```tsx
 * import { useAgentRegistry, REGISTRY_CONTRACTS, CHAIN_IDS } from '@cradle/erc8004-agent';
 *
 * function AgentSetup() {
 *   const registry = useAgentRegistry({
 *     publicClient,
 *     walletClient,
 *     network: 'arbitrum',
 *     userAddress,
 *   });
 *
 *   const handleRegister = async () => {
 *     await registry.register({
 *       name: 'MyAgent',
 *       version: '0.1.0',
 *       capabilities: ['text-generation'],
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {registry.status?.isRegistered ? (
 *         <p>Agent registered: {registry.status.agentInfo?.name}</p>
 *       ) : (
 *         <button onClick={handleRegister} disabled={registry.txState.status === 'pending'}>
 *           Register Agent
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

export {
    CHAIN_IDS,
    CHAINS,
    REGISTRY_CONTRACTS,
    REGISTRY_ABI,
    DEFAULT_CAPABILITIES,
    AGENT_CAPABILITIES,
    OPENROUTER_MODELS,
    DEFAULT_MODEL,
    DEFAULT_STAKE_AMOUNT,
    type SupportedNetwork,
} from './constants';

export type {
    AgentCapability,
    OpenRouterModel,
    AgentMetadata,
    RegistryAgentInfo,
    RegistrationStatus,
    TransactionState,
    TransactionResult,
    AsyncState,
    RegistryConfig,
    UseAgentRegistryOptions,
    UseAgentRegistryReturn,
    AgentFormConfig,
} from './types';

export {
    checkRegistration,
    registerAgent,
    updateAgentCapabilities,
    addAgentStake,
    withdrawAgentStake,
    deactivateAgent,
    reactivateAgent,
    getAgentStake,
} from './registry';

export {
    useAgentRegistry,
} from './hooks';

export {
    OpenRouterClient,
    createOpenRouterClient,
    type OpenRouterConfig,
    type ChatMessage,
    type ChatOptions,
    type ChatResponse,
} from './openrouter-client';
