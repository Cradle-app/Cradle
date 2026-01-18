import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { IPFSStorageConfig } from '@dapp-forge/blueprint-schema';
import { generateStorageClient, generateStorageHooks, generateUploadComponent } from './templates';

/**
 * IPFS Storage Plugin
 * Generates decentralized storage utilities using Pinata or Web3.Storage
 */
export class IPFSStoragePlugin extends BasePlugin<z.infer<typeof IPFSStorageConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'ipfs-storage',
    name: 'IPFS Storage',
    version: '0.1.0',
    description: 'Decentralized storage with Pinata or Web3.Storage',
    category: 'app',
    tags: ['ipfs', 'storage', 'pinata', 'web3storage', 'metadata', 'nft'],
  };

  readonly configSchema = IPFSStorageConfig as unknown as z.ZodType<z.infer<typeof IPFSStorageConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'storage-out',
      name: 'Storage Utils',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof IPFSStorageConfig>> {
    return {
      provider: 'pinata',
      generateMetadataSchemas: true,
      generateUI: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/storage';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/storage';

    // Generate storage client
    this.addFile(output, `${libDir}/storage-client.ts`, generateStorageClient(config));

    // Generate hooks
    this.addFile(output, `${hooksDir}/useIPFS.ts`, generateStorageHooks(config));

    // Generate UI if enabled
    if (config.generateUI) {
      this.addFile(output, `${componentsDir}/FileUpload.tsx`, generateUploadComponent(config));
    }

    // Add environment variables
    if (config.provider === 'pinata') {
      this.addEnvVar(output, 'PINATA_JWT', 'Pinata JWT token', { required: true, secret: true });
      this.addEnvVar(output, 'NEXT_PUBLIC_PINATA_GATEWAY', 'Pinata gateway URL', {
        required: false,
        defaultValue: 'https://gateway.pinata.cloud',
      });
    } else {
      this.addEnvVar(output, 'WEB3_STORAGE_TOKEN', 'Web3.Storage API token', { required: true, secret: true });
    }

    this.addDoc(output, 'docs/storage/ipfs.md', 'IPFS Storage', generateStorageDocs(config));

    context.logger.info('Generated IPFS storage utilities', { nodeId: node.id, provider: config.provider });

    return output;
  }
}

function generateStorageDocs(config: z.infer<typeof IPFSStorageConfig>): string {
  return `# IPFS Storage

Decentralized file storage using ${config.provider === 'pinata' ? 'Pinata' : 'Web3.Storage'}.

## Usage

\`\`\`typescript
import { useIPFS } from '@/hooks/useIPFS';

function UploadForm() {
  const { upload, isUploading } = useIPFS();
  
  const handleUpload = async (file: File) => {
    const { cid, url } = await upload(file);
    console.log('Uploaded:', url);
  };
}
\`\`\`
`;
}

export { generateStorageClient, generateStorageHooks };

