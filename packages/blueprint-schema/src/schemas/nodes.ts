import { z } from 'zod';

/**
 * Node categories for the DappForge canvas
 */
export const NodeCategory = z.enum([
  'contracts',    // Stylus/WASM smart contracts
  'payments',     // x402 payment flows
  'agents',       // AI agent runtime + ERC-8004
  'app',          // Frontend/SDK generation
  'quality',      // CI/test/lint/format scaffolding
  'telegram',     // Telegram-specific integrations
  'intelligence', // AIXBT Market Intelligence
]);
export type NodeCategory = z.infer<typeof NodeCategory>;

/**
 * Node types supported by DappForge
 */
export const NodeType = z.enum([
  // Contracts
  'stylus-contract',
  'stylus-zk-contract',
  'eip7702-smart-eoa',
  'zk-primitives',
  'erc20-stylus',
  'erc721-stylus',
  'erc1155-stylus',

  // Payments
  'x402-paywall-api',

  // Agents
  'erc8004-agent-runtime',
  'ostium-trading',
  'maxxit',
  'onchain-activity',

  // App
  'frontend-scaffold',
  'sdk-generator',
  'wallet-auth',
  'rpc-provider',
  'chain-data',
  'ipfs-storage',
  'chain-abstraction',
  'arbitrum-bridge',

  // Telegram
  'telegram-notifications',
  'telegram-commands',
  'telegram-wallet-link',
  'telegram-ai-agent',


  // Quality
  'repo-quality-gates',

  // Intelligence (AIXBT)
  'aixbt-momentum',
  'aixbt-signals',
  'aixbt-indigo',
  'aixbt-observer',
]);
export type NodeType = z.infer<typeof NodeType>;

/**
 * Position on the canvas
 */
export const NodePosition = z.object({
  x: z.number(),
  y: z.number(),
});
export type NodePosition = z.infer<typeof NodePosition>;

/**
 * Base node configuration that all nodes share
 */
export const BaseNodeConfig = z.object({
  label: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});
export type BaseNodeConfig = z.infer<typeof BaseNodeConfig>;

/**
 * Stylus contract node configuration
 */
export const StylusContractConfig = BaseNodeConfig.extend({
  contractName: z.string().min(1).max(64).regex(/^[A-Z][a-zA-Z0-9]*$/),
  contractType: z.enum(['erc20', 'erc721', 'erc1155', 'custom']),
  features: z.array(z.enum([
    'ownable',
    'pausable',
    'upgradeable',
    'access-control',
    'reentrancy-guard',
  ])).default([]),
  customCode: z.string().max(50000).optional(),
  testCoverage: z.boolean().default(true),
});
export type StylusContractConfig = z.infer<typeof StylusContractConfig>;

/**
 * x402 Paywall API node configuration
 */
export const X402PaywallConfig = BaseNodeConfig.extend({
  resourcePath: z.string().regex(/^\/[a-z0-9\-\/{}:]*$/i),
  priceInWei: z.string().regex(/^\d+$/),
  currency: z.enum(['ETH', 'USDC', 'USDT', 'DAI', 'CUSTOM']),
  customTokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  paymentTimeout: z.number().int().min(30).max(3600).default(300),
  receiptValidation: z.boolean().default(true),
  webhookUrl: z.string().url().optional(),
  openApiSpec: z.boolean().default(true),
});
export type X402PaywallConfig = z.infer<typeof X402PaywallConfig>;

/**
 * ERC-8004 Agent Runtime configuration
 */
export const ERC8004AgentConfig = BaseNodeConfig.extend({
  agentName: z.string().min(1).max(64),
  agentVersion: z.string().regex(/^\d+\.\d+\.\d+$/).default('0.1.0'),
  capabilities: z.array(z.enum([
    'text-generation',
    'image-generation',
    'code-execution',
    'web-search',
    'data-analysis',
    'custom',
  ])).min(1),
  registryIntegration: z.boolean().default(true),
  stakeAmount: z.string().regex(/^\d+$/).optional(),
  selectedModel: z.string().default('openai/gpt-4o'),
  rateLimit: z.object({
    requestsPerMinute: z.number().int().min(1).max(1000).default(60),
    tokensPerMinute: z.number().int().min(1000).max(1000000).default(100000),
  }).default({}),
});
export type ERC8004AgentConfig = z.infer<typeof ERC8004AgentConfig>;

/**
 * Stylus ZK Contract configuration
 */
