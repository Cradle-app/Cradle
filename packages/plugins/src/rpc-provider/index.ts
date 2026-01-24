import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { RPCProviderConfig } from '@dapp-forge/blueprint-schema';
import {
  generateProviderConfig,
  generateClientFactory,
  generateHealthCheck,
  generateProviderHooks,
} from './templates';

/**
 * RPC Provider Plugin
 * Generates multi-provider RPC configuration with failover for Arbitrum
 */
export class RPCProviderPlugin extends BasePlugin<z.infer<typeof RPCProviderConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'rpc-provider',
    name: 'RPC Provider',
    version: '0.1.0',
    description: 'Multi-provider RPC configuration with failover for Arbitrum',
    category: 'app',
    tags: ['rpc', 'arbitrum', 'alchemy', 'quicknode', 'infura', 'provider'],
  };

  readonly configSchema = RPCProviderConfig as unknown as z.ZodType<z.infer<typeof RPCProviderConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'provider-out',
      name: 'Provider Config',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof RPCProviderConfig>> {
    return {
      primaryProvider: 'alchemy',
      fallbackProviders: ['public'],
      enableWebSocket: true,
      healthCheckInterval: 30000,
      retryAttempts: 3,
      privacyMode: false,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate provider configuration
    this.addFile(output, 'provider-config.ts', generateProviderConfig(config), 'frontend-lib');

    // Generate client factory
    this.addFile(output, 'client-factory.ts', generateClientFactory(config), 'frontend-lib');

    // Generate health check utilities
    this.addFile(output, 'health-check.ts', generateHealthCheck(config), 'frontend-lib');

    // Generate React hooks
    this.addFile(output, 'useProvider.ts', generateProviderHooks(config), 'frontend-hooks');

    // Add environment variables based on providers
    const providers = [config.primaryProvider, ...config.fallbackProviders];

    if (providers.includes('alchemy')) {
      this.addEnvVar(output, 'NEXT_PUBLIC_ALCHEMY_API_KEY', 'Alchemy API key for RPC access', {
        required: config.primaryProvider === 'alchemy',
      });
    }

    if (providers.includes('quicknode')) {
      this.addEnvVar(output, 'NEXT_PUBLIC_QUICKNODE_ENDPOINT', 'QuickNode endpoint URL', {
        required: config.primaryProvider === 'quicknode',
      });
    }

    if (providers.includes('infura')) {
      this.addEnvVar(output, 'NEXT_PUBLIC_INFURA_API_KEY', 'Infura API key for RPC access', {
        required: config.primaryProvider === 'infura',
      });
    }

    if (providers.includes('ankr')) {
      this.addEnvVar(output, 'NEXT_PUBLIC_ANKR_API_KEY', 'Ankr API key (optional for free tier)', {
        required: false,
      });
    }

    // Add scripts
    this.addScript(output, 'rpc:health', 'tsx src/lib/rpc/health-check.ts');

    // Add documentation
    this.addDoc(
      output,
      'docs/rpc/provider-setup.md',
      'RPC Provider Setup',
      generateProviderDocs(config)
    );

    context.logger.info('Generated RPC provider configuration', {
      nodeId: node.id,
      primaryProvider: config.primaryProvider,
    });

    return output;
  }
}

function generateProviderDocs(config: z.infer<typeof RPCProviderConfig>): string {
  return `# RPC Provider Configuration

Multi-provider RPC setup with automatic failover for Arbitrum.

## Providers

- **Primary**: ${config.primaryProvider}
- **Fallbacks**: ${config.fallbackProviders.join(', ')}

## Features

- **WebSocket Support**: ${config.enableWebSocket ? 'Enabled' : 'Disabled'}
- **Health Checks**: Every ${config.healthCheckInterval}ms
- **Retry Attempts**: ${config.retryAttempts}
- **Privacy Mode**: ${config.privacyMode ? 'Enabled (using 1RPC)' : 'Disabled'}

## Setup

### 1. Get API Keys

${config.primaryProvider === 'alchemy' || config.fallbackProviders.includes('alchemy') ? `
#### Alchemy
1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Create a new app for Arbitrum
3. Copy your API key
` : ''}

${config.primaryProvider === 'quicknode' || config.fallbackProviders.includes('quicknode') ? `
#### QuickNode
1. Go to [QuickNode Dashboard](https://dashboard.quicknode.com)
2. Create an Arbitrum endpoint
3. Copy the endpoint URL
` : ''}

${config.primaryProvider === 'infura' || config.fallbackProviders.includes('infura') ? `
#### Infura
1. Go to [Infura Dashboard](https://app.infura.io)
2. Create a new project
3. Copy your API key
` : ''}

### 2. Configure Environment Variables

\`\`\`bash
# .env.local
${config.primaryProvider === 'alchemy' || config.fallbackProviders.includes('alchemy') ? 'NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key' : ''}
${config.primaryProvider === 'quicknode' || config.fallbackProviders.includes('quicknode') ? 'NEXT_PUBLIC_QUICKNODE_ENDPOINT=https://your-endpoint.quiknode.pro/xxxxx/' : ''}
${config.primaryProvider === 'infura' || config.fallbackProviders.includes('infura') ? 'NEXT_PUBLIC_INFURA_API_KEY=your_infura_key' : ''}
${config.fallbackProviders.includes('ankr') ? 'NEXT_PUBLIC_ANKR_API_KEY=your_ankr_key # optional' : ''}
\`\`\`

## Usage

### Get a Public Client

\`\`\`typescript
import { getPublicClient } from '@/lib/rpc/client-factory';

const client = getPublicClient();
const blockNumber = await client.getBlockNumber();
\`\`\`

### Use the Provider Hook

\`\`\`typescript
import { useProvider } from '@/hooks/useProvider';

function MyComponent() {
  const { client, isHealthy, currentProvider } = useProvider();
  
  // client is automatically the healthiest available provider
}
\`\`\`

### Manual Health Check

\`\`\`typescript
import { checkProviderHealth } from '@/lib/rpc/health-check';

const health = await checkProviderHealth();
console.log(health);
// { alchemy: { healthy: true, latency: 45 }, ... }
\`\`\`

## Provider Comparison

| Provider | Free Tier | Rate Limit | WebSocket | Archive |
|----------|-----------|------------|-----------|---------|
| Alchemy | 300M CU/month | High | Yes | Yes |
| QuickNode | Limited | Medium | Yes | Paid |
| Infura | 100K/day | Medium | Yes | Paid |
| Ankr | Unlimited | Low | Yes | Yes |
| 1RPC | Unlimited | Low | No | No |
| Public | Unlimited | Very Low | No | No |

## Privacy Mode

When privacy mode is enabled, requests are routed through 1RPC which:
- Does not log IP addresses
- Does not track requests
- Provides MEV protection
`;
}

export { generateProviderConfig, generateClientFactory, generateHealthCheck };

