import { create } from 'zustand';
import type {
  Blueprint,
  BlueprintNode,
  BlueprintEdge,
  BlueprintConfig,
} from '@dapp-forge/blueprint-schema';

// Generate proper UUIDs for blueprint schema validation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface BlueprintState {
  blueprint: Blueprint;
  selectedNodeId: string | null;

  // Node operations
  addNode: (type: string, position: { x: number; y: number }) => BlueprintNode;
  updateNode: (nodeId: string, updates: Partial<BlueprintNode>) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  removeNode: (nodeId: string) => void;

  // Edge operations
  addEdge: (source: string, target: string) => BlueprintEdge | null;
  removeEdge: (edgeId: string) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // Blueprint operations
  updateConfig: (config: Partial<BlueprintConfig>) => void;
  exportBlueprint: () => string;
  importBlueprint: (json: string) => void;
  resetBlueprint: () => void;
}

const DEFAULT_NODE_CONFIGS: Record<string, Record<string, unknown>> = {
  // Original nodes
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
  // New Arbitrum-focused nodes
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
  'onchain-activity': {
    network: 'arbitrum',
    transactionLimit: '10',
    categories: ['erc20', 'external'],
  },
  'ostium-trading': {
    tradingPair: 'ETH/USD',
    leverage: 10,
    enableOneClick: true,
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

const createInitialBlueprint = (): Blueprint => ({
  id: generateUUID(),
  version: '1.0.0',
  nodes: [],
  edges: [],
  config: {
    project: {
      name: 'My Dapp',
      description: 'A Web3 application - foundation built with Cradle',
      version: '0.1.0',
      license: 'MIT',
      keywords: ['web3', 'dapp'],
    },
    network: {
      chainId: 421614,
      name: 'Arbitrum Sepolia',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      isTestnet: true,
    },
    generateDocs: true,
    deployOnGenerate: false,
  },
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: createInitialBlueprint(),
  selectedNodeId: null,

  addNode: (type, position) => {
    const node: BlueprintNode = {
      id: generateUUID(),
      type: type as BlueprintNode['type'],
      position,
      config: DEFAULT_NODE_CONFIGS[type] || {},
    };

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: [...state.blueprint.nodes, node],
        updatedAt: new Date().toISOString(),
      },
    }));

    return node;
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: state.blueprint.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: state.blueprint.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, config: { ...node.config, ...config } }
            : node
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: state.blueprint.nodes.filter((n) => n.id !== nodeId),
        edges: state.blueprint.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
        updatedAt: new Date().toISOString(),
      },
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  addEdge: (source, target) => {
    // Check if edge already exists
    const { blueprint } = get();
    const exists = blueprint.edges.some(
      (e) => e.source === source && e.target === target
    );
    if (exists) return null;

    // Check for self-loop
    if (source === target) return null;

    const edge: BlueprintEdge = {
      id: generateUUID(),
      source,
      target,
      type: 'dependency',
    };

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        edges: [...state.blueprint.edges, edge],
        updatedAt: new Date().toISOString(),
      },
    }));

    return edge;
  },

  removeEdge: (edgeId) => {
    set((state) => ({
      blueprint: {
        ...state.blueprint,
        edges: state.blueprint.edges.filter((e) => e.id !== edgeId),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  updateConfig: (config) => {
    set((state) => ({
      blueprint: {
        ...state.blueprint,
        config: {
          ...state.blueprint.config,
          ...config,
          project: {
            ...state.blueprint.config.project,
            ...(config.project || {}),
          },
          network: {
            ...state.blueprint.config.network,
            ...(config.network || {}),
          },
        },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  exportBlueprint: () => {
    return JSON.stringify(get().blueprint, null, 2);
  },

  importBlueprint: (json) => {
    try {
      const imported = JSON.parse(json);
      set({
        blueprint: {
          ...imported,
          id: imported.id || generateUUID(),
          updatedAt: new Date().toISOString(),
        },
        selectedNodeId: null,
      });
    } catch (error) {
      throw new Error('Invalid blueprint JSON');
    }
  },

  resetBlueprint: () => {
    set({
      blueprint: createInitialBlueprint(),
      selectedNodeId: null,
    });
  },
}));