export const StylusZKContractConfig = BaseNodeConfig.extend({
  contractName: z.string().min(1).max(64).regex(/^[A-Z][a-zA-Z0-9]*$/),
  contractType: z.enum(['erc721', 'erc20', 'erc1155']).default('erc721'),
  zkCircuitType: z.enum(['balance-proof', 'ownership-proof', 'custom']).default('balance-proof'),
  minBalance: z.string().regex(/^\d+$/).optional(),
  oracleEnabled: z.boolean().default(true),
  nullifierEnabled: z.boolean().default(true),
  circuitCustomization: z.string().max(10000).optional(),
  testCoverage: z.boolean().default(true),
});
export type StylusZKContractConfig = z.infer<typeof StylusZKContractConfig>;

/**
 * Repository quality gates configuration
 */
export const RepoQualityGatesConfig = BaseNodeConfig.extend({
  ciProvider: z.enum(['github-actions', 'gitlab-ci', 'circleci']).default('github-actions'),
  testFramework: z.enum(['vitest', 'jest', 'mocha']).default('vitest'),
  linter: z.enum(['eslint', 'biome']).default('biome'),
  formatter: z.enum(['prettier', 'biome']).default('biome'),
  typecheck: z.boolean().default(true),
  preCommitHooks: z.boolean().default(true),
  coverageThreshold: z.number().int().min(0).max(100).default(80),
  securityScanning: z.boolean().default(true),
  dependencyAudit: z.boolean().default(true),
});
export type RepoQualityGatesConfig = z.infer<typeof RepoQualityGatesConfig>;

/**
 * Frontend scaffold configuration
 */
export const FrontendScaffoldConfig = BaseNodeConfig.extend({
  framework: z.enum(['nextjs', 'vite-react', 'remix']).default('nextjs'),
  styling: z.enum(['tailwind', 'css-modules', 'styled-components']).default('tailwind'),
  web3Provider: z.enum(['wagmi', 'ethers', 'viem']).default('wagmi'),
  walletConnect: z.boolean().default(true),
  rainbowKit: z.boolean().default(true),
});
export type FrontendScaffoldConfig = z.infer<typeof FrontendScaffoldConfig>;

/**
 * SDK generator configuration
 */
export const SDKGeneratorConfig = BaseNodeConfig.extend({
  outputFormat: z.enum(['typescript', 'javascript']).default('typescript'),
  includeABI: z.boolean().default(true),
  includeTypes: z.boolean().default(true),
  includeHooks: z.boolean().default(true),
  packageName: z.string().regex(/^@?[a-z0-9\-\/]+$/).optional(),
});
export type SDKGeneratorConfig = z.infer<typeof SDKGeneratorConfig>;

/**
 * EIP-7702 Smart EOA configuration
 */
export const EIP7702SmartEOAConfig = BaseNodeConfig.extend({
  delegateName: z.string().min(1).max(64).regex(/^[A-Z][a-zA-Z0-9]*$/),
  delegateType: z.enum(['batch-executor', 'session-manager', 'sponsored-executor', 'custom']).default('batch-executor'),
  features: z.array(z.enum([
    'batch-calls',
    'sponsored-tx',
    'session-keys',
    'permissions',
  ])).default(['batch-calls']),
  securityWarnings: z.boolean().default(true),
  generateUI: z.boolean().default(true),
});
export type EIP7702SmartEOAConfig = z.infer<typeof EIP7702SmartEOAConfig>;

/**
 * Wallet Authentication configuration
 */
export const WalletAuthConfig = BaseNodeConfig.extend({
  provider: z.enum(['rainbowkit', 'privy', 'custom']).default('rainbowkit'),
  siweEnabled: z.boolean().default(true),
  socialLogins: z.array(z.enum(['google', 'twitter', 'discord', 'github'])).default([]),
  sessionPersistence: z.boolean().default(true),
  appName: z.string().min(1).max(100).optional(),
});
export type WalletAuthConfig = z.infer<typeof WalletAuthConfig>;

/**
 * RPC Provider configuration
 */
export const RPCProviderConfig = BaseNodeConfig.extend({
  primaryProvider: z.enum(['alchemy', 'quicknode', 'infura', 'ankr', '1rpc', 'public']).default('alchemy'),
  fallbackProviders: z.array(z.enum(['alchemy', 'quicknode', 'infura', 'ankr', '1rpc', 'public'])).default(['public']),
  enableWebSocket: z.boolean().default(true),
  healthCheckInterval: z.number().int().min(5000).max(300000).default(30000),
  retryAttempts: z.number().int().min(1).max(10).default(3),
  privacyMode: z.boolean().default(false),
});
export type RPCProviderConfig = z.infer<typeof RPCProviderConfig>;

