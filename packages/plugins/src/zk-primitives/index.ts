import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ZKPrimitivesConfig } from '@dapp-forge/blueprint-schema';
import { generateProofUtils, generateZKHooks, generateVerifierHelpers } from './templates';

/**
 * ZK Primitives Plugin
 * Generates privacy-preserving building blocks using zkthings/zksdk and ZK-Kit
 */
export class ZKPrimitivesPlugin extends BasePlugin<z.infer<typeof ZKPrimitivesConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'zk-primitives',
    name: 'ZK Primitives',
    version: '0.1.0',
    description: 'Privacy-preserving proofs: membership, range, and semaphore',
    category: 'contracts',
    tags: ['zk', 'privacy', 'zero-knowledge', 'semaphore', 'proofs'],
  };

  readonly configSchema = ZKPrimitivesConfig as unknown as z.ZodType<z.infer<typeof ZKPrimitivesConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'zk-out',
      name: 'ZK Utilities',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ZKPrimitivesConfig>> {
    return {
      proofTypes: ['membership'],
      clientSideProving: true,
      generateVerifiers: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/zk';
    const hooksDir = 'src/hooks';
    const contractsDir = 'contracts/verifiers';

    // Generate proof utilities
    this.addFile(output, `${libDir}/proof-utils.ts`, generateProofUtils(config));

    // Generate hooks
    this.addFile(output, `${hooksDir}/useZKProofs.ts`, generateZKHooks(config));

    // Generate verifier helpers
    if (config.generateVerifiers) {
      this.addFile(output, `${contractsDir}/Verifier.sol`, generateVerifierHelpers(config));
    }

    this.addScript(output, 'zk:setup', 'echo "Run trusted setup for ZK circuits"');

    this.addDoc(output, 'docs/zk/primitives.md', 'ZK Primitives', generateZKDocs(config));

    context.logger.info('Generated ZK primitives', { nodeId: node.id, proofTypes: config.proofTypes });

    return output;
  }
}

function generateZKDocs(config: z.infer<typeof ZKPrimitivesConfig>): string {
  return `# ZK Primitives

Privacy-preserving Zero-Knowledge proof utilities.

## Proof Types

${config.proofTypes.map(t => `- **${t}**`).join('\n')}

## Usage

\`\`\`typescript
import { useZKProofs } from '@/hooks/useZKProofs';

function PrivateAction() {
  const { generateMembershipProof, verifyProof } = useZKProofs();
  
  const proof = await generateMembershipProof({
    commitment: '0x...',
    merkleRoot: '0x...',
  });
  
  const isValid = await verifyProof(proof);
}
\`\`\`
`;
}

export { generateProofUtils, generateZKHooks };

