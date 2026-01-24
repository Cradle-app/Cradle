import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import {
  DuneExecuteSQLConfig,
  DuneTokenPriceConfig,
  DuneWalletBalancesConfig,
  DuneDEXVolumeConfig,
  DuneNFTFloorConfig,
  DuneAddressLabelsConfig,
  DuneTransactionHistoryConfig,
  DuneGasPriceConfig,
  DuneProtocolTVLConfig,
} from '@dapp-forge/blueprint-schema';
import {
  generateDuneClient,
  generateDuneHooks,
  generateTokenPriceComponent,
  generateWalletBalancesComponent,
  generateDEXVolumeComponent,
  generateNFTFloorComponent,
  generateAddressLabelsComponent,
  generateTransactionHistoryComponent,
  generateGasPriceComponent,
  generateProtocolTVLComponent,
} from './templates';

/**
 * Base Dune Analytics Plugin
 * Provides shared functionality for all Dune plugins
 */
abstract class BaseDunePlugin<TConfig> extends BasePlugin<TConfig> {
  protected addDuneEnvVars(output: CodegenOutput): void {
    this.addEnvVar(output, 'DUNE_API_KEY', 'Dune Analytics API key for blockchain data queries', {
      required: true,
      secret: true,
    });
  }
}

/**
 * Dune Execute SQL Plugin
 * Execute custom SQL queries on Dune's blockchain data warehouse
 */
export class DuneExecuteSQLPlugin extends BaseDunePlugin<z.infer<typeof DuneExecuteSQLConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-execute-sql',
    name: 'Dune Execute SQL',
    version: '0.1.0',
    description: 'Execute custom SQL queries on Dune\'s blockchain data warehouse',
    category: 'analytics',
    tags: ['dune', 'analytics', 'sql', 'blockchain', 'data'],
  };

  readonly configSchema = DuneExecuteSQLConfig as unknown as z.ZodType<z.infer<typeof DuneExecuteSQLConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'query-out',
      name: 'Query Results',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneExecuteSQLConfig>> {
    return {
      performanceMode: 'medium',
      timeout: 60000,
      generateHooks: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';

    // Generate Dune API client with only execute-sql feature
    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'execute-sql'));

    // Generate React hooks for SQL queries
    if (config.generateHooks) {
      this.addFile(output, `${hooksDir}/useDuneQuery.ts`, generateDuneHooks(config));
    }

    // Add environment variables
    this.addDuneEnvVars(output);

    // Add documentation
    this.addDoc(output, 'docs/dune/execute-sql.md', 'Dune Execute SQL', generateExecuteSQLDocs(config));

    context.logger.info('Generated Dune Execute SQL utilities', {
      nodeId: node.id,
      performanceMode: config.performanceMode,
    });

    return output;
  }
}

/**
 * Dune Token Price Plugin
 * Fetch latest token prices from Dune's prices.latest table
 */