/**
 * Arbitrum Bridge configuration
 */
export const ArbitrumBridgeConfig = BaseNodeConfig.extend({
  supportedTokens: z.array(z.string()).default(['ETH']),
  enableERC20: z.boolean().default(true),
  enableMessaging: z.boolean().default(false),
  generateUI: z.boolean().default(true),
  targetNetwork: z.enum(['arbitrum', 'arbitrumSepolia']).default('arbitrum'),
});
export type ArbitrumBridgeConfig = z.infer<typeof ArbitrumBridgeConfig>;

/**
 * Chain Data configuration
 */
export const ChainDataConfig = BaseNodeConfig.extend({
  provider: z.enum(['alchemy', 'moralis']).default('alchemy'),
  features: z.array(z.enum([
    'token-balances',
    'nft-data',
    'transaction-history',
    'price-feeds',
  ])).default(['token-balances', 'nft-data']),
  cacheEnabled: z.boolean().default(true),
  cacheDuration: z.number().int().min(0).max(3600000).default(60000),
});
export type ChainDataConfig = z.infer<typeof ChainDataConfig>;

/**
 * IPFS Storage configuration
 */
export const IPFSStorageConfig = BaseNodeConfig.extend({
  provider: z.enum(['pinata', 'web3storage']).default('pinata'),
  generateMetadataSchemas: z.boolean().default(true),
  generateUI: z.boolean().default(true),
});
export type IPFSStorageConfig = z.infer<typeof IPFSStorageConfig>;

/**
 * Chain Abstraction configuration
 */
export const ChainAbstractionConfig = BaseNodeConfig.extend({
  supportedChains: z.array(z.enum(['arbitrum', 'ethereum', 'optimism', 'base', 'polygon'])).default(['arbitrum', 'ethereum']),
  unifiedBalanceEnabled: z.boolean().default(true),
  autoChainSwitch: z.boolean().default(true),
  gasPaymentToken: z.enum(['native', 'usdc', 'usdt']).default('native'),
});
export type ChainAbstractionConfig = z.infer<typeof ChainAbstractionConfig>;

/**
 * ZK Primitives configuration
 */
export const ZKPrimitivesConfig = BaseNodeConfig.extend({
  proofTypes: z.array(z.enum(['membership', 'range', 'semaphore'])).default(['membership']),
  clientSideProving: z.boolean().default(true),
  generateVerifiers: z.boolean().default(true),
});
export type ZKPrimitivesConfig = z.infer<typeof ZKPrimitivesConfig>;

/**
 * Telegram Notification configuration
 */
export const TelegramNotifyConfig = BaseNodeConfig.extend({
  notificationTypes: z.array(z.enum([
    'transaction', 'price-alert', 'whale-alert',
    'nft-activity', 'defi-position', 'governance',
    'contract-event', 'custom'
  ])).default(['transaction']),
  templateFormat: z.enum(['HTML', 'Markdown', 'MarkdownV2']).default('HTML'),
});
export type TelegramNotifyConfig = z.infer<typeof TelegramNotifyConfig>;

/**
 * Telegram Commands configuration
 */
export const TelegramCommandsConfig = BaseNodeConfig.extend({
  framework: z.enum(['grammy', 'telegraf']).default('grammy'),
  deliveryMethod: z.enum(['webhook', 'polling']).default('webhook'),
  commands: z.array(z.enum([
    'start', 'help', 'balance', 'wallet',
    'subscribe', 'unsubscribe', 'settings', 'status'
  ])).default(['start', 'help']),
  rateLimitEnabled: z.boolean().default(true),
  chatFlowEnabled: z.boolean().default(false),
});
export type TelegramCommandsConfig = z.infer<typeof TelegramCommandsConfig>;

/**
 * Telegram Wallet Linking configuration
 */
export const TelegramWalletLinkConfig = BaseNodeConfig.extend({
  persistenceType: z.enum(['prisma', 'drizzle', 'in-memory']).default('prisma'),
  verificationEnabled: z.boolean().default(true),
});
export type TelegramWalletLinkConfig = z.infer<typeof TelegramWalletLinkConfig>;

/**
 * Telegram AI Agent configuration
 */
