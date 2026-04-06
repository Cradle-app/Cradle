import type { PluginRegistryEntry } from "./types";

/**
 * Complete Plugin Registry
 * Single source of truth for all plugin definitions, default configs, and compatibility
 *
 * This is designed to be easily editable - just update the entries below
 * to change plugin metadata, compatibility relationships, or default configs.
 */
export const PLUGIN_REGISTRY: Record<string, PluginRegistryEntry> = {
    // ============================================
    // CONTRACTS CATEGORY
    // ============================================
    'erc20-stylus': {
        id: 'erc20-stylus',
        name: 'ERC-20 Token',
        description: 'Deploy ERC-20 token on Arbitrum Stylus',
        icon: 'Coins',
        logoAsset: 'stylus.svg',
        color: 'node-primary',
        category: 'contracts',
        tags: ['token', 'erc20', 'stylus', 'arbitrum', 'fungible'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'dune-token-price'],
            suggestedWith: ['erc721-stylus', 'dune-wallet-balances', 'chain-data'],
            requires: [],
        },
        defaultConfig: {
            tokenName: 'SuperPositionToken',
            tokenSymbol: 'SPT',
            decimals: 18,
            network: 'arbitrum-sepolia',
            selectedFunctions: ['mint', 'mint_to', 'burn'],
        },
    },
    'erc721-stylus': {
        id: 'erc721-stylus',
        name: 'ERC-721 NFT',
        description: 'Deploy NFT collection on Arbitrum Stylus',
        icon: 'Sparkles',
        logoAsset: 'stylus.svg',
        color: 'node-primary',
        category: 'contracts',
        tags: ['nft', 'erc721', 'stylus', 'arbitrum', 'collectible'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'ipfs-storage'],
            suggestedWith: ['dune-nft-floor', 'chain-data', 'erc1155-stylus'],
            requires: [],
        },
        defaultConfig: {
            collectionName: 'SuperPositionNFT',
            collectionSymbol: 'SPTNFT',
            network: 'arbitrum-sepolia',
            selectedFunctions: ['mint', 'mint_to', 'safe_mint', 'burn'],
        },
    },
    'erc1155-stylus': {
        id: 'erc1155-stylus',
        name: 'ERC-1155 Multi-Token',
        description: 'Deploy multi-token contract on Arbitrum Stylus',
        icon: 'Layers',
        logoAsset: 'stylus.svg',
        color: 'node-primary',
        category: 'contracts',
        tags: ['multi-token', 'erc1155', 'stylus', 'arbitrum', 'gaming'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'ipfs-storage'],
            suggestedWith: ['chain-data', 'erc20-stylus', 'erc721-stylus'],
            requires: [],
        },
        defaultConfig: {
            collectionName: 'My Multi-Token Collection',
            baseUri: 'https://api.example.com/metadata/',
            network: 'arbitrum-sepolia',
            features: ['ownable', 'mintable', 'burnable', 'pausable', 'supply-tracking', 'batch-operations'],
            selectedFunctions: ['balance_of', 'balance_of_batch', 'set_approval_for_all', 'is_approved_for_all', 'safe_transfer_from', 'safe_batch_transfer_from'],
        },
    },
    // 'stylus-contract': {
    //     id: 'stylus-contract',
    //     name: 'Stylus Contract',
    //     description: 'Rust/WASM smart contract for Arbitrum',
    //     icon: 'Box',
    //     logoAsset: 'stylus.svg',
    //     color: 'node-primary',
    //     category: 'contracts',
    //     tags: ['rust', 'wasm', 'stylus', 'arbitrum', 'custom'],
    //     compatibility: {
    //         compatibleWith: ['frontend-scaffold', 'wallet-auth', 'smartcache-caching'],
    //         suggestedWith: ['auditware-analyzing', 'repo-quality-gates'],
    //         requires: [],
    //     },
    //     defaultConfig: {
    //         contractName: 'my-contract',
    //         contractInstructions: 'Describe your contract logic here. For example: a simple counter with increment and decrement, or a vending machine with cooldowns.',
    //     },
    // },
    'stylus-zk-contract': {
        id: 'stylus-zk-contract',
        name: 'Stylus ZK Contract',
        description: 'Privacy-preserving contract with ZK proofs',
        icon: 'Lock',
        logoAsset: 'stylus.svg',
        color: 'node-primary',
        category: 'contracts',
        tags: ['zk', 'privacy', 'stylus', 'arbitrum', 'proof'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'zk-primitives', 'wallet-auth'],
            suggestedWith: ['auditware-analyzing'],
            requires: [],
        },
        defaultConfig: {
            contractName: 'MyZKToken',
            contractType: 'erc721',
            zkCircuitType: 'balance-proof',
            minBalance: '1000000000000000000',
            oracleEnabled: true,
            nullifierEnabled: true,
            testCoverage: true,
        },
    },
    'eip7702-smart-eoa': {
        id: 'eip7702-smart-eoa',
        name: 'EIP-7702 Smart EOA',
        description: 'Smart EOA delegation (trending)',
        icon: 'Key',
        logoAsset: 'Wallet.png',
        color: 'node-contracts',
        category: 'contracts',
        tags: ['eip7702', 'eoa', 'delegation', 'account-abstraction'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth'],
            suggestedWith: ['chain-abstraction'],
            requires: [],
        },
        defaultConfig: {
            delegateName: 'BatchExecutor',
            delegateType: 'batch-executor',
            features: ['batch-calls', 'sponsored-tx'],
            securityWarnings: true,
            generateUI: true,
        },
    },
    'zk-primitives': {
        id: 'zk-primitives',
        name: 'ZK Primitives',
        description: 'Privacy proofs: membership, range, semaphore',
        icon: 'Lock',
        logoAsset: 'stylus.svg',
        color: 'node-contracts',
        category: 'contracts',
        tags: ['zk', 'privacy', 'semaphore', 'proof', 'membership'],
        compatibility: {
            compatibleWith: ['stylus-zk-contract', 'frontend-scaffold'],
            suggestedWith: ['wallet-auth'],
            requires: [],
        },
        defaultConfig: {
            proofTypes: ['membership'],
            clientSideProving: true,
            generateVerifiers: true,
        },
    },
    'stylus-rust-contract': {
        id: 'stylus-rust-contract',
        name: 'Stylus Rust Contract',
        description: 'Build Rust smart contracts for Arbitrum',
        icon: 'Box',
        logoAsset: 'stylus.svg',
        color: 'node-primary',
        category: 'contracts',
        tags: ['rust', 'stylus', 'arbitrum', 'custom'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'smartcache-caching'],
            suggestedWith: ['auditware-analyzing', 'repo-quality-gates'],
            requires: [],
        },
        defaultConfig: {
            network: 'arbitrum-sepolia',
            exampleType: 'counter',
            contractName: 'MyContract',
            contractCode: '',
        },
    },
    'smartcache-caching': {
        id: 'smartcache-caching',
        name: 'SmartCache Caching',
        description: 'Enable contract caching for cheaper gas',
        icon: 'Database',
        logoAsset: 'CS_logo.png',
        color: 'node-primary',
        category: 'contracts',
        tags: ['cache', 'gas', 'optimization', 'stylus'],
        compatibility: {
            compatibleWith: ['stylus-contract', 'stylus-rust-contract'],
            suggestedWith: [],
            requires: [],
        },
        defaultConfig: {
            crateVersion: 'latest',
            autoOptIn: true,
        },
    },
    'auditware-analyzing': {
        id: 'auditware-analyzing',
        name: 'Auditware Analyzer',
        description: 'Security analysis with Radar',
        icon: 'ShieldCheck',
        logoAsset: 'auditware.png',
        color: 'node-primary',
        category: 'contracts',
        tags: ['security', 'audit', 'analysis', 'stylus'],
        compatibility: {
            compatibleWith: ['stylus-contract', 'stylus-rust-contract', 'stylus-zk-contract'],
            suggestedWith: ['repo-quality-gates'],
            requires: [],
        },
        defaultConfig: {
            outputFormat: 'both',
            severityFilter: ['low', 'medium', 'high'],
            projectPath: '.',
        },
    },

    // ============================================
    // AGENTS CATEGORY
    // ============================================
    'erc8004-agent-runtime': {
        id: 'erc8004-agent-runtime',
        name: 'ERC-8004 Agent',
        description: 'AI agent with on-chain registry',
        icon: 'Bot',
        logoAsset: 'AIbot.png',
        color: 'node-agents',
        category: 'agents',
        tags: ['ai', 'agent', 'erc8004', 'llm', 'registry'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'telegram-ai-agent'],
            suggestedWith: ['aixbt-indigo', 'chain-data'],
            requires: [],
        },
        defaultConfig: {
            agentName: 'MyAgent',
            agentVersion: '0.1.0',
            capabilities: ['text-generation'],
            registryIntegration: true,
            selectedModel: 'openai/gpt-4o',
        },
    },
    'ostium-trading': {
        id: 'ostium-trading',
        name: 'Ostium Trading',
        description: 'One-click trading setup for Ostium',
        icon: 'Zap',
        logoAsset: 'Ostium.svg',
        color: 'node-agents',
        category: 'agents',
        tags: ['trading', 'defi', 'ostium', 'perpetuals'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth'],
            suggestedWith: ['dune-dex-volume', 'chain-data'],
            requires: [],
        },
        defaultConfig: {
            tradingPair: 'ETH/USD',
            leverage: 10,
            enableOneClick: true,
        },
    },
    'maxxit': {
        id: 'maxxit',
        name: 'Maxxit Lazy Trader',
        description: 'Connect and message Maxxit Lazy Trader agents',
        icon: 'Bot',
        logoAsset: 'MaxxitLogo.png',
        color: 'node-agents',
        category: 'agents',
        tags: ['trading', 'agent', 'maxxit', 'automation'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth'],
            suggestedWith: ['telegram-ai-agent'],
            requires: [],
        },
        defaultConfig: {},
    },
    'onchain-activity': {
        id: 'onchain-activity',
        name: 'Onchain Activity',
        description: 'Fetch wallet transactions by category from Arbitrum',
        icon: 'TrendingUp',
        logoAsset: 'Wallet.png',
        color: 'node-agents',
        category: 'agents',
        tags: ['analytics', 'transactions', 'wallet', 'arbitrum'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'chain-data'],
            suggestedWith: ['dune-transaction-history', 'dune-wallet-balances'],
            requires: [],
        },
        defaultConfig: {
            network: 'arbitrum',
            transactionLimit: '10',
            categories: ['erc20', 'external'],
        },
    },

    'openclaw-agent': {
        id: 'openclaw-agent',
        name: 'OpenClaw',
        description: 'Prompt-driven OpenClaw agent block',
        icon: 'Bot',
        logoAsset: 'openclaw.jpg',
        color: 'node-agents',
        category: 'agents',
        tags: ['ai', 'agent', 'openclaw', 'prompt'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth'],
            suggestedWith: ['onchain-activity', 'dune-transaction-history'],
            requires: [],
        },
        defaultConfig: {},
    },

    'eigen-ai-agent': {
        id: 'eigen-ai-agent',
        name: 'EigenAI',
        description: 'LLM agent powered by EigenAI with optional signature verification',
        icon: 'Bot',
        logoAsset: 'EigenAI.svg',
        color: 'node-agents',
        category: 'agents',
        tags: ['eigenai', 'ai', 'agent', 'llm', 'signing'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'telegram-ai-agent'],
            suggestedWith: ['onchain-activity', 'dune-transaction-history'],
            requires: [],
        },
        defaultConfig: {
            baseUrl: 'https://eigenai.eigencloud.xyz/v1',
            model: 'gpt-oss-120b-f16',
            network: 'mainnet',
            enableSignatureVerification: true,
        },
    },

    // ============================================
    // PAYMENTS CATEGORY
    // ============================================
    'x402-paywall-api': {
        id: 'x402-paywall-api',
        name: 'x402 Paywall',
        description: 'HTTP 402 payment endpoint',
        icon: 'CreditCard',
        logoAsset: 'payment.png',
        color: 'node-payments',
        category: 'payments',
        tags: ['payment', 'api', 'monetization', '402'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth'],
            suggestedWith: ['rpc-provider', 'erc20-stylus'],
            requires: [],
        },
        defaultConfig: {
            resourcePath: '/api/premium/resource',
            priceInWei: '1000000000000000',
            currency: 'ETH',
            paymentTimeout: 300,
            receiptValidation: true,
            openApiSpec: true,
        },
    },

    // ============================================
    // ORACLES / ANALYTICS (PYTH)
    // ============================================
    'pyth-oracle': {
        id: 'pyth-oracle',
        name: 'Pyth Price Oracle',
        description: 'On-chain price feeds from Pyth Network',
        icon: 'TrendingUp',
        logoAsset: 'Pyth.svg',
        color: 'accent-purple',
        category: 'protocols',
        tags: ['pyth', 'oracle', 'prices', 'feeds', 'arbitrum'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'chain-data'],
            suggestedWith: ['dune-token-price', 'dune-wallet-balances'],
            requires: [],
        },
        defaultConfig: {
            chain: 'arbitrum',
        },
    },
    'chainlink-price-feed': {
        id: 'chainlink-price-feed',
        name: 'Chainlink Price Feed',
        description: 'On-chain price feeds from Chainlink Data Feeds',
        icon: 'Link',
        logoAsset: 'Chainlink.svg',
        color: 'accent-purple',
        category: 'protocols',
        tags: ['chainlink', 'oracle', 'prices', 'feeds', 'arbitrum', 'aggregator'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'chain-data', 'rpc-provider'],
            suggestedWith: ['dune-token-price', 'pyth-oracle'],
            requires: [],
        },
        defaultConfig: {
            chain: 'arbitrum',
            feedAddress: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', // ETH/USD Arbitrum One
        },
    },
    'aave-lending': {
        id: 'aave-lending',
        name: 'Aave Lending',
        description: 'Supply, borrow, withdraw, and repay on Aave V3',
        icon: 'Coins',
        logoAsset: 'Aave.svg',
        color: 'node-agents',
        category: 'protocols',
        tags: ['aave', 'lending', 'borrow', 'supply', 'defi', 'arbitrum'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'rpc-provider', 'chain-data'],
            suggestedWith: ['chainlink-price-feed', 'pyth-oracle'],
            requires: [],
        },
        defaultConfig: {
            chain: 'arbitrum',
        },
    },
    'compound-lending': {
        id: 'compound-lending',
        name: 'Compound Lending',
        description: 'Supply, borrow, withdraw, and repay on Compound V3 (Comet)',
        icon: 'Zap',
        logoAsset: 'Compound.svg',
        color: 'node-agents',
        category: 'protocols',
        tags: ['compound', 'lending', 'borrow', 'supply', 'defi', 'arbitrum', 'comet'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'rpc-provider', 'chain-data'],
            suggestedWith: ['aave-lending', 'chainlink-price-feed'],
            requires: [],
        },
        defaultConfig: {
            chain: 'arbitrum',
        },
    },
    'uniswap-swap': {
        id: 'uniswap-swap',
        name: 'Uniswap Swap',
        description: 'Swap tokens via Uniswap V3 across Arbitrum and Sepolia',
        icon: 'Coins',
        logoAsset: 'Uniswap.svg',
        color: 'node-agents',
        category: 'protocols',
        tags: ['uniswap', 'swap', 'dex', 'defi', 'arbitrum', 'sepolia'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'rpc-provider', 'chain-data'],
            suggestedWith: ['chainlink-price-feed', 'pyth-oracle', 'onchain-activity'],
            requires: [],
        },
        defaultConfig: {
            chain: 'arbitrum',
        },
    },

    // ============================================
    // APP CATEGORY
    // ============================================
    'wallet-auth': {
        id: 'wallet-auth',
        name: 'Wallet Auth',
        description: 'WalletConnect, social login, SIWE',
        icon: 'Wallet',
        logoAsset: 'Wallet.png',
        color: 'node-tertiary',
        category: 'app',
        tags: ['auth', 'wallet', 'siwe', 'login', 'web3'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'rpc-provider'],
            suggestedWith: ['chain-data', 'arbitrum-bridge'],
            requires: [],
        },
        defaultConfig: {
            provider: 'rainbowkit',
            walletConnectEnabled: true,
            siweEnabled: true,
            socialLogins: [],
            sessionPersistence: true,
        },
    },
    'rpc-provider': {
        id: 'rpc-provider',
        name: 'RPC Provider',
        description: 'Multi-provider RPC with failover',
        icon: 'Globe',
        logoAsset: 'arbitrum.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['rpc', 'provider', 'alchemy', 'infura', 'failover'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'chain-data'],
            suggestedWith: ['arbitrum-bridge'],
            requires: [],
        },
        defaultConfig: {
            primaryProvider: 'alchemy',
            fallbackProviders: ['public'],
            enableWebSocket: true,
            healthCheckInterval: 30000,
            retryAttempts: 3,
            privacyMode: false,
        },
    },
    'quicknode': {
        id: 'quicknode',
        name: 'Quicknode',
        description: 'Multi-chain API: RPC, Webhooks, Streams, IPFS, Key-Value Store, and more',
        icon: 'Globe',
        logoAsset: 'Quicknode.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['rpc', 'webhooks', 'streams', 'ipfs', 'quicknode', 'blockchain-api'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'chain-data', 'rpc-provider'],
            suggestedWith: ['arbitrum-bridge'],
            requires: [],
        },
        defaultConfig: {
            selectedService: 'core-rpc',
        },
    },
    'arbitrum-bridge': {
        id: 'arbitrum-bridge',
        name: 'Arbitrum Bridge',
        description: 'L1-L2 bridging with @arbitrum/sdk',
        icon: 'ArrowLeftRight',
        logoAsset: 'arbitrum.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['bridge', 'l1', 'l2', 'arbitrum', 'ethereum'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'rpc-provider'],
            suggestedWith: ['chain-abstraction'],
            requires: [],
        },
        defaultConfig: {
            supportedTokens: ['ETH'],
            enableERC20: true,
            enableMessaging: false,
            generateUI: true,
            targetNetwork: 'arbitrum',
        },
    },
    'chain-data': {
        id: 'chain-data',
        name: 'Chain Data',
        description: 'Token/NFT data with Alchemy/Moralis',
        icon: 'Database',
        logoAsset: 'arbitrum.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['data', 'alchemy', 'moralis', 'tokens', 'nfts'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'rpc-provider'],
            suggestedWith: ['dune-wallet-balances', 'onchain-activity'],
            requires: [],
        },
        defaultConfig: {
            provider: 'alchemy',
            features: ['token-balances', 'nft-data'],
            cacheEnabled: true,
            cacheDuration: 60000,
        },
    },
    'ipfs-storage': {
        id: 'ipfs-storage',
        name: 'IPFS Storage',
        description: 'Decentralized storage (Pinata/Web3.Storage)',
        icon: 'HardDrive',
        logoAsset: 'Ipfs.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['ipfs', 'storage', 'pinata', 'decentralized', 'metadata'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'erc721-stylus', 'erc1155-stylus'],
            suggestedWith: ['wallet-auth'],
            requires: [],
        },
        defaultConfig: {
            provider: 'pinata',
            generateMetadataSchemas: true,
            generateUI: true,
        },
    },
    'chain-abstraction': {
        id: 'chain-abstraction',
        name: 'Chain Abstraction',
        description: 'Unified multi-chain UX',
        icon: 'Layers',
        logoAsset: 'arbitrum.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['multichain', 'abstraction', 'ux', 'unified'],
        compatibility: {
            compatibleWith: ['frontend-scaffold', 'wallet-auth', 'arbitrum-bridge'],
            suggestedWith: ['rpc-provider'],
            requires: [],
        },
        defaultConfig: {
            supportedChains: ['arbitrum', 'ethereum'],
            unifiedBalanceEnabled: true,
            autoChainSwitch: true,
            gasPaymentToken: 'native',
        },
    },
    'frontend-scaffold': {
        id: 'frontend-scaffold',
        name: 'Frontend',
        description: 'Next.js/React frontend scaffold',
        icon: 'Layout',
        logoAsset: 'Nextjs.png',
        color: 'node-tertiary',
        category: 'app',
        tags: ['frontend', 'nextjs', 'react', 'web', 'ui'],
        compatibility: {
            compatibleWith: ['wallet-auth', 'rpc-provider', 'chain-data'],
            suggestedWith: ['erc20-stylus', 'erc721-stylus', 'arbitrum-bridge'],
            requires: [],
        },
        defaultConfig: {
            framework: 'nextjs',
            styling: 'tailwind',
            web3Provider: 'wagmi',
            walletConnect: true,
            rainbowKit: true,
        },
    },
    'sdk-generator': {
        id: 'sdk-generator',
        name: 'SDK Generator',
        description: 'TypeScript SDK from ABIs',
        icon: 'Layout',
        logoAsset: 'arbitrum.svg',
        color: 'node-tertiary',
        category: 'app',
        tags: ['sdk', 'typescript', 'abi', 'codegen'],
        compatibility: {
            compatibleWith: ['stylus-contract', 'erc20-stylus', 'erc721-stylus'],
            suggestedWith: ['frontend-scaffold'],
            requires: [],
        },
        defaultConfig: {
            outputFormat: 'typescript',
            includeABI: true,
            includeTypes: true,
            includeHooks: true,
        },
    },

    // ============================================
    // TELEGRAM CATEGORY
    // ============================================
    'telegram-notifications': {
        id: 'telegram-notifications',
        name: 'Notifications',
        description: 'Trigger alerts and updates to users',
        icon: 'Sparkles',
        logoAsset: 'Telegram.jpg',
        color: 'node-accent',
        category: 'telegram',
        tags: ['telegram', 'notifications', 'alerts', 'bot'],
        compatibility: {
            compatibleWith: ['telegram-commands', 'telegram-ai-agent', 'telegram-wallet-link'],
            suggestedWith: [],
            requires: [],
        },
        defaultConfig: {
            webhookEnabled: true,
            notificationTypes: ['transaction', 'price-alert'],
        },
    },
    'telegram-commands': {
        id: 'telegram-commands',
        name: 'Commands',
        description: 'Handle interactive commands via webhooks',
        icon: 'Box',
        logoAsset: 'Telegram.jpg',
        color: 'node-accent',
        category: 'telegram',
        tags: ['telegram', 'commands', 'bot', 'webhook'],
        compatibility: {
            compatibleWith: ['telegram-notifications', 'telegram-ai-agent', 'telegram-wallet-link'],
            suggestedWith: [],
            requires: [],
        },
        defaultConfig: {
            commands: ['start', 'help', 'balance'],
            framework: 'grammy',
            deliveryMethod: 'webhook',
            rateLimitEnabled: true,
            chatFlowEnabled: false,
        },
    },
    'telegram-ai-agent': {
        id: 'telegram-ai-agent',
        name: 'AI Agent',
        description: 'Conversational AI bot with LLM integration',
        icon: 'Sparkles',
        logoAsset: 'Telegram.jpg',
        color: 'node-accent',
        category: 'telegram',
        tags: ['telegram', 'ai', 'bot', 'llm', 'conversational'],
        compatibility: {
            compatibleWith: ['telegram-commands', 'telegram-notifications', 'erc8004-agent-runtime'],
            suggestedWith: ['aixbt-indigo', 'telegram-wallet-link'],
            requires: [],
        },
        defaultConfig: {
            modelProvider: 'openai',
            personality: 'helpful',
            contextMemory: true,
        },
    },
    'telegram-wallet-link': {
        id: 'telegram-wallet-link',
        name: 'Wallet Link',
        description: 'Link Telegram profiles with Web3 wallets',
        icon: 'Lock',
        logoAsset: 'Telegram.jpg',
        color: 'node-accent',
        category: 'telegram',
        tags: ['telegram', 'wallet', 'link', 'verification'],
        compatibility: {
            compatibleWith: ['telegram-commands', 'telegram-notifications'],
            suggestedWith: ['wallet-auth'],
            requires: [],
        },
        defaultConfig: {
            verificationMethod: 'signature',
            multiWallet: false,
        },
    },

  // ============================================
  // QUALITY CATEGORY
  // ============================================
  "repo-quality-gates": {
    id: "repo-quality-gates",
    name: "Quality Gates",
    description: "CI/CD, testing, linting",
    icon: "ShieldCheck",
    logoAsset: "github.png",
    color: "node-secondary",
    category: "quality",
    tags: ["ci", "cd", "testing", "linting", "quality"],
    compatibility: {
      compatibleWith: [
        "stylus-contract",
        "stylus-rust-contract",
        "frontend-scaffold",
      ],
      suggestedWith: ["auditware-analyzing"],
      requires: [],
    },
    defaultConfig: {
      ciProvider: "github",
      testFramework: "vitest",
      linter: "biome",
      formatter: "biome",
      typecheck: true,
      preCommitHooks: true,
      coverageThreshold: 80,
      securityScanning: true,
      dependencyAudit: true,
    },
  },

    // ============================================
    // INTELLIGENCE CATEGORY
    // ============================================
    'aixbt-momentum': {
        id: 'aixbt-momentum',
        name: 'AIXBT Momentum',
        description: 'Track social heat and project trends',
        icon: 'TrendingUp',
        logoAsset: 'aixbt.png',
        color: 'node-secondary',
        category: 'intelligence',
        tags: ['aixbt', 'momentum', 'social', 'trends', 'analytics'],
        compatibility: {
            compatibleWith: ['aixbt-signals', 'aixbt-indigo', 'aixbt-observer'],
            suggestedWith: ['frontend-scaffold'],
            requires: [],
        },
        defaultConfig: {
            projectId: 'bitcoin',
            interval: '24h',
            includeHistoricalData: true,
            trackClusterConvergence: true,
        },
    },
    'aixbt-signals': {
        id: 'aixbt-signals',
        name: 'AIXBT Signals',
        description: 'Real-time project activity alerts',
        icon: 'Zap',
        logoAsset: 'aixbt.png',
        color: 'node-secondary',
        category: 'intelligence',
        tags: ['aixbt', 'signals', 'alerts', 'activity'],
        compatibility: {
            compatibleWith: ['aixbt-momentum', 'aixbt-indigo', 'aixbt-observer'],
            suggestedWith: ['telegram-notifications'],
            requires: [],
        },
        defaultConfig: {
            categories: ['LISTING', 'FUNDING', 'PARTNERSHIP'],
            minConvictionScore: 0.7,
            limit: 20,
        },
    },
    'aixbt-indigo': {
        id: 'aixbt-indigo',
        name: 'AIXBT Indigo',
        description: 'Conversational market research',
        icon: 'Sparkles',
        logoAsset: 'aixbt.png',
        color: 'node-secondary',
        category: 'intelligence',
        tags: ['aixbt', 'indigo', 'research', 'ai', 'market'],
        compatibility: {
            compatibleWith: ['aixbt-momentum', 'aixbt-signals', 'telegram-ai-agent'],
            suggestedWith: ['erc8004-agent-runtime'],
            requires: [],
        },
        defaultConfig: {
            model: 'indigo-mini',
            systemPrompt: 'You are a professional market researcher provided by AIXBT.',
            outputFormat: 'markdown',
            useX402Paywall: true,
        },
    },
    'aixbt-observer': {
        id: 'aixbt-observer',
        name: 'AIXBT Observer',
        description: 'Correlate on-chain activity',
        icon: 'Search',
        logoAsset: 'aixbt.png',
        color: 'node-secondary',
        category: 'intelligence',
        tags: ['aixbt', 'observer', 'onchain', 'correlation'],
        compatibility: {
            compatibleWith: ['aixbt-momentum', 'aixbt-signals', 'onchain-activity'],
            suggestedWith: ['chain-data'],
            requires: [],
        },
        defaultConfig: {
            network: 'arbitrum',
            watchWallets: [],
            alertOnMomentumDrop: true,
            alertOnNegativeSignal: true,
        },
    },

  // ============================================
  // SUPERPOSITION CATEGORY
  // ============================================
  "superposition-network": {
    id: "superposition-network",
    name: "Network Config",
    description: "Chain config, RPC, and contract addresses",
    icon: "Globe",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "network", "config", "rpc"],
    compatibility: {
      compatibleWith: [
        "superposition-bridge",
        "superposition-longtail",
        "superposition-super-assets",
      ],
      suggestedWith: ["frontend-scaffold", "wallet-auth"],
      requires: [],
    },
    defaultConfig: {},
  },
  "superposition-bridge": {
    id: "superposition-bridge",
    name: "Bridge",
    description: "Bridge assets from Arbitrum via Li.Fi",
    icon: "ArrowLeftRight",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "bridge", "lifi", "arbitrum"],
    compatibility: {
      compatibleWith: [
        "superposition-network",
        "frontend-scaffold",
        "wallet-auth",
      ],
      suggestedWith: ["superposition-longtail"],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },
  "superposition-longtail": {
    id: "superposition-longtail",
    name: "Longtail AMM",
    description: "Swap and liquidity on Longtail DEX",
    icon: "TrendingUp",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "longtail", "dex", "amm", "swap"],
    compatibility: {
      compatibleWith: [
        "superposition-network",
        "frontend-scaffold",
        "wallet-auth",
      ],
      suggestedWith: ["superposition-super-assets", "dune-dex-volume"],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },
  "superposition-super-assets": {
    id: "superposition-super-assets",
    name: "Super Assets",
    description: "Yield-bearing wrapped tokens",
    icon: "Sparkles",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "yield", "wrapped", "tokens"],
    compatibility: {
      compatibleWith: ["superposition-network", "superposition-longtail"],
      suggestedWith: ["frontend-scaffold"],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },
  "superposition-thirdweb": {
    id: "superposition-thirdweb",
    name: "Thirdweb Deploy",
    description: "Deploy contracts using Thirdweb SDK",
    icon: "Box",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "thirdweb", "deploy", "contracts"],
    compatibility: {
      compatibleWith: ["superposition-network", "frontend-scaffold"],
      suggestedWith: ["wallet-auth"],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },
  "superposition-utility-mining": {
    id: "superposition-utility-mining",
    name: "Utility Mining",
    description: "Track and claim activity rewards",
    icon: "Zap",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "mining", "rewards", "activity"],
    compatibility: {
      compatibleWith: [
        "superposition-network",
        "frontend-scaffold",
        "wallet-auth",
      ],
      suggestedWith: ["superposition-longtail"],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },
  "superposition-faucet": {
    id: "superposition-faucet",
    name: "Testnet Faucet",
    description: "Request testnet tokens for development",
    icon: "Database",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "faucet", "testnet", "tokens"],
    compatibility: {
      compatibleWith: ["superposition-network", "frontend-scaffold"],
      suggestedWith: ["wallet-auth"],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },
  "superposition-meow-domains": {
    id: "superposition-meow-domains",
    name: "Meow Domains",
    description: ".meow Web3 identity and resolution",
    icon: "Key",
    logoAsset: "superposition.png",
    color: "accent-cyan",
    category: "superposition",
    tags: ["superposition", "domains", "identity", "meow"],
    compatibility: {
      compatibleWith: [
        "superposition-network",
        "frontend-scaffold",
        "wallet-auth",
      ],
      suggestedWith: [],
      requires: ["superposition-network"],
    },
    defaultConfig: {},
  },

  // ============================================
  // ROBINHOOD CHAIN CATEGORY
  // ============================================
  "robinhood-network": {
    id: "robinhood-network",
    name: "Network Config",
    description: "Robinhood Chain testnet RPC and chain configuration",
    icon: "Globe",
    logoAsset: "robinhood.png",
    color: "accent-green",
    category: "robinhood",
    tags: ["robinhood", "network", "config", "rpc", "orbit"],
    compatibility: {
      compatibleWith: [
        "robinhood-deployment",
        "robinhood-contracts",
        "frontend-scaffold",
        "wallet-auth",
      ],
      suggestedWith: ["rpc-provider"],
      requires: [],
    },
    defaultConfig: {},
  },
  "robinhood-deployment": {
    id: "robinhood-deployment",
    name: "Deployment Guide",
    description: "Generate deployment docs and scripts for Robinhood Chain",
    icon: "Box",
    logoAsset: "robinhood.png",
    color: "accent-green",
    category: "robinhood",
    tags: ["robinhood", "deployment", "hardhat", "foundry", "contracts"],
    compatibility: {
      compatibleWith: ["robinhood-network", "frontend-scaffold"],
      suggestedWith: ["wallet-auth"],
      requires: ["robinhood-network"],
    },
    defaultConfig: {},
  },
  "robinhood-contracts": {
    id: "robinhood-contracts",
    name: "Contract Addresses",
    description: "Typed constants for Robinhood Chain core and token contracts",
    icon: "Database",
    logoAsset: "robinhood.png",
    color: "accent-green",
    category: "robinhood",
    tags: ["robinhood", "contracts", "addresses", "bridge", "tokens"],
    compatibility: {
      compatibleWith: ["robinhood-network", "frontend-scaffold", "rpc-provider"],
      suggestedWith: ["robinhood-deployment"],
      requires: ["robinhood-network"],
    },
    defaultConfig: {},
  },

  // ============================================
  // ANALYTICS CATEGORY (DUNE)
  // ============================================
  "dune-execute-sql": {
    id: "dune-execute-sql",
    name: "Execute SQL",
    description: "Custom SQL queries on Dune blockchain data",
    icon: "Database",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "sql", "analytics", "query", "data"],
    compatibility: {
      compatibleWith: ["frontend-scaffold"],
      suggestedWith: ["dune-token-price", "dune-wallet-balances"],
      requires: [],
    },
    defaultConfig: {
      performanceMode: "medium",
      timeout: 60000,
      generateHooks: true,
    },
  },
  "dune-token-price": {
    id: "dune-token-price",
    name: "Token Price",
    description: "Fetch latest token prices across blockchains",
    icon: "TrendingUp",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "price", "tokens", "analytics"],
    compatibility: {
      compatibleWith: ["frontend-scaffold", "erc20-stylus"],
      suggestedWith: ["dune-wallet-balances"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "arbitrum",
      cacheEnabled: true,
      cacheDuration: 60000,
      generateUI: true,
    },
  },
  "dune-wallet-balances": {
    id: "dune-wallet-balances",
    name: "Wallet Balances",
    description: "Token balances with USD valuations",
    icon: "Wallet",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "balances", "wallet", "portfolio"],
    compatibility: {
      compatibleWith: ["frontend-scaffold", "wallet-auth", "chain-data"],
      suggestedWith: ["dune-token-price"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "arbitrum",
      minBalanceUsd: 1,
      includeNFTs: false,
      generateUI: true,
    },
  },
  "dune-dex-volume": {
    id: "dune-dex-volume",
    name: "DEX Volume",
    description: "Trading volume and DEX statistics",
    icon: "TrendingUp",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "dex", "volume", "trading", "analytics"],
    compatibility: {
      compatibleWith: ["frontend-scaffold", "superposition-longtail"],
      suggestedWith: ["ostium-trading"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "arbitrum",
      timeRange: "24h",
      generateUI: true,
    },
  },
  "dune-nft-floor": {
    id: "dune-nft-floor",
    name: "NFT Floor Price",
    description: "Collection floor prices and stats",
    icon: "Sparkles",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "nft", "floor", "collections"],
    compatibility: {
      compatibleWith: ["frontend-scaffold", "erc721-stylus"],
      suggestedWith: ["ipfs-storage"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "ethereum",
      generateUI: true,
      cacheDuration: 300000,
    },
  },
  "dune-address-labels": {
    id: "dune-address-labels",
    name: "Address Labels",
    description: "Human-readable names for addresses",
    icon: "Key",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "labels", "ens", "addresses"],
    compatibility: {
      compatibleWith: ["frontend-scaffold", "chain-data"],
      suggestedWith: ["dune-transaction-history"],
      requires: [],
    },
    defaultConfig: {
      includeENS: true,
      includeOwnerInfo: true,
      cacheDuration: 86400000,
    },
  },
  "dune-transaction-history": {
    id: "dune-transaction-history",
    name: "Transaction History",
    description: "Wallet transaction history",
    icon: "Database",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "transactions", "history", "wallet"],
    compatibility: {
      compatibleWith: ["frontend-scaffold", "onchain-activity"],
      suggestedWith: ["dune-address-labels"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "arbitrum",
      limit: 100,
      generateUI: true,
    },
  },
  "dune-gas-price": {
    id: "dune-gas-price",
    name: "Gas Price",
    description: "Gas price analytics and stats",
    icon: "Zap",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "gas", "price", "analytics"],
    compatibility: {
      compatibleWith: ["frontend-scaffold"],
      suggestedWith: ["rpc-provider"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "arbitrum",
      generateUI: true,
      cacheDuration: 60000,
    },
  },
  "dune-protocol-tvl": {
    id: "dune-protocol-tvl",
    name: "Protocol TVL",
    description: "Total Value Locked for DeFi protocols",
    icon: "Lock",
    logoAsset: "dune.png",
    color: "accent-purple",
    category: "analytics",
    tags: ["dune", "tvl", "defi", "protocol"],
    compatibility: {
      compatibleWith: ["frontend-scaffold"],
      suggestedWith: ["superposition-longtail"],
      requires: [],
    },
    defaultConfig: {
      blockchain: "arbitrum",
      generateUI: true,
      cacheDuration: 600000,
    },
  },

  // Pyth Oracle entry is defined above under analytics

  // ============================================
  // LOGIC & AUTOMATION (WEB2) CATEGORY
  // ============================================
  'if-else': {
    id: 'if-else',
    name: 'If / Else',
    description: 'Conditional branching based on expressions',
    icon: 'GitBranch',
    color: 'accent-amber',
    category: 'logic',
    tags: ['condition', 'branch', 'logic', 'if', 'else', 'web2'],
    compatibility: {
      compatibleWith: ['switch-case', 'http-api', 'transform', 'variable-store'],
      suggestedWith: ['loop-iterator', 'delay-timer'],
      requires: [],
    },
    defaultConfig: {
      conditionType: 'value-compare',
      condition: '',
      compareOperator: 'eq',
      compareValue: '',
    },
  },
  'switch-case': {
    id: 'switch-case',
    name: 'Switch / Case',
    description: 'Multi-way branching with pattern matching',
    icon: 'ListTree',
    color: 'accent-amber',
    category: 'logic',
    tags: ['switch', 'case', 'branch', 'logic', 'routing', 'web2'],
    compatibility: {
      compatibleWith: ['if-else', 'http-api', 'transform', 'variable-store'],
      suggestedWith: ['loop-iterator'],
      requires: [],
    },
    defaultConfig: {
      switchExpression: '',
      cases: [{ value: '', label: 'Case 1' }],
      hasDefault: true,
    },
  },
  'http-api': {
    id: 'http-api',
    name: 'HTTP API',
    description: 'Make external HTTP requests (GET, POST, PUT, DELETE)',
    icon: 'Globe',
    color: 'accent-amber',
    category: 'logic',
    tags: ['http', 'api', 'rest', 'fetch', 'request', 'web2', 'integration'],
    compatibility: {
      compatibleWith: ['transform', 'if-else', 'variable-store', 'email-smtp'],
      suggestedWith: ['delay-timer', 'loop-iterator'],
      requires: [],
    },
    defaultConfig: {
      method: 'GET',
      url: 'https://api.example.com/data',
      headers: [],
      bodyType: 'none',
      body: '',
      timeout: 30000,
      retries: 3,
      authType: 'none',
      responseMapping: '',
      generateProxy: true,
    },
  },
  'email-smtp': {
    id: 'email-smtp',
    name: 'Email',
    description: 'Send emails via SMTP or services (SendGrid, Resend, SES)',
    icon: 'Mail',
    color: 'accent-amber',
    category: 'logic',
    tags: ['email', 'smtp', 'sendgrid', 'resend', 'notification', 'web2'],
    compatibility: {
      compatibleWith: ['http-api', 'if-else', 'transform', 'variable-store'],
      suggestedWith: ['delay-timer'],
      requires: [],
    },
    defaultConfig: {
      provider: 'resend',
      to: '',
      subject: '',
      bodyTemplate: '',
      bodyFormat: 'html',
      fromName: '',
      fromEmail: '',
    },
  },
  'delay-timer': {
    id: 'delay-timer',
    name: 'Delay / Timer',
    description: 'Pause execution or schedule delayed actions',
    icon: 'Timer',
    color: 'accent-amber',
    category: 'logic',
    tags: ['delay', 'timer', 'wait', 'schedule', 'pause', 'web2'],
    compatibility: {
      compatibleWith: ['if-else', 'http-api', 'email-smtp', 'loop-iterator'],
      suggestedWith: ['variable-store'],
      requires: [],
    },
    defaultConfig: {
      delayType: 'fixed',
      delayMs: 1000,
      unit: 'seconds',
    },
  },
  'variable-store': {
    id: 'variable-store',
    name: 'Variable',
    description: 'Declare and set variables for use across blocks',
    icon: 'Variable',
    color: 'accent-amber',
    category: 'logic',
    tags: ['variable', 'store', 'state', 'data', 'assign', 'web2'],
    compatibility: {
      compatibleWith: ['if-else', 'switch-case', 'transform', 'loop-iterator'],
      suggestedWith: ['http-api'],
      requires: [],
    },
    defaultConfig: {
      variableName: 'myVariable',
      variableType: 'string',
      defaultValue: '',
      scope: 'local',
    },
  },
  'transform': {
    id: 'transform',
    name: 'Transform',
    description: 'Map and transform data between blocks',
    icon: 'Shuffle',
    color: 'accent-amber',
    category: 'logic',
    tags: ['transform', 'map', 'data', 'convert', 'json', 'web2'],
    compatibility: {
      compatibleWith: ['http-api', 'if-else', 'variable-store', 'email-smtp'],
      suggestedWith: ['loop-iterator'],
      requires: [],
    },
    defaultConfig: {
      transformType: 'template',
      inputMapping: '',
      outputFormat: 'json',
      transformExpression: '',
    },
  },
  'loop-iterator': {
    id: 'loop-iterator',
    name: 'Loop',
    description: 'Iterate over arrays or repeat actions N times',
    icon: 'Repeat',
    color: 'accent-amber',
    category: 'logic',
    tags: ['loop', 'iterate', 'repeat', 'for-each', 'batch', 'web2'],
    compatibility: {
      compatibleWith: ['if-else', 'http-api', 'transform', 'variable-store'],
      suggestedWith: ['delay-timer'],
      requires: [],
    },
    defaultConfig: {
      loopType: 'for-each',
      iterableExpression: '',
      count: 10,
      maxIterations: 1000,
    },
  },
  'web2-frontend-scaffold': {
    id: 'web2-frontend-scaffold',
    name: 'Web2 Frontend',
    description: 'Next.js scaffold without Web3 dependencies',
    icon: 'Layout',
    color: 'node-tertiary',
    category: 'app',
    tags: ['frontend', 'nextjs', 'react', 'web2', 'scaffold', 'app'],
    compatibility: {
      compatibleWith: ['http-api', 'email-smtp', 'if-else'],
      suggestedWith: ['transform', 'variable-store'],
      requires: [],
    },
    defaultConfig: {
      framework: 'nextjs',
      styling: 'tailwind',
      stateManagement: 'tanstack-query',
      authProvider: 'none',
      appName: 'My App',
    },
  },
};