export class DuneTokenPricePlugin extends BaseDunePlugin<z.infer<typeof DuneTokenPriceConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-token-price',
    name: 'Dune Token Price',
    version: '0.1.0',
    description: 'Fetch latest token prices across multiple blockchains using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'prices', 'tokens', 'defi', 'analytics'],
  };

  readonly configSchema = DuneTokenPriceConfig as unknown as z.ZodType<z.infer<typeof DuneTokenPriceConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'price-out',
      name: 'Token Prices',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneTokenPriceConfig>> {
    return {
      blockchain: 'arbitrum',
      cacheEnabled: true,
      cacheDuration: 60000,
      generateUI: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    // Generate Dune client with token-price feature only
    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'token-price'));

    // Generate token price hooks
    this.addFile(output, `${hooksDir}/useTokenPrice.ts`, generateDuneHooks(config, 'token-price'));

    // Generate UI components if enabled
    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/TokenPriceCard.tsx`, generateTokenPriceComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/token-price.md', 'Dune Token Price', generateTokenPriceDocs(config));

    context.logger.info('Generated Dune Token Price utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

/**
 * Dune Wallet Balances Plugin
 * Fetch wallet token balances using Dune's balance tables
 */
export class DuneWalletBalancesPlugin extends BaseDunePlugin<z.infer<typeof DuneWalletBalancesConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-wallet-balances',
    name: 'Dune Wallet Balances',
    version: '0.1.0',
    description: 'Fetch wallet token balances with USD values using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'wallet', 'balances', 'portfolio', 'analytics'],
  };

  readonly configSchema = DuneWalletBalancesConfig as unknown as z.ZodType<z.infer<typeof DuneWalletBalancesConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'balances-out',
      name: 'Wallet Balances',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneWalletBalancesConfig>> {
    return {
      blockchain: 'arbitrum',
      minBalanceUsd: 1,
      includeNFTs: false,
      generateUI: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'wallet-balances'));
    this.addFile(output, `${hooksDir}/useWalletBalances.ts`, generateDuneHooks(config, 'wallet-balances'));

    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/WalletBalances.tsx`, generateWalletBalancesComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/wallet-balances.md', 'Dune Wallet Balances', generateWalletBalancesDocs(config));

    context.logger.info('Generated Dune Wallet Balances utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

/**
 * Dune DEX Volume Plugin
 * Fetch DEX trading volume and statistics
 */
export class DuneDEXVolumePlugin extends BaseDunePlugin<z.infer<typeof DuneDEXVolumeConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-dex-volume',
    name: 'Dune DEX Volume',
    version: '0.1.0',
    description: 'Fetch DEX trading volume and statistics using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'dex', 'trading', 'volume', 'analytics'],
  };

  readonly configSchema = DuneDEXVolumeConfig as unknown as z.ZodType<z.infer<typeof DuneDEXVolumeConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'volume-out',
      name: 'DEX Volume',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneDEXVolumeConfig>> {
    return {
      blockchain: 'arbitrum',
      timeRange: '24h',
      generateUI: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'dex-volume'));
    this.addFile(output, `${hooksDir}/useDEXVolume.ts`, generateDuneHooks(config, 'dex-volume'));

    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/DEXVolumeChart.tsx`, generateDEXVolumeComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/dex-volume.md', 'Dune DEX Volume', generateDEXVolumeDocs(config));

    context.logger.info('Generated Dune DEX Volume utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

/**
 * Dune NFT Floor Price Plugin
 * Fetch NFT collection floor prices and statistics
 */
export class DuneNFTFloorPlugin extends BaseDunePlugin<z.infer<typeof DuneNFTFloorConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-nft-floor',
    name: 'Dune NFT Floor Price',
    version: '0.1.0',
    description: 'Fetch NFT collection floor prices and statistics using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'nft', 'floor-price', 'collections', 'analytics'],
  };

  readonly configSchema = DuneNFTFloorConfig as unknown as z.ZodType<z.infer<typeof DuneNFTFloorConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'nft-out',
      name: 'NFT Floor Data',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneNFTFloorConfig>> {
    return {
      blockchain: 'ethereum',
      generateUI: true,
      cacheDuration: 300000,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'nft-floor'));
    this.addFile(output, `${hooksDir}/useNFTFloor.ts`, generateDuneHooks(config, 'nft-floor'));

    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/NFTFloorCard.tsx`, generateNFTFloorComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/nft-floor.md', 'Dune NFT Floor Price', generateNFTFloorDocs(config));

    context.logger.info('Generated Dune NFT Floor utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

/**
 * Dune Address Labels Plugin
 * Fetch human-readable labels for blockchain addresses
 */
export class DuneAddressLabelsPlugin extends BaseDunePlugin<z.infer<typeof DuneAddressLabelsConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-address-labels',
    name: 'Dune Address Labels',
    version: '0.1.0',
    description: 'Fetch human-readable labels for blockchain addresses using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'labels', 'ens', 'addresses', 'analytics'],
  };

  readonly configSchema = DuneAddressLabelsConfig as unknown as z.ZodType<z.infer<typeof DuneAddressLabelsConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'labels-out',
      name: 'Address Labels',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneAddressLabelsConfig>> {
    return {
      includeENS: true,
      includeOwnerInfo: true,
      cacheDuration: 86400000, // 24 hours
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'address-labels'));
    this.addFile(output, `${hooksDir}/useAddressLabels.ts`, generateDuneHooks(config, 'address-labels'));
    this.addFile(output, `${componentsDir}/AddressLabel.tsx`, generateAddressLabelsComponent(config));

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/address-labels.md', 'Dune Address Labels', generateAddressLabelsDocs(config));

    context.logger.info('Generated Dune Address Labels utilities', {
      nodeId: node.id,
    });

    return output;
  }
}

/**
 * Dune Transaction History Plugin
 * Fetch transaction history for a wallet
 */