export const TelegramAIAgentConfig = BaseNodeConfig.extend({
  provider: z.enum(['openai', 'anthropic', 'local']).default('openai'),
  model: z.string().default('gpt-4-turbo'),
  systemPrompt: z.string().default('You are a helpful Web3 assistant.'),
  memoryEnabled: z.boolean().default(true),
  temperature: z.number().min(0).max(2).default(0.7),
});
export type TelegramAIAgentConfig = z.infer<typeof TelegramAIAgentConfig>;

/**
 * Ostium One-Click Trading configuration
 */
export const OstiumTradingConfig = BaseNodeConfig.extend({
  network: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum'),
  usdcApprovalAmount: z.string().regex(/^\d+$/).default('1000000'),
  delegationEnabled: z.boolean().default(false),
  usdcApproved: z.boolean().default(false),
});
export type OstiumTradingConfig = z.infer<typeof OstiumTradingConfig>;

const MAXXIT_AGENT_ID_MAX = 64;
const MAXXIT_AGENT_NAME_MAX = 200;
const MAXXIT_STATUS_MAX = 50;
const MAXXIT_VENUE_MAX = 50;
const MAXXIT_TELEGRAM_USERNAME_MAX = 64;
const MAXXIT_TELEGRAM_NAME_MAX = 128;

/**
 * Maxxit Lazy Trader configuration
 */
export const MaxxitLazyTradingConfig = BaseNodeConfig.extend({
  agentId: z.string().max(MAXXIT_AGENT_ID_MAX).optional(),
  agentName: z.string().max(MAXXIT_AGENT_NAME_MAX).optional(),
  agentStatus: z.string().max(MAXXIT_STATUS_MAX).optional(),
  venue: z.string().max(MAXXIT_VENUE_MAX).optional(),
  userWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  deploymentStatus: z.string().max(MAXXIT_STATUS_MAX).optional(),
  enabledVenues: z.array(z.string().max(MAXXIT_VENUE_MAX)).optional(),
  telegramUsername: z.string().max(MAXXIT_TELEGRAM_USERNAME_MAX).optional(),
  telegramName: z.string().max(MAXXIT_TELEGRAM_NAME_MAX).optional(),
});
export type MaxxitLazyTradingConfig = z.infer<typeof MaxxitLazyTradingConfig>;

/**
 * ERC20 Stylus Token configuration
 */
export const ERC20StylusConfig = BaseNodeConfig.extend({
  tokenName: z.string().min(1).max(64).default('My Token'),
  tokenSymbol: z.string().min(1).max(10).default('MTK'),
  initialSupply: z.string().regex(/^\d+$/).default('1000000'),
  network: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum-sepolia'),
  features: z.array(z.enum([
    'mintable',
    'burnable',
    'pausable',
    'ownable',
  ])).default(['ownable', 'mintable', 'burnable', 'pausable']),
  // Deployment state
  isDeployed: z.boolean().default(false),
  contractAddress: z.string().optional(),
  factoryAddress: z.string().optional(),
});
export type ERC20StylusConfig = z.infer<typeof ERC20StylusConfig>;

/**
 * ERC721 Stylus NFT configuration
 */
export const ERC721StylusConfig = BaseNodeConfig.extend({
  collectionName: z.string().min(1).max(64).default('My NFT Collection'),
  collectionSymbol: z.string().min(1).max(10).default('MNFT'),
  baseUri: z.string().min(1).default('https://api.example.com/metadata/'),
  network: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum-sepolia'),
  features: z.array(z.enum([
    'mintable',
    'burnable',
    'pausable',
    'ownable',
    'enumerable',
  ])).default(['ownable', 'mintable', 'burnable', 'pausable']),
  // Deployment state
  isDeployed: z.boolean().default(false),
  contractAddress: z.string().optional(),
  factoryAddress: z.string().optional(),
});
export type ERC721StylusConfig = z.infer<typeof ERC721StylusConfig>;

/**
 * ERC1155 Stylus Multi-Token configuration
 */
export const ERC1155StylusConfig = BaseNodeConfig.extend({
  collectionName: z.string().min(1).max(64).default('My Multi-Token Collection'),
  baseUri: z.string().min(1).default('https://api.example.com/metadata/'),
  network: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum-sepolia'),
  features: z.array(z.enum([
    'mintable',
    'burnable',
    'pausable',
    'ownable',
    'supply-tracking',
    'batch-operations',
  ])).default(['ownable', 'mintable', 'burnable', 'pausable', 'supply-tracking', 'batch-operations']),
  // Deployment state
  isDeployed: z.boolean().default(false),
  contractAddress: z.string().optional(),
  factoryAddress: z.string().optional(),
});
export type ERC1155StylusConfig = z.infer<typeof ERC1155StylusConfig>;

 /**
  Onchain Activity configuration
 */
