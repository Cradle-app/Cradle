import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ERC1155StylusConfig, type PathCategory } from '@dapp-forge/blueprint-schema';

/**
 * ERC1155 Stylus Multi-Token Plugin
 * 
 * Deploys ERC-1155 multi-tokens using Arbitrum Stylus contracts
 * and provides interaction capabilities
 */
export class ERC1155StylusPlugin extends BasePlugin<z.infer<typeof ERC1155StylusConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'erc1155-stylus',
    name: 'ERC-1155 Stylus Multi-Token',
    version: '0.1.0',
    description: 'Deploy and interact with ERC-1155 multi-tokens on Arbitrum Stylus',
    category: 'contracts',
    tags: ['erc1155', 'multi-token', 'nft', 'arbitrum', 'stylus', 'deployment'],
  };

  readonly configSchema = ERC1155StylusConfig as unknown as z.ZodType<z.infer<typeof ERC1155StylusConfig>>;

  /**
   * Path to the pre-built component package
   */
  readonly componentPath = 'packages/components/erc1155-stylus';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/erc1155-stylus';

  /**
   * Path mappings for intelligent file routing when frontend-scaffold is present
   * Only copies the interaction panel and cn utility - other static files are not needed
   */
  readonly componentPathMappings: Record<string, PathCategory> = {
    'src/ERC1155InteractionPanel.tsx': 'frontend-components',
    'src/cn.ts': 'frontend-lib',
    'contract/**': 'contract-source',
  };

  readonly ports: PluginPort[] = [
    {
      id: 'wallet-in',
      name: 'Wallet Connection',
      type: 'input',
      dataType: 'config',
      required: true,
    },
    {
      id: 'multitoken-out',
      name: 'Multi-Token Contract',
      type: 'output',
      dataType: 'contract',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ERC1155StylusConfig>> {
    return {
      collectionName: 'My Multi-Token Collection',
      baseUri: 'https://api.example.com/metadata/',
      network: 'arbitrum-sepolia',
      features: ['ownable', 'mintable', 'burnable', 'pausable', 'supply-tracking', 'batch-operations'],
      isDeployed: false,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate deployment script
    this.addFile(
      output,
      'deploy-erc1155.ts',
      generateDeployScript(config),
      'contract-scripts'
    );

    // Generate interaction utilities
    this.addFile(
      output,
      'erc1155-multitoken.ts',
      generateMultiTokenLib(config),
      'frontend-lib'
    );

    // Generate React component for multi-token interaction
    this.addFile(
      output,
      'ERC1155MultiTokenPanel.tsx',
      generateMultiTokenPanel(config),
      'frontend-components'
    );

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_ERC1155_ADDRESS', 'Deployed ERC1155 multi-token address', {
      required: false,
      defaultValue: config.contractAddress,
    });
    this.addEnvVar(output, 'PRIVATE_KEY', 'Private key for deployment and transactions', {
      required: true,
      secret: true,
    });
    this.addEnvVar(output, 'ERC1155_DEPLOYMENT_API_URL', 'URL of the ERC1155 deployment API', {
      required: false,
      defaultValue: 'http://localhost:4002',
    });

    // Add scripts
    this.addScript(output, 'deploy:multitoken', 'ts-node scripts/deploy-erc1155.ts', 'Deploy ERC1155 multi-token');
    this.addScript(output, 'multitoken:info', 'ts-node scripts/multitoken-info.ts', 'Get multi-token information');

    // Add documentation
    this.addDoc(
      output,
      'docs/erc1155-multitoken.md',
      'ERC-1155 Multi-Token',
      generateMultiTokenDocs(config)
    );

    context.logger.info(`Generated ERC1155 Stylus multi-token: ${config.collectionName}`, {
      nodeId: node.id,
      network: config.network,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}

function generateDeployScript(config: z.infer<typeof ERC1155StylusConfig>): string {
  return `/**
 * ERC-1155 Multi-Token Deployment Script
 * 
 * Usage: ts-node scripts/deploy-erc1155.ts
 */

import { deployERC1155CollectionViaAPI } from '@cradle/erc1155-stylus';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const apiUrl = process.env.ERC1155_DEPLOYMENT_API_URL || 'http://localhost:4002';
  const rpcEndpoint = process.env.RPC_ENDPOINT || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  console.log('Deploying ERC-1155 multi-token...');
  console.log('Name:', '${config.collectionName}');
  console.log('Base URI:', '${config.baseUri}');
  console.log('Network:', '${config.network}');

  const result = await deployERC1155CollectionViaAPI({
    name: '${config.collectionName}',
    baseUri: '${config.baseUri}',
    privateKey,
    rpcEndpoint,
    deploymentApiUrl: apiUrl,
  });

  console.log('\\n✅ Multi-token deployed successfully!');
  console.log('Contract Address:', result.collectionAddress);
  console.log('Transaction Hash:', result.txHash);
  console.log('\\nAdd this to your .env file:');
  console.log(\`NEXT_PUBLIC_ERC1155_ADDRESS=\${result.collectionAddress}\`);
}

main().catch(console.error);
`;
}

function generateMultiTokenLib(config: z.infer<typeof ERC1155StylusConfig>): string {
  return `/**
 * ERC-1155 Multi-Token Library
 * 
 * Utilities for interacting with the deployed multi-token
 */

import { 
  getCollectionInfo, 
  getBalance,
  getBalanceOfBatch,
  mint, 
  mintBatch,
  burn,
  burnBatch,
  type CollectionInfo,
} from '@cradle/erc1155-stylus';
import type { Address } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ERC1155_ADDRESS as Address;
const RPC_ENDPOINT = 'https://sepolia-rollup.arbitrum.io/rpc';

export async function fetchCollectionInfo(): Promise<CollectionInfo> {
  return getCollectionInfo(CONTRACT_ADDRESS, RPC_ENDPOINT);
}

export async function fetchBalance(account: Address, tokenId: bigint): Promise<string> {
  const balance = await getBalance(CONTRACT_ADDRESS, account, tokenId, RPC_ENDPOINT);
  return balance.formatted;
}

export async function fetchBalanceBatch(accounts: Address[], tokenIds: bigint[]): Promise<string[]> {
  const balances = await getBalanceOfBatch(CONTRACT_ADDRESS, accounts, tokenIds, RPC_ENDPOINT);
  return balances.map(b => b.formatted);
}

export async function mintTokens(
  to: Address, 
  tokenId: bigint,
  amount: string, 
  privateKey: string
): Promise<string> {
  return mint(CONTRACT_ADDRESS, to, tokenId, amount, privateKey, RPC_ENDPOINT);
}

export async function mintTokensBatch(
  to: Address, 
  tokenIds: bigint[],
  amounts: string[], 
  privateKey: string
): Promise<string> {
  return mintBatch(CONTRACT_ADDRESS, to, tokenIds, amounts, privateKey, RPC_ENDPOINT);
}

export async function burnTokens(
  tokenId: bigint,
  amount: string, 
  privateKey: string
): Promise<string> {
  return burn(CONTRACT_ADDRESS, tokenId, amount, privateKey, RPC_ENDPOINT);
}

export async function burnTokensBatch(
  tokenIds: bigint[],
  amounts: string[], 
  privateKey: string
): Promise<string> {
  return burnBatch(CONTRACT_ADDRESS, tokenIds, amounts, privateKey, RPC_ENDPOINT);
}

export const MULTITOKEN_CONFIG = {
  name: '${config.collectionName}',
  baseUri: '${config.baseUri}',
  network: '${config.network}',
  features: ${JSON.stringify(config.features)},
} as const;
`;
}

function generateMultiTokenPanel(config: z.infer<typeof ERC1155StylusConfig>): string {
  return `'use client';

/**
 * ERC-1155 Multi-Token Interaction Panel
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useERC1155Interactions } from '@cradle/erc1155-stylus';
import type { Address } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ERC1155_ADDRESS as Address;

export function ERC1155MultiTokenPanel() {
  const { address: userAddress } = useAccount();
  const [transferTo, setTransferTo] = useState('');
  const [transferTokenId, setTransferTokenId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('0');

  const multitoken = useERC1155Interactions({
    contractAddress: CONTRACT_ADDRESS,
    network: '${config.network}',
    userAddress,
  });

  const collectionInfo = multitoken.collectionInfo.status === 'success' ? multitoken.collectionInfo.data : null;
  const balance = multitoken.balance.status === 'success' ? multitoken.balance.data : null;

  // Fetch balance when token ID changes
  useEffect(() => {
    if (selectedTokenId && userAddress) {
      multitoken.refetchBalance(BigInt(selectedTokenId));
    }
  }, [selectedTokenId, userAddress]);

  const handleTransfer = async () => {
    if (!transferTo || !transferTokenId || !transferAmount) return;
    try {
      await multitoken.safeTransferFrom(
        userAddress as Address,
        transferTo as Address,
        BigInt(transferTokenId),
        BigInt(transferAmount)
      );
      setTransferTo('');
      setTransferTokenId('');
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-400">
          Multi-token not deployed yet. Run <code>pnpm deploy:multitoken</code> to deploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collection Info */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {collectionInfo?.name || '${config.collectionName}'}
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Base URI: {collectionInfo?.baseUri || '${config.baseUri}'}</p>
          <p className="text-xs font-mono truncate">{CONTRACT_ADDRESS}</p>
        </div>
      </div>

      {/* Balance Check */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Check Balance</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Token ID"
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <p className="text-sm text-gray-400">
            Balance: {balance?.balance?.toString() || '0'}
          </p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Transfer Tokens</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Token ID"
            value={transferTokenId}
            onChange={(e) => setTransferTokenId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={handleTransfer}
            disabled={multitoken.isLoading || !transferTo || !transferTokenId || !transferAmount}
            className="w-full px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
          >
            {multitoken.isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {multitoken.txState.status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction successful: {multitoken.txState.hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {multitoken.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{multitoken.error.message}</p>
        </div>
      )}
    </div>
  );
}
`;
}

function generateMultiTokenDocs(config: z.infer<typeof ERC1155StylusConfig>): string {
  return `# ${config.collectionName}

An ERC-1155 multi-token deployed on ${config.network === 'arbitrum' ? 'Arbitrum One' : 'Arbitrum Sepolia'} using Stylus.

## Collection Details

- **Name:** ${config.collectionName}
- **Base URI:** ${config.baseUri}
- **Network:** ${config.network}
- **Features:** ${config.features.join(', ')}

## Deployment

\`\`\`bash
pnpm deploy:multitoken
\`\`\`

This will deploy the multi-token contract and output the contract address.

## Usage

### Get Collection Info

\`\`\`typescript
import { fetchCollectionInfo } from '@/lib/erc1155-multitoken';

const info = await fetchCollectionInfo();
console.log(info.name, info.baseUri);
\`\`\`

### Check Balance

\`\`\`typescript
import { fetchBalance } from '@/lib/erc1155-multitoken';

const balance = await fetchBalance('0x...', 1n); // Check balance of token ID 1
console.log(balance);
\`\`\`

### Mint Tokens (Owner Only)

\`\`\`typescript
import { mintTokens } from '@/lib/erc1155-multitoken';

await mintTokens('0x...', 1n, '100', privateKey); // Mint 100 of token ID 1
\`\`\`

### Batch Mint

\`\`\`typescript
import { mintTokensBatch } from '@/lib/erc1155-multitoken';

await mintTokensBatch('0x...', [1n, 2n, 3n], ['100', '50', '25'], privateKey);
\`\`\`

### Transfer Tokens

Use the \`safeTransferFrom\` function through the interaction panel or SDK.

## Contract Features

${config.features.map(f => `- **${f}**: Enabled`).join('\n')}

## ERC-1155 Standard

ERC-1155 is a multi-token standard that allows:
- Multiple token types (fungible and non-fungible) in a single contract
- Batch operations for efficiency
- Safe transfer mechanisms
- Metadata URIs per token type
`;
}