/**
 * Get all plugin IDs
 */
export function getPluginIds(): string[] {
  return Object.keys(PLUGIN_REGISTRY);
}

/**
 * Get plugin by ID
 */
export function getPluginById(id: string): PluginRegistryEntry | undefined {
  return PLUGIN_REGISTRY[id];
}

/**
 * Get plugins by category
 */
export function getPluginsByCategory(category: string): PluginRegistryEntry[] {
  return Object.values(PLUGIN_REGISTRY).filter((p) => p.category === category);
}

/**
 * Search plugins by query (matches name, description, tags)
 */
export function searchPlugins(query: string): PluginRegistryEntry[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(PLUGIN_REGISTRY).filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((t) => t.toLowerCase().includes(lowerQuery)),
  );
}

/**
 * Get compatible plugins for a given plugin ID
 */
export function getCompatiblePlugins(pluginId: string): PluginRegistryEntry[] {
  const plugin = PLUGIN_REGISTRY[pluginId];
  if (!plugin) return [];

  return plugin.compatibility.compatibleWith
    .map((id) => PLUGIN_REGISTRY[id])
    .filter(Boolean) as PluginRegistryEntry[];
}

/**
 * Get suggested plugins for a given plugin ID
 */
export function getSuggestedPlugins(pluginId: string): PluginRegistryEntry[] {
  const plugin = PLUGIN_REGISTRY[pluginId];
  if (!plugin) return [];

  return plugin.compatibility.suggestedWith
    .map((id) => PLUGIN_REGISTRY[id])
    .filter(Boolean) as PluginRegistryEntry[];
}

/**
 * Get required plugins for a given plugin ID
 */
export function getRequiredPlugins(pluginId: string): PluginRegistryEntry[] {
  const plugin = PLUGIN_REGISTRY[pluginId];
  if (!plugin) return [];

  return plugin.compatibility.requires
    .map((id) => PLUGIN_REGISTRY[id])
    .filter(Boolean) as PluginRegistryEntry[];
}

/**
 * Get default config for a plugin
 */
export function getDefaultConfig(pluginId: string): Record<string, unknown> {
  return PLUGIN_REGISTRY[pluginId]?.defaultConfig ?? {};
}