export const OnchainActivityConfig = BaseNodeConfig.extend({
  network: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum'),
  transactionLimit: z.enum(['5', '10', '15', '20', 'custom']).default('10'),
  customLimit: z.number().min(1).max(100).optional().default(25),
  categories: z.array(z.enum(['erc20', 'erc721', 'erc1155', 'external'])).default(['erc20']),
});
export type OnchainActivityConfig = z.infer<typeof OnchainActivityConfig>;

/**
 * AIXBT Project Momentum configuration
 */
export const AIXBTMomentumConfig = BaseNodeConfig.extend({
  projectId: z.string().min(1).default('bitcoin'),
  interval: z.enum(['1h', '4h', '24h', '7d']).default('24h'),
  includeHistoricalData: z.boolean().default(true),
  trackClusterConvergence: z.boolean().default(true),
});
export type AIXBTMomentumConfig = z.infer<typeof AIXBTMomentumConfig>;

/**
 * AIXBT Signals configuration
 */
export const AIXBTSignalsConfig = BaseNodeConfig.extend({
  projectId: z.string().optional(), // Optional for global signal feed
  categories: z.array(z.enum([
    'TECH_EVENT', 'PARTNERSHIP', 'LISTING', 'FUNDING',
    'ONCHAIN_HOT', 'RISK_ALERT', 'SOCIAL_CONVERGENCE'
  ])).default(['LISTING', 'FUNDING', 'PARTNERSHIP']),
  minConvictionScore: z.number().min(0).max(1).default(0.7),
  limit: z.number().int().min(1).max(100).default(20),
});
export type AIXBTSignalsConfig = z.infer<typeof AIXBTSignalsConfig>;

/**
 * AIXBT Indigo Intelligence configuration
 */
export const AIXBTIndigoConfig = BaseNodeConfig.extend({
  model: z.enum(['indigo-mini', 'indigo-full']).default('indigo-mini'),
  systemPrompt: z.string().max(2000).default('You are a professional market researcher provided by AIXBT.'),
  outputFormat: z.enum(['text', 'json', 'markdown']).default('markdown'),
  useX402Paywall: z.boolean().default(true),
});
export type AIXBTIndigoConfig = z.infer<typeof AIXBTIndigoConfig>;

/**
 * AIXBT Market Observer configuration
 */
export const AIXBTObserverConfig = BaseNodeConfig.extend({
  network: z.enum(['arbitrum', 'ethereum']).default('arbitrum'),
  watchWallets: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).optional(),
  alertOnMomentumDrop: z.boolean().default(true),
  alertOnNegativeSignal: z.boolean().default(true),
});
export type AIXBTObserverConfig = z.infer<typeof AIXBTObserverConfig>;

/**
 * Union of all node configurations
 */
export const NodeConfig = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stylus-contract'), config: StylusContractConfig }),
  z.object({ type: z.literal('stylus-zk-contract'), config: StylusZKContractConfig }),
  z.object({ type: z.literal('x402-paywall-api'), config: X402PaywallConfig }),
  z.object({ type: z.literal('erc8004-agent-runtime'), config: ERC8004AgentConfig }),
  z.object({ type: z.literal('repo-quality-gates'), config: RepoQualityGatesConfig }),
  z.object({ type: z.literal('frontend-scaffold'), config: FrontendScaffoldConfig }),
  z.object({ type: z.literal('sdk-generator'), config: SDKGeneratorConfig }),
  // New Arbitrum/Telegram nodes
  z.object({ type: z.literal('eip7702-smart-eoa'), config: EIP7702SmartEOAConfig }),
  z.object({ type: z.literal('wallet-auth'), config: WalletAuthConfig }),
  z.object({ type: z.literal('rpc-provider'), config: RPCProviderConfig }),
  z.object({ type: z.literal('arbitrum-bridge'), config: ArbitrumBridgeConfig }),
  z.object({ type: z.literal('chain-data'), config: ChainDataConfig }),
  z.object({ type: z.literal('ipfs-storage'), config: IPFSStorageConfig }),
  z.object({ type: z.literal('chain-abstraction'), config: ChainAbstractionConfig }),
  z.object({ type: z.literal('zk-primitives'), config: ZKPrimitivesConfig }),
  z.object({ type: z.literal('telegram-notifications'), config: TelegramNotifyConfig }),
  z.object({ type: z.literal('telegram-commands'), config: TelegramCommandsConfig }),
  z.object({ type: z.literal('telegram-wallet-link'), config: TelegramWalletLinkConfig }),
  z.object({ type: z.literal('telegram-ai-agent'), config: TelegramAIAgentConfig }),
  z.object({ type: z.literal('ostium-trading'), config: OstiumTradingConfig }),
  z.object({ type: z.literal('maxxit'), config: MaxxitLazyTradingConfig }),
  z.object({ type: z.literal('aixbt-momentum'), config: AIXBTMomentumConfig }),
  z.object({ type: z.literal('aixbt-signals'), config: AIXBTSignalsConfig }),
  z.object({ type: z.literal('aixbt-indigo'), config: AIXBTIndigoConfig }),
  z.object({ type: z.literal('aixbt-observer'), config: AIXBTObserverConfig }),
]);
export type NodeConfig = z.infer<typeof NodeConfig>;

