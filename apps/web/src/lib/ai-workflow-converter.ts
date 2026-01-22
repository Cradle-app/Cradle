import type { BlueprintNode } from '@dapp-forge/blueprint-schema';

// Map AI tool types to our in-app node types
const toolTypeMap: Record<string, string> = {
  // Contracts
  'stylus_contract': 'stylus-contract',
  'stylus_zk_contract': 'stylus-zk-contract',
  'eip7702_smart_eoa': 'eip7702-smart-eoa',
  'zk_primitives': 'zk-primitives',
  // Payments
  'x402_paywall': 'x402-paywall-api',
  'paywall': 'x402-paywall-api',
  // Agents
  'erc8004_agent': 'erc8004-agent-runtime',
  'ai_agent': 'erc8004-agent-runtime',
  'ostium_trading': 'ostium-trading',
  'maxxit_lazy_trader': 'maxxit',
  'maxxit_trader': 'maxxit',
  'maxxit': 'maxxit',
  'onchain_activity': 'onchain-activity',
  // App
  'wallet_auth': 'wallet-auth',
  'rpc_provider': 'rpc-provider',
  'arbitrum_bridge': 'arbitrum-bridge',
  'chain_data': 'chain-data',
  'ipfs_storage': 'ipfs-storage',
  'chain_abstraction': 'chain-abstraction',
  'frontend': 'frontend-scaffold',
  'frontend_scaffold': 'frontend-scaffold',
  'sdk_generator': 'sdk-generator',
  // Telegram
  'telegram_notifications': 'telegram-notifications',
  'telegram_commands': 'telegram-commands',
  'telegram_ai_agent': 'telegram-ai-agent',
  'telegram_wallet_link': 'telegram-wallet-link',
  // Quality
  'quality_gates': 'repo-quality-gates',
  'repo_quality_gates': 'repo-quality-gates',
  // AIXBT Intelligence
  'aixbt_momentum': 'aixbt-momentum',
  'aixbt_signals': 'aixbt-signals',
  'aixbt_indigo': 'aixbt-indigo',
  'aixbt_observer': 'aixbt-observer',
};

// Valid node types in our system
const validNodeTypes = [
  'stylus-contract',
  'stylus-zk-contract',
  'eip7702-smart-eoa',
  'zk-primitives',
  'x402-paywall-api',
  'erc8004-agent-runtime',
  'ostium-trading',
  'maxxit',
  'onchain-activity',
  'wallet-auth',
  'rpc-provider',
  'arbitrum-bridge',
  'chain-data',
  'ipfs-storage',
  'chain-abstraction',
  'frontend-scaffold',
  'sdk-generator',
  'telegram-notifications',
  'telegram-commands',
  'telegram-ai-agent',
  'telegram-wallet-link',
  'repo-quality-gates',
  'aixbt-momentum',
  'aixbt-signals',
  'aixbt-indigo',
  'aixbt-observer',
];

