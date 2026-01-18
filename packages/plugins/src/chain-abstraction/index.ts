import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ChainAbstractionConfig } from '@dapp-forge/blueprint-schema';
import { generateAbstractionProvider, generateAbstractionHooks, generateUnifiedBalance } from './templates';

/**
 * Chain Abstraction Plugin
 * Generates unified multi-chain UX with Arcana SDK
 */
export class ChainAbstractionPlugin extends BasePlugin<z.infer<typeof ChainAbstractionConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'chain-abstraction',
    name: 'Chain Abstraction',
    version: '0.1.0',
    description: 'Unified multi-chain UX with automatic chain switching and bridging',
    category: 'app',
    tags: ['chain-abstraction', 'multi-chain', 'unified-balance', 'arcana'],
  };

  readonly configSchema = ChainAbstractionConfig as unknown as z.ZodType<z.infer<typeof ChainAbstractionConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'abstraction-out',
      name: 'Chain Abstraction',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ChainAbstractionConfig>> {
    return {
      supportedChains: ['arbitrum', 'ethereum', 'optimism', 'base'],
      unifiedBalanceEnabled: true,
      autoChainSwitch: true,
      gasPaymentToken: 'native',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/chain-abstraction';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/chain';

    // Generate abstraction provider
    this.addFile(output, `${libDir}/abstraction-provider.ts`, generateAbstractionProvider(config));

    // Generate hooks
    this.addFile(output, `${hooksDir}/useChainAbstraction.ts`, generateAbstractionHooks(config));

    // Generate unified balance component
    if (config.unifiedBalanceEnabled) {
      this.addFile(output, `${componentsDir}/UnifiedBalance.tsx`, generateUnifiedBalance(config));
    }

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_ARCANA_APP_ID', 'Arcana app ID for chain abstraction', {
      required: true,
    });

    this.addDoc(output, 'docs/chain/abstraction.md', 'Chain Abstraction', generateAbstractionDocs(config));

    context.logger.info('Generated chain abstraction utilities', { nodeId: node.id });

    return output;
  }
}

function generateAbstractionDocs(config: z.infer<typeof ChainAbstractionConfig>): string {
  return `# Chain Abstraction

Unified multi-chain UX hiding complexity from users.

## Supported Chains
${config.supportedChains.map(c => `- ${c}`).join('\n')}

## Features
- **Unified Balance**: ${config.unifiedBalanceEnabled ? 'Enabled' : 'Disabled'}
- **Auto Chain Switch**: ${config.autoChainSwitch ? 'Enabled' : 'Disabled'}
- **Gas Payment**: ${config.gasPaymentToken}

## Usage

\`\`\`tsx
import { useChainAbstraction } from '@/hooks/useChainAbstraction';

function App() {
  const { unifiedBalance, executeOnBestChain } = useChainAbstraction();
  
  // User sees one balance, abstracted across chains
  console.log('Total ETH:', unifiedBalance.eth);
}
\`\`\`
`;
}

export { generateAbstractionProvider, generateAbstractionHooks };