/**
 * Blueprint node definition
 */
export const BlueprintNode = z.object({
  id: z.string().uuid(),
  type: NodeType,
  position: NodePosition,
  config: z.record(z.unknown()), // Validated separately per type
  metadata: z.object({
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }).optional(),
});
export type BlueprintNode = z.infer<typeof BlueprintNode>;

/**
 * Get the category for a node type
 */
export function getNodeCategory(type: NodeType): NodeCategory {
  const categoryMap: Record<NodeType, NodeCategory> = {
    'stylus-contract': 'contracts',
    'stylus-zk-contract': 'contracts',
    'eip7702-smart-eoa': 'contracts',
    'zk-primitives': 'contracts',
    'erc20-stylus': 'contracts',
    'erc721-stylus': 'contracts',
    'erc1155-stylus': 'contracts',
    'x402-paywall-api': 'payments',
    'erc8004-agent-runtime': 'agents',
    'ostium-trading': 'agents',
    'maxxit': 'agents',
    'onchain-activity': 'agents',
    'frontend-scaffold': 'app',
    'sdk-generator': 'app',
    'wallet-auth': 'app',
    'rpc-provider': 'app',
    'chain-data': 'app',
    'ipfs-storage': 'app',
    'chain-abstraction': 'app',
    'arbitrum-bridge': 'app',
    'telegram-notifications': 'telegram',
    'telegram-commands': 'telegram',
    'telegram-wallet-link': 'telegram',
    'telegram-ai-agent': 'telegram',
    'repo-quality-gates': 'quality',
    'aixbt-momentum': 'intelligence',
    'aixbt-signals': 'intelligence',
    'aixbt-indigo': 'intelligence',
    'aixbt-observer': 'intelligence',
  };
  return categoryMap[type];
}

/**
 * Get config schema for a node type
 */
export function getConfigSchemaForType(type: NodeType) {
  const schemaMap = {
    'stylus-contract': StylusContractConfig,
    'stylus-zk-contract': StylusZKContractConfig,
    'eip7702-smart-eoa': EIP7702SmartEOAConfig,
    'zk-primitives': ZKPrimitivesConfig,
    'erc20-stylus': ERC20StylusConfig,
    'erc721-stylus': ERC721StylusConfig,
    'erc1155-stylus': ERC1155StylusConfig,
    'x402-paywall-api': X402PaywallConfig,
    'erc8004-agent-runtime': ERC8004AgentConfig,
    'repo-quality-gates': RepoQualityGatesConfig,
    'frontend-scaffold': FrontendScaffoldConfig,
    'sdk-generator': SDKGeneratorConfig,
    'wallet-auth': WalletAuthConfig,
    'rpc-provider': RPCProviderConfig,
    'chain-data': ChainDataConfig,
    'ipfs-storage': IPFSStorageConfig,
    'chain-abstraction': ChainAbstractionConfig,
    'arbitrum-bridge': ArbitrumBridgeConfig,
    'telegram-notifications': TelegramNotifyConfig,
    'telegram-commands': TelegramCommandsConfig,
    'telegram-wallet-link': TelegramWalletLinkConfig,
    'telegram-ai-agent': TelegramAIAgentConfig,
    'ostium-trading': OstiumTradingConfig,
    'maxxit': MaxxitLazyTradingConfig,
    'onchain-activity': OnchainActivityConfig,
    'aixbt-momentum': AIXBTMomentumConfig,
    'aixbt-signals': AIXBTSignalsConfig,
    'aixbt-indigo': AIXBTIndigoConfig,
    'aixbt-observer': AIXBTObserverConfig,
  };
  return schemaMap[type];
}

