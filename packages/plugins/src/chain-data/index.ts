import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ChainDataConfig } from '@dapp-forge/blueprint-schema';
import {
  generateDataClient,
  generateDataHooks,
  generateTokenComponents,
  generateNFTComponents,
} from './templates';

/**
 * Chain Data Plugin
 * Generates on-chain data fetching utilities using Moralis/Alchemy
 */
export class ChainDataPlugin extends BasePlugin<z.infer<typeof ChainDataConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'chain-data',
    name: 'Chain Data',
    version: '0.1.0',
    description: 'Token/NFT data fetching with Moralis or Alchemy Enhanced APIs',
    category: 'app',
    tags: ['data', 'tokens', 'nft', 'moralis', 'alchemy', 'portfolio'],
  };

  readonly configSchema = ChainDataConfig as unknown as z.ZodType<z.infer<typeof ChainDataConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'data-out',
      name: 'Data Hooks',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ChainDataConfig>> {
    return {
      provider: 'alchemy',
      features: ['token-balances', 'nft-data', 'transaction-history'],
      cacheEnabled: true,
      cacheDuration: 60000,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate data client
    this.addFile(output, 'data-client.ts', generateDataClient(config), 'frontend-lib');

    // Generate React hooks
    this.addFile(output, 'useChainData.ts', generateDataHooks(config), 'frontend-hooks');

    // Generate token components if enabled
    if (config.features.includes('token-balances')) {
      this.addFile(output, 'TokenList.tsx', generateTokenComponents(config), 'frontend-components');
    }

    // Generate NFT components if enabled
    if (config.features.includes('nft-data')) {
      this.addFile(output, 'NFTGallery.tsx', generateNFTComponents(config), 'frontend-components');
    }

    // Add environment variables
    if (config.provider === 'alchemy') {
      this.addEnvVar(output, 'NEXT_PUBLIC_ALCHEMY_API_KEY', 'Alchemy API key for data fetching', {
        required: true,
      });
    } else if (config.provider === 'moralis') {
      this.addEnvVar(output, 'NEXT_PUBLIC_MORALIS_API_KEY', 'Moralis API key', {
        required: true,
      });
    }

    // Add documentation
    this.addDoc(output, 'docs/data/chain-data.md', 'Chain Data', generateDataDocs(config));

    context.logger.info('Generated chain data utilities', {
      nodeId: node.id,
      provider: config.provider,
    });

    return output;
  }
}

function generateDataDocs(config: z.infer<typeof ChainDataConfig>): string {
  return `# Chain Data

On-chain data fetching using ${config.provider === 'alchemy' ? 'Alchemy Enhanced APIs' : 'Moralis Web3 API'}.

## Features

${config.features.map(f => `- **${f}**: Enabled`).join('\n')}

## Usage

\`\`\`tsx
import { useTokenBalances, useNFTs, useTransactionHistory } from '@/hooks/useChainData';

function Portfolio() {
  const { data: tokens } = useTokenBalances();
  const { data: nfts } = useNFTs();
  
  return (
    <div>
      <TokenList tokens={tokens} />
      <NFTGallery nfts={nfts} />
    </div>
  );
}
\`\`\`
`;
}

export { generateDataClient, generateDataHooks };

