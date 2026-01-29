import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ERC721StylusConfig, type PathCategory } from '@dapp-forge/blueprint-schema';

/**
 * ERC721 Stylus NFT Plugin
 * 
 * Generates ERC-721 NFT contracts using Arbitrum Stylus
 * and provides interaction capabilities
 */
export class ERC721StylusPlugin extends BasePlugin<z.infer<typeof ERC721StylusConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'erc721-stylus',
    name: 'ERC-721 Stylus NFT',
    version: '0.1.0',
    description: 'Deploy and interact with ERC-721 NFTs on Arbitrum Stylus',
    category: 'contracts',
    tags: ['erc721', 'nft', 'arbitrum', 'stylus', 'deployment'],
  };

  readonly configSchema = ERC721StylusConfig as unknown as z.ZodType<z.infer<typeof ERC721StylusConfig>>;

  /**
   * Path to the pre-built component package
   */
  readonly componentPath = 'packages/components/erc721-stylus';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/erc721-stylus';

  /**
   * Path mappings for intelligent file routing when frontend-scaffold is present
   * Only copies the interaction panel and cn utility - other static files are not needed
   */
  readonly componentPathMappings: Record<string, PathCategory> = {
    'src/ERC721InteractionPanel.tsx': 'frontend-components',
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
      id: 'nft-out',
      name: 'NFT Contract',
      type: 'output',
      dataType: 'contract',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ERC721StylusConfig>> {
    return {
      collectionName: 'My NFT Collection',
      collectionSymbol: 'MNFT',
      baseUri: 'https://api.example.com/metadata/',
      network: 'arbitrum-sepolia',
      features: ['ownable', 'mintable', 'burnable', 'pausable', 'enumerable'],
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
      'deploy-erc721.ts',
      generateDeployScript(config),
      'contract-scripts'
    );

    // Generate interaction utilities
    this.addFile(
      output,
      'erc721-nft.ts',
      generateNFTLib(config),
      'frontend-lib'
    );

    // Generate React component for NFT interaction
    this.addFile(
      output,
      'ERC721NFTPanel.tsx',
      generateNFTPanel(config),
      'frontend-components'
    );

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_NFT_ADDRESS', 'Deployed ERC721 NFT address', {
      required: false,
      defaultValue: config.contractAddress,
    });
    this.addEnvVar(output, 'PRIVATE_KEY', 'Private key for deployment and transactions', {
      required: true,
      secret: true,
    });
    this.addEnvVar(output, 'ERC721_DEPLOYMENT_API_URL', 'URL of the ERC721 deployment API', {
      required: false,
      defaultValue: 'http://localhost:4001',
    });

    // Add scripts
    this.addScript(output, 'deploy:erc721', 'ts-node scripts/deploy-erc721.ts', 'Deploy ERC721 collection');
    this.addScript(output, 'nft:info', 'ts-node scripts/nft-info.ts', 'Get NFT collection information');

    // Add documentation
    this.addDoc(
      output,
      'docs/erc721-nft.md',
      'ERC-721 NFT Collection',
      generateNFTDocs(config)
    );

    context.logger.info(`Generated ERC721 Stylus NFT: ${config.collectionName}`, {
      nodeId: node.id,
      symbol: config.collectionSymbol,
      network: config.network,
      features: config.features,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}

function generateDeployScript(config: z.infer<typeof ERC721StylusConfig>): string {
  return `/**
 * ERC-721 NFT Deployment Script
 * 
 * Usage: ts-node scripts/deploy-erc721.ts
 */

import { deployERC721CollectionViaAPI } from '@cradle/erc721-stylus';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const apiUrl = process.env.ERC721_DEPLOYMENT_API_URL || 'http://localhost:4001';
  const rpcEndpoint = process.env.RPC_ENDPOINT || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  console.log('Deploying ERC-721 NFT collection...');
  console.log('Name:', '${config.collectionName}');
  console.log('Symbol:', '${config.collectionSymbol}');
  console.log('Base URI:', '${config.baseUri}');
  console.log('Network:', '${config.network}');

  const result = await deployERC721CollectionViaAPI({
    name: '${config.collectionName}',
    symbol: '${config.collectionSymbol}',
    baseUri: '${config.baseUri}',
    privateKey,
    rpcEndpoint,
    deploymentApiUrl: apiUrl,
  });

  console.log('\\n✅ NFT collection deployed successfully!');
  console.log('Contract Address:', result.collectionAddress);
  console.log('Transaction Hash:', result.txHash);
  console.log('\\nAdd this to your .env file:');
  console.log(\`NEXT_PUBLIC_NFT_ADDRESS=\${result.collectionAddress}\`);
}

main().catch(console.error);
`;
}

function generateNFTLib(config: z.infer<typeof ERC721StylusConfig>): string {
  return `/**
 * ERC-721 NFT Library
 * 
 * Utilities for interacting with the deployed NFT collection
 */

import { 
  getCollectionInfo, 
  getBalance, 
  getNFTInfo,
  mint, 
  burn,
  transferFrom,
  type CollectionInfo,
  type NFTInfo,
} from '@cradle/erc721-stylus';
import type { Address, Hash } from 'viem';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;
const RPC_ENDPOINT = '${config.network === 'arbitrum' ? 'https://arb1.arbitrum.io/rpc' : 'https://sepolia-rollup.arbitrum.io/rpc'}';

export async function fetchCollectionInfo(): Promise<CollectionInfo> {
  return getCollectionInfo(NFT_ADDRESS, RPC_ENDPOINT);
}

export async function fetchBalance(account: Address): Promise<bigint> {
  const balance = await getBalance(NFT_ADDRESS, account, RPC_ENDPOINT);
  return balance.balance;
}

export async function fetchNFTInfo(tokenId: bigint): Promise<NFTInfo> {
  return getNFTInfo(NFT_ADDRESS, tokenId, RPC_ENDPOINT);
}

export async function mintNFT(
  to: Address, 
  privateKey: string
): Promise<{ hash: Hash; tokenId: bigint }> {
  return mint(NFT_ADDRESS, to, privateKey, RPC_ENDPOINT);
}

export async function burnNFT(
  tokenId: bigint, 
  privateKey: string
): Promise<Hash> {
  return burn(NFT_ADDRESS, tokenId, privateKey, RPC_ENDPOINT);
}

export async function transferNFT(
  from: Address,
  to: Address, 
  tokenId: bigint, 
  privateKey: string
): Promise<Hash> {
  return transferFrom(NFT_ADDRESS, from, to, tokenId, privateKey, RPC_ENDPOINT);
}

export const NFT_CONFIG = {
  name: '${config.collectionName}',
  symbol: '${config.collectionSymbol}',
  baseUri: '${config.baseUri}',
  network: '${config.network}',
  features: ${JSON.stringify(config.features)},
} as const;
`;
}

function generateNFTPanel(config: z.infer<typeof ERC721StylusConfig>): string {
  return `'use client';

/**
 * ERC-721 NFT Interaction Panel
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useERC721Interactions } from '@cradle/erc721-stylus';
import type { Address } from 'viem';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;

export function ERC721NFTPanel() {
  const { address: userAddress } = useAccount();
  const [mintTo, setMintTo] = useState('');

  const nft = useERC721Interactions({
    contractAddress: NFT_ADDRESS,
    network: '${config.network}',
    userAddress,
  });

  const collectionInfo = nft.collectionInfo.status === 'success' ? nft.collectionInfo.data : null;
  const balance = nft.balance.status === 'success' ? nft.balance.data : null;

  const handleMint = async () => {
    if (!mintTo) return;
    try {
      const result = await nft.mint(mintTo as Address);
      console.log('Minted NFT #' + result.tokenId.toString());
      setMintTo('');
    } catch (error) {
      console.error('Mint failed:', error);
    }
  };

  if (!NFT_ADDRESS) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-400">
          NFT collection not deployed yet. Run <code>pnpm deploy:erc721</code> to deploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {collectionInfo?.name || '${config.collectionName}'} ({collectionInfo?.symbol || '${config.collectionSymbol}'})
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Total Supply: {collectionInfo?.formattedTotalSupply || '0'}</p>
          <p>Your NFTs: {balance?.balance?.toString() || '0'}</p>
          <p className="text-xs font-mono truncate">{NFT_ADDRESS}</p>
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Mint NFT</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={mintTo}
            onChange={(e) => setMintTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={handleMint}
            disabled={nft.isLoading || !mintTo}
            className="w-full px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
          >
            {nft.isLoading ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      </div>

      {nft.txState.status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction successful: {nft.txState.hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {nft.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{nft.error.message}</p>
        </div>
      )}
    </div>
  );
}
`;
}

function generateNFTDocs(config: z.infer<typeof ERC721StylusConfig>): string {
  const features = config.features || ['ownable', 'mintable', 'burnable', 'pausable', 'enumerable'];

  return `# ${config.collectionName} (${config.collectionSymbol})

An ERC-721 NFT collection for ${config.network === 'arbitrum' ? 'Arbitrum One' : 'Arbitrum Sepolia'} using Stylus.

## Collection Details

- **Name:** ${config.collectionName}
- **Symbol:** ${config.collectionSymbol}
- **Base URI:** ${config.baseUri}
- **Network:** ${config.network}
- **Features:** ${features.join(', ')}

## Deployment

\`\`\`bash
pnpm deploy:erc721
\`\`\`

This will deploy the NFT collection and output the contract address.

## Usage

### Get Collection Info

\`\`\`typescript
import { fetchCollectionInfo } from '@/lib/erc721-nft';

const info = await fetchCollectionInfo();
console.log(info.name, info.symbol, info.totalSupply);
\`\`\`

### Mint NFT (Owner Only)

\`\`\`typescript
import { mintNFT } from '@/lib/erc721-nft';

const { hash, tokenId } = await mintNFT('0x...', privateKey);
console.log('Minted NFT #' + tokenId);
\`\`\`

### Transfer NFT

\`\`\`typescript
import { transferNFT } from '@/lib/erc721-nft';

await transferNFT('0x...from', '0x...to', 1n, privateKey);
\`\`\`

## Contract Features

${features.map(f => `- **${f}**: Enabled`).join('\n')}
`;
}