// Default node configs matching the blueprint store
const DEFAULT_NODE_CONFIGS: Record<string, Record<string, unknown>> = {
  'stylus-contract': {
    contractName: 'MyContract',
    contractType: 'custom',
    features: ['ownable'],
    testCoverage: true,
  },
  'stylus-zk-contract': {
    contractName: 'MyZKToken',
    contractType: 'erc721',
    zkCircuitType: 'balance-proof',
    minBalance: '1000000000000000000',
    oracleEnabled: true,
    nullifierEnabled: true,
    testCoverage: true,
  },
  'x402-paywall-api': {
    resourcePath: '/api/premium/resource',
    priceInWei: '1000000000000000',
    currency: 'ETH',
    paymentTimeout: 300,
    receiptValidation: true,
    openApiSpec: true,
  },
  'erc8004-agent-runtime': {
    agentName: 'MyAgent',
    agentVersion: '0.1.0',
    capabilities: ['text-generation'],
    registryIntegration: true,
    modelProvider: 'openai',
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    },
  },
  'repo-quality-gates': {
    ciProvider: 'github-actions',
    testFramework: 'vitest',
    linter: 'biome',
    formatter: 'biome',
    typecheck: true,
    preCommitHooks: true,
    coverageThreshold: 80,
    securityScanning: true,
    dependencyAudit: true,
  },
  'frontend-scaffold': {
    framework: 'nextjs',
    styling: 'tailwind',
    web3Provider: 'wagmi',
    walletConnect: true,
    rainbowKit: true,
  },
  'sdk-generator': {
    outputFormat: 'typescript',
    includeABI: true,
    includeTypes: true,
    includeHooks: true,
  },
  'eip7702-smart-eoa': {
    delegateName: 'BatchExecutor',
    delegateType: 'batch-executor',
    features: ['batch-calls', 'sponsored-tx'],
    securityWarnings: true,
    generateUI: true,
  },
  'wallet-auth': {
    provider: 'rainbowkit',
    walletConnectEnabled: true,
    siweEnabled: true,
    socialLogins: [],
    sessionPersistence: true,
  },
  'rpc-provider': {
    primaryProvider: 'alchemy',
    fallbackProviders: ['public'],
    enableWebSocket: true,
    healthCheckInterval: 30000,
    retryAttempts: 3,
    privacyMode: false,
  },
  'arbitrum-bridge': {
    supportedTokens: ['ETH'],
    enableERC20: true,
    enableMessaging: false,
    generateUI: true,
    targetNetwork: 'arbitrum',
  },
  'chain-data': {
    provider: 'alchemy',
    features: ['token-balances', 'nft-data'],
    cacheEnabled: true,
    cacheDuration: 60000,
  },
  'ipfs-storage': {
    provider: 'pinata',
    generateMetadataSchemas: true,
    generateUI: true,
  },
  'chain-abstraction': {
    supportedChains: ['arbitrum', 'ethereum'],
    unifiedBalanceEnabled: true,
    autoChainSwitch: true,
    gasPaymentToken: 'native',
  },
  'zk-primitives': {
    proofTypes: ['membership'],
    clientSideProving: true,
    generateVerifiers: true,
  },
  'ostium-trading': {
    tradingPair: 'ETH/USD',
    leverage: 10,
    enableOneClick: true,
  },
  'maxxit': {},
  'onchain-activity': {
    network: 'arbitrum',
    transactionLimit: '10',
    categories: ['erc20', 'external'],
  },
  'telegram-notifications': {
    webhookEnabled: true,
    notificationTypes: ['transaction', 'price-alert'],
  },
  'telegram-commands': {
    commands: ['/start', '/help', '/balance'],
    webhookEnabled: true,
  },
  'telegram-ai-agent': {
    modelProvider: 'openai',
    personality: 'helpful',
    contextMemory: true,
  },
  'telegram-wallet-link': {
    verificationMethod: 'signature',
    multiWallet: false,
  },
  'aixbt-momentum': {
    projectId: 'bitcoin',
    interval: '24h',
    includeHistoricalData: true,
    trackClusterConvergence: true,
  },
  'aixbt-signals': {
    categories: ['LISTING', 'FUNDING', 'PARTNERSHIP'],
    minConvictionScore: 0.7,
    limit: 20,
  },
  'aixbt-indigo': {
    model: 'indigo-mini',
    systemPrompt: 'You are a professional market researcher provided by AIXBT.',
    outputFormat: 'markdown',
    useX402Paywall: true,
  },
  'aixbt-observer': {
    network: 'arbitrum',
    watchWallets: [],
    alertOnMomentumDrop: true,
    alertOnNegativeSignal: true,
  },
};

// Generate proper UUIDs
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface AITool {
  id: string;
  type: string;
  name: string;
  next_tools: string[];
}

export interface AIResponse {
  agent_id?: string;
  tools: AITool[];
  has_sequential_execution?: boolean;
  description: string;
  raw_response?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
}

/**
 * Convert AI response format to workflow nodes and edges
 */
