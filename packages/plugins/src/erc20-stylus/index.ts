import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ERC20StylusConfig, type PathCategory } from '@dapp-forge/blueprint-schema';

/**
 * ERC20 Stylus Token Plugin
 * 
 * Deploys ERC-20 tokens using Arbitrum Stylus contracts
 * and provides interaction capabilities
 */
export class ERC20StylusPlugin extends BasePlugin<z.infer<typeof ERC20StylusConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'erc20-stylus',
    name: 'ERC-20 Stylus Token',
    version: '0.1.0',
    description: 'Deploy and interact with ERC-20 tokens on Arbitrum Stylus',
    category: 'contracts',
    tags: ['erc20', 'token', 'arbitrum', 'stylus', 'deployment'],
  };

  readonly configSchema = ERC20StylusConfig as unknown as z.ZodType<z.infer<typeof ERC20StylusConfig>>;

  /**
   * Path to the pre-built component package
   */
  readonly componentPath = 'packages/components/erc20-stylus';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/erc20-stylus';

  /**
   * Path mappings for intelligent file routing when frontend-scaffold is present
   * Copies the interaction panel and cn utility together
   */
  readonly componentPathMappings: Record<string, PathCategory> = {
    'src/ERC20InteractionPanel.tsx': 'frontend-components',
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
      id: 'token-out',
      name: 'Token Contract',
      type: 'output',
      dataType: 'contract',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ERC20StylusConfig>> {
    return {
      tokenName: 'My Token',
      tokenSymbol: 'MTK',
      initialSupply: '1000000',
      network: 'arbitrum-sepolia',
      features: ['ownable', 'mintable', 'burnable', 'pausable'],
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
      'deploy-erc20.ts',
      generateDeployScript(config),
      'contract-scripts'
    );

    // Generate interaction utilities
    this.addFile(
      output,
      'erc20-token.ts',
      generateTokenLib(config),
      'frontend-lib'
    );

    // Generate React component for token interaction
    this.addFile(
      output,
      'ERC20TokenPanel.tsx',
      generateTokenPanel(config),
      'frontend-components'
    );

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_TOKEN_ADDRESS', 'Deployed ERC20 token address', {
      required: false,
      defaultValue: config.contractAddress,
    });
    this.addEnvVar(output, 'PRIVATE_KEY', 'Private key for deployment and transactions', {
      required: true,
      secret: true,
    });
    this.addEnvVar(output, 'ERC20_DEPLOYMENT_API_URL', 'URL of the ERC20 deployment API', {
      required: false,
      defaultValue: 'http://localhost:4000',
    });

    // Add scripts
    this.addScript(output, 'deploy:token', 'ts-node scripts/deploy-erc20.ts', 'Deploy ERC20 token');
    this.addScript(output, 'token:info', 'ts-node scripts/token-info.ts', 'Get token information');

    // Add documentation
    this.addDoc(
      output,
      'docs/erc20-token.md',
      'ERC-20 Token',
      generateTokenDocs(config)
    );

    context.logger.info(`Generated ERC20 Stylus token: ${config.tokenName}`, {
      nodeId: node.id,
      symbol: config.tokenSymbol,
      network: config.network,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}

function generateDeployScript(config: z.infer<typeof ERC20StylusConfig>): string {
  return `/**
 * ERC-20 Token Deployment Script
 * 
 * Usage: ts-node scripts/deploy-erc20.ts
 */

import { deployERC20TokenViaAPI } from '@cradle/erc20-stylus';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const apiUrl = process.env.ERC20_DEPLOYMENT_API_URL || 'http://localhost:4000';
  const rpcEndpoint = process.env.RPC_ENDPOINT || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  console.log('Deploying ERC-20 token...');
  console.log('Name:', '${config.tokenName}');
  console.log('Symbol:', '${config.tokenSymbol}');
  console.log('Initial Supply:', '${config.initialSupply}');
  console.log('Network:', '${config.network}');

  const result = await deployERC20TokenViaAPI({
    name: '${config.tokenName}',
    symbol: '${config.tokenSymbol}',
    initialSupply: '${config.initialSupply}',
    privateKey,
    rpcEndpoint,
    deploymentApiUrl: apiUrl,
  });

  console.log('\\n✅ Token deployed successfully!');
  console.log('Token Address:', result.tokenAddress);
  console.log('Transaction Hash:', result.txHash);
  console.log('\\nAdd this to your .env file:');
  console.log(\`NEXT_PUBLIC_TOKEN_ADDRESS=\${result.tokenAddress}\`);
}

main().catch(console.error);
`;
}

function generateTokenLib(config: z.infer<typeof ERC20StylusConfig>): string {
  return `/**
 * ERC-20 Token Library
 * 
 * Utilities for interacting with the deployed token
 */

import { 
  getTokenInfo, 
  getBalance, 
  transfer, 
  mint, 
  burn,
  type TokenInfo,
} from '@cradle/erc20-stylus';
import type { Address } from 'viem';

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as Address;
const RPC_ENDPOINT = 'https://sepolia-rollup.arbitrum.io/rpc';

export async function fetchTokenInfo(): Promise<TokenInfo> {
  return getTokenInfo(TOKEN_ADDRESS, RPC_ENDPOINT);
}

export async function fetchBalance(account: Address): Promise<string> {
  const balance = await getBalance(TOKEN_ADDRESS, account, RPC_ENDPOINT);
  return balance.formatted;
}

export async function sendTokens(
  to: Address, 
  amount: string, 
  privateKey: string
): Promise<string> {
  return transfer(TOKEN_ADDRESS, to, amount, privateKey, RPC_ENDPOINT);
}

export async function mintTokens(
  to: Address, 
  amount: string, 
  privateKey: string
): Promise<string> {
  return mint(TOKEN_ADDRESS, to, amount, privateKey, RPC_ENDPOINT);
}

export async function burnTokens(
  amount: string, 
  privateKey: string
): Promise<string> {
  return burn(TOKEN_ADDRESS, amount, privateKey, RPC_ENDPOINT);
}

export const TOKEN_CONFIG = {
  name: '${config.tokenName}',
  symbol: '${config.tokenSymbol}',
  network: '${config.network}',
  features: ${JSON.stringify(config.features)},
} as const;
`;
}

function generateTokenPanel(config: z.infer<typeof ERC20StylusConfig>): string {
  return `'use client';

/**
 * ERC-20 Token Interaction Panel
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useERC20Interactions } from '@cradle/erc20-stylus';
import type { Address } from 'viem';

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as Address;

export function ERC20TokenPanel() {
  const { address: userAddress } = useAccount();
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const token = useERC20Interactions({
    contractAddress: TOKEN_ADDRESS,
    network: '${config.network}',
    userAddress,
  });

  const tokenInfo = token.tokenInfo.status === 'success' ? token.tokenInfo.data : null;
  const balance = token.balance.status === 'success' ? token.balance.data : null;

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;
    try {
      await token.transfer(transferTo as Address, transferAmount);
      setTransferTo('');
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  if (!TOKEN_ADDRESS) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-400">
          Token not deployed yet. Run <code>pnpm deploy:token</code> to deploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Token Info */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {tokenInfo?.name || '${config.tokenName}'} ({tokenInfo?.symbol || '${config.tokenSymbol}'})
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Total Supply: {tokenInfo?.formattedTotalSupply || '...'}</p>
          <p>Your Balance: {balance?.formatted || '0'}</p>
          <p className="text-xs font-mono truncate">{TOKEN_ADDRESS}</p>
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
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={handleTransfer}
            disabled={token.isLoading || !transferTo || !transferAmount}
            className="w-full px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            {token.isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {token.txState.status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction successful: {token.txState.hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {token.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{token.error.message}</p>
        </div>
      )}
    </div>
  );
}
`;
}

function generateTokenDocs(config: z.infer<typeof ERC20StylusConfig>): string {
  return `# ${config.tokenName} (${config.tokenSymbol})

An ERC-20 token deployed on ${config.network === 'arbitrum' ? 'Arbitrum One' : 'Arbitrum Sepolia'} using Stylus.

## Token Details

- **Name:** ${config.tokenName}
- **Symbol:** ${config.tokenSymbol}
- **Initial Supply:** ${config.initialSupply}
- **Network:** ${config.network}
- **Features:** ${config.features.join(', ')}

## Deployment

\`\`\`bash
pnpm deploy:token
\`\`\`

This will deploy the token and output the contract address.

## Usage

### Get Token Info

\`\`\`typescript
import { fetchTokenInfo } from '@/lib/erc20-token';

const info = await fetchTokenInfo();
console.log(info.name, info.symbol, info.formattedTotalSupply);
\`\`\`

### Transfer Tokens

\`\`\`typescript
import { sendTokens } from '@/lib/erc20-token';

await sendTokens('0x...', '100', privateKey);
\`\`\`

### Mint Tokens (Owner Only)

\`\`\`typescript
import { mintTokens } from '@/lib/erc20-token';

await mintTokens('0x...', '1000', privateKey);
\`\`\`

## Contract Features

${config.features.map(f => `- **${f}**: Enabled`).join('\n')}
`;
}