export class DuneTransactionHistoryPlugin extends BaseDunePlugin<z.infer<typeof DuneTransactionHistoryConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-transaction-history',
    name: 'Dune Transaction History',
    version: '0.1.0',
    description: 'Fetch transaction history for wallets using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'transactions', 'history', 'wallet', 'analytics'],
  };

  readonly configSchema = DuneTransactionHistoryConfig as unknown as z.ZodType<z.infer<typeof DuneTransactionHistoryConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'txns-out',
      name: 'Transaction History',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneTransactionHistoryConfig>> {
    return {
      blockchain: 'arbitrum',
      limit: 100,
      generateUI: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'transaction-history'));
    this.addFile(output, `${hooksDir}/useTransactionHistory.ts`, generateDuneHooks(config, 'transaction-history'));

    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/TransactionHistory.tsx`, generateTransactionHistoryComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/transaction-history.md', 'Dune Transaction History', generateTransactionHistoryDocs(config));

    context.logger.info('Generated Dune Transaction History utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

/**
 * Dune Gas Price Plugin
 * Fetch gas price analytics
 */
export class DuneGasPricePlugin extends BaseDunePlugin<z.infer<typeof DuneGasPriceConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-gas-price',
    name: 'Dune Gas Price Analytics',
    version: '0.1.0',
    description: 'Fetch gas price analytics and statistics using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'gas', 'fees', 'analytics'],
  };

  readonly configSchema = DuneGasPriceConfig as unknown as z.ZodType<z.infer<typeof DuneGasPriceConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'gas-out',
      name: 'Gas Analytics',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneGasPriceConfig>> {
    return {
      blockchain: 'arbitrum',
      generateUI: true,
      cacheDuration: 60000,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'gas-price'));
    this.addFile(output, `${hooksDir}/useGasPrice.ts`, generateDuneHooks(config, 'gas-price'));

    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/GasPriceCard.tsx`, generateGasPriceComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/gas-price.md', 'Dune Gas Price Analytics', generateGasPriceDocs(config));

    context.logger.info('Generated Dune Gas Price utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

/**
 * Dune Protocol TVL Plugin
 * Fetch Total Value Locked for DeFi protocols
 */
export class DuneProtocolTVLPlugin extends BaseDunePlugin<z.infer<typeof DuneProtocolTVLConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'dune-protocol-tvl',
    name: 'Dune Protocol TVL',
    version: '0.1.0',
    description: 'Fetch Total Value Locked for DeFi protocols using Dune Analytics',
    category: 'analytics',
    tags: ['dune', 'tvl', 'defi', 'protocols', 'analytics'],
  };

  readonly configSchema = DuneProtocolTVLConfig as unknown as z.ZodType<z.infer<typeof DuneProtocolTVLConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'tvl-out',
      name: 'Protocol TVL',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DuneProtocolTVLConfig>> {
    return {
      blockchain: 'arbitrum',
      generateUI: true,
      cacheDuration: 600000,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/dune';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/dune';

    this.addFile(output, `${libDir}/dune-client.ts`, generateDuneClient(config, 'protocol-tvl'));
    this.addFile(output, `${hooksDir}/useProtocolTVL.ts`, generateDuneHooks(config, 'protocol-tvl'));

    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/ProtocolTVLCard.tsx`, generateProtocolTVLComponent(config));
    }

    this.addDuneEnvVars(output);
    this.addDoc(output, 'docs/dune/protocol-tvl.md', 'Dune Protocol TVL', generateProtocolTVLDocs(config));

    context.logger.info('Generated Dune Protocol TVL utilities', {
      nodeId: node.id,
      blockchain: config.blockchain,
    });

    return output;
  }
}

// Documentation generators
function generateExecuteSQLDocs(config: z.infer<typeof DuneExecuteSQLConfig>): string {
  return `# Dune Execute SQL

Execute custom SQL queries on Dune's blockchain data warehouse.

## Configuration

- **Performance Mode**: ${config.performanceMode}
- **Timeout**: ${config.timeout}ms

## Usage

\`\`\`tsx
import { useDuneQuery } from '@/hooks/useDuneQuery';

function MyComponent() {
  const { data, isLoading, error, execute } = useDuneQuery();
  
  const runQuery = async () => {
    await execute({
      sql: "SELECT * FROM dex.trades LIMIT 10",
      performance: "${config.performanceMode}"
    });
  };
  
  return (
    <div>
      <button onClick={runQuery}>Run Query</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
\`\`\`
`;
}

function generateTokenPriceDocs(config: z.infer<typeof DuneTokenPriceConfig>): string {
  return `# Dune Token Price

Fetch latest token prices from Dune's prices.latest table.

## Configuration

- **Blockchain**: ${config.blockchain}
- **Cache Duration**: ${config.cacheDuration}ms

## Usage

\`\`\`tsx
import { useTokenPrice } from '@/hooks/useTokenPrice';

function PriceDisplay() {
  const { data: price, isLoading } = useTokenPrice({
    blockchain: '${config.blockchain}',
    contractAddress: '0x...'
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return <TokenPriceCard price={price} />;
}
\`\`\`
`;
}

function generateWalletBalancesDocs(config: z.infer<typeof DuneWalletBalancesConfig>): string {
  return `# Dune Wallet Balances

Fetch wallet token balances with USD values.

## Configuration

- **Blockchain**: ${config.blockchain}
- **Min Balance USD**: $${config.minBalanceUsd}
- **Include NFTs**: ${config.includeNFTs}

## Usage

\`\`\`tsx
import { useWalletBalances } from '@/hooks/useWalletBalances';

function Portfolio() {
  const { data: balances, isLoading } = useWalletBalances({
    address: '0x...'
  });
  
  return <WalletBalances balances={balances} />;
}
\`\`\`
`;
}

function generateDEXVolumeDocs(config: z.infer<typeof DuneDEXVolumeConfig>): string {
  return `# Dune DEX Volume

Fetch DEX trading volume and statistics.

## Configuration

- **Blockchain**: ${config.blockchain}
- **Time Range**: ${config.timeRange}

## Usage

\`\`\`tsx
import { useDEXVolume } from '@/hooks/useDEXVolume';

function VolumeChart() {
  const { data: volume } = useDEXVolume({
    blockchain: '${config.blockchain}',
    timeRange: '${config.timeRange}'
  });
  
  return <DEXVolumeChart data={volume} />;
}
\`\`\`
`;
}

function generateNFTFloorDocs(config: z.infer<typeof DuneNFTFloorConfig>): string {
  return `# Dune NFT Floor Price

Fetch NFT collection floor prices and statistics.

## Usage

\`\`\`tsx
import { useNFTFloor } from '@/hooks/useNFTFloor';

function NFTStats() {
  const { data: floor } = useNFTFloor({
    collectionAddress: '0x...'
  });
  
  return <NFTFloorCard data={floor} />;
}
\`\`\`
`;
}

function generateAddressLabelsDocs(config: z.infer<typeof DuneAddressLabelsConfig>): string {
  return `# Dune Address Labels

Fetch human-readable labels for blockchain addresses.

## Configuration

- **Include ENS**: ${config.includeENS}
- **Include Owner Info**: ${config.includeOwnerInfo}

## Usage

\`\`\`tsx
import { useAddressLabels } from '@/hooks/useAddressLabels';

function AddressDisplay({ address }) {
  const { data: label } = useAddressLabels(address);
  
  return <AddressLabel label={label} />;
}
\`\`\`
`;
}

function generateTransactionHistoryDocs(config: z.infer<typeof DuneTransactionHistoryConfig>): string {
  return `# Dune Transaction History

Fetch transaction history for wallets.

## Configuration

- **Blockchain**: ${config.blockchain}
- **Limit**: ${config.limit}

## Usage

\`\`\`tsx
import { useTransactionHistory } from '@/hooks/useTransactionHistory';

function TxHistory({ address }) {
  const { data: transactions } = useTransactionHistory({
    address,
    limit: ${config.limit}
  });
  
  return <TransactionHistory transactions={transactions} />;
}
\`\`\`
`;
}

function generateGasPriceDocs(config: z.infer<typeof DuneGasPriceConfig>): string {
  return `# Dune Gas Price Analytics

Fetch gas price analytics and statistics.

## Configuration

- **Blockchain**: ${config.blockchain}

## Usage

\`\`\`tsx
import { useGasPrice } from '@/hooks/useGasPrice';

function GasTracker() {
  const { data: gas } = useGasPrice({
    blockchain: '${config.blockchain}'
  });
  
  return <GasPriceCard data={gas} />;
}
\`\`\`
`;
}

function generateProtocolTVLDocs(config: z.infer<typeof DuneProtocolTVLConfig>): string {
  return `# Dune Protocol TVL

Fetch Total Value Locked for DeFi protocols.

## Configuration

- **Blockchain**: ${config.blockchain}

## Usage

\`\`\`tsx
import { useProtocolTVL } from '@/hooks/useProtocolTVL';

function TVLDisplay() {
  const { data: tvl } = useProtocolTVL({
    protocol: 'uniswap-v3'
  });
  
  return <ProtocolTVLCard data={tvl} />;
}
\`\`\`
`;
}