export function aiResponseToWorkflow(aiResponse: AIResponse): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  blueprintNodes: BlueprintNode[];
} {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  const blueprintNodes: BlueprintNode[] = [];

  // Create a map of AI tool IDs to our node IDs
  const toolIdToNodeId = new Map<string, string>();

  // Create nodes with proper positioning
  aiResponse.tools.forEach((tool, index) => {
    // Map AI tool type to our tool type
    const normalizedType = tool.type.toLowerCase().replace(/-/g, '_');
    const ourNodeType = toolTypeMap[normalizedType] || tool.type.replace(/_/g, '-');

    // Check if this tool type exists in our system
    if (!validNodeTypes.includes(ourNodeType)) {
      console.warn(`Unknown tool type from AI: ${tool.type} (mapped to: ${ourNodeType})`);
      return;
    }

    const nodeId = generateUUID();
    toolIdToNodeId.set(tool.id, nodeId);

    // Position nodes in a grid layout
    const row = Math.floor(index / 3);
    const col = index % 3;
    const position = {
      x: col * 320 + 150,
      y: row * 200 + 120,
    };

    // Get default config for this node type
    const config = DEFAULT_NODE_CONFIGS[ourNodeType] || {};

    // Create ReactFlow node
    const node: WorkflowNode = {
      id: nodeId,
      type: ourNodeType,
      position,
      data: {
        ...config,
        nodeType: ourNodeType,
        label: tool.name || ourNodeType,
      },
    };

    // Create Blueprint node
    const blueprintNode: BlueprintNode = {
      id: nodeId,
      type: ourNodeType as BlueprintNode['type'],
      position,
      config,
    };

    nodes.push(node);
    blueprintNodes.push(blueprintNode);
  });

  // Create edges based on next_tools relationships
  aiResponse.tools.forEach((tool) => {
    const sourceNodeId = toolIdToNodeId.get(tool.id);
    if (!sourceNodeId) return;

    tool.next_tools.forEach((nextToolId) => {
      const targetNodeId = toolIdToNodeId.get(nextToolId);
      if (targetNodeId) {
        edges.push({
          id: generateUUID(),
          source: sourceNodeId,
          target: targetNodeId,
          type: 'default',
          animated: true,
        });
      }
    });
  });

  return { nodes, edges, blueprintNodes };
}

/**
 * Check if a response is a valid AI workflow response
 */
export function isValidAIWorkflowResponse(data: unknown): data is AIResponse {
  if (!data || typeof data !== 'object') return false;

  const response = data as Record<string, unknown>;

  return (
    Array.isArray(response.tools) &&
    response.tools.length > 0 &&
    response.tools.every(
      (tool: unknown) => {
        if (!tool || typeof tool !== 'object') return false;
        const t = tool as Record<string, unknown>;
        return (
          typeof t.id === 'string' &&
          typeof t.type === 'string' &&
          Array.isArray(t.next_tools)
        );
      }
    )
  );
}

/**
 * Get available node types for AI prompt context
 */
export function getAvailableNodeTypesContext(): string {
  return `
Available components for building Web3 applications on Arbitrum:

CONTRACTS:
- stylus_contract: Rust/WASM smart contract for Arbitrum Stylus
- stylus_zk_contract: Privacy-preserving contract with ZK proofs
- eip7702_smart_eoa: EIP-7702 Smart EOA delegation (trending)
- zk_primitives: Privacy proofs (membership, range, semaphore)

PAYMENTS:
- x402_paywall: HTTP 402 payment endpoint for monetization

AGENTS:
- erc8004_agent: AI agent with on-chain registry (ERC-8004)
- ostium_trading: One-click trading setup for Ostium
- maxxit_lazy_trader: Maxxit Lazy Trader API integration
- onchain_activity: Fetch wallet transactions by category

APP:
- wallet_auth: WalletConnect, social login, SIWE authentication
- rpc_provider: Multi-provider RPC with failover
- arbitrum_bridge: L1-L2 bridging with Arbitrum SDK
- chain_data: Token/NFT data with Alchemy/Moralis
- ipfs_storage: Decentralized storage (Pinata/Web3.Storage)
- chain_abstraction: Unified multi-chain UX
- frontend_scaffold: Next.js/React frontend scaffold
- sdk_generator: TypeScript SDK from ABIs

TELEGRAM:
- telegram_notifications: Trigger alerts and updates
- telegram_commands: Handle interactive commands
- telegram_ai_agent: Conversational AI bot with LLM
- telegram_wallet_link: Link Telegram profiles with wallets

QUALITY:
- quality_gates: CI/CD, testing, linting setup
`.trim();
}
