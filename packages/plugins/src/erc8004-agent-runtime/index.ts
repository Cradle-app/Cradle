import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ERC8004AgentConfig } from '@dapp-forge/blueprint-schema';
import {
  generateAgentRuntime,
  generateAgentRegistry,
  generateAgentTypes,
  generateAgentConfig,
} from './templates';

/**
 * ERC-8004 Agent Runtime Plugin
 * Generates AI agent runtime with ERC-8004 registry integration
 */
export class ERC8004AgentPlugin extends BasePlugin<z.infer<typeof ERC8004AgentConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'erc8004-agent-runtime',
    name: 'ERC-8004 Agent Runtime',
    version: '0.1.0',
    description: 'Generate AI agent runtime with ERC-8004 on-chain registry integration',
    category: 'agents',
    tags: ['ai', 'agent', 'erc-8004', 'registry', 'llm'],
  };

  readonly configSchema = ERC8004AgentConfig as unknown as z.ZodType<z.infer<typeof ERC8004AgentConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'contract-in',
      name: 'Stake Contract',
      type: 'input',
      dataType: 'contract',
      required: false,
    },
    {
      id: 'payment-in',
      name: 'Payment API',
      type: 'input',
      dataType: 'api',
      required: false,
    },
    {
      id: 'agent-out',
      name: 'Agent Runtime',
      type: 'output',
      dataType: 'api',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ERC8004AgentConfig>> {
    return {
      agentVersion: '0.1.0',
      capabilities: ['text-generation'],
      registryIntegration: true,
      modelProvider: 'openai',
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000,
      },
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const agentDir = 'src/agent';

    // Generate agent types
    this.addFile(output, `${agentDir}/types.ts`, generateAgentTypes(config));

    // Generate agent configuration
    this.addFile(output, `${agentDir}/config.ts`, generateAgentConfig(config));

    // Generate agent runtime
    this.addFile(output, `${agentDir}/runtime.ts`, generateAgentRuntime(config));

    // Generate ERC-8004 registry integration
    if (config.registryIntegration) {
      this.addFile(output, `${agentDir}/registry.ts`, generateAgentRegistry(config, context.config));
    }

    // Generate environment variables
    this.addEnvVar(output, 'AGENT_NAME', 'Name of the AI agent', {
      required: true,
      defaultValue: config.agentName,
    });
    
    if (config.modelProvider === 'openai') {
      this.addEnvVar(output, 'OPENAI_API_KEY', 'OpenAI API key', {
        required: true,
        secret: true,
      });
    } else if (config.modelProvider === 'anthropic') {
      this.addEnvVar(output, 'ANTHROPIC_API_KEY', 'Anthropic API key', {
        required: true,
        secret: true,
      });
    }

    if (config.registryIntegration) {
      this.addEnvVar(output, 'AGENT_REGISTRY_ADDRESS', 'ERC-8004 registry contract address', {
        required: true,
      });
      this.addEnvVar(output, 'AGENT_PRIVATE_KEY', 'Agent wallet private key for registry operations', {
        required: true,
        secret: true,
      });
    }

    if (config.stakeAmount) {
      this.addEnvVar(output, 'AGENT_STAKE_AMOUNT', 'Stake amount in wei', {
        required: false,
        defaultValue: config.stakeAmount,
      });
    }

    // Add scripts
    this.addScript(output, 'agent:start', 'tsx src/agent/runtime.ts', 'Start the agent runtime');
    this.addScript(output, 'agent:register', 'tsx src/agent/registry.ts register', 'Register agent on-chain');
    this.addScript(output, 'agent:status', 'tsx src/agent/registry.ts status', 'Check agent registry status');

    // Add TypeScript types interface
    output.interfaces.push({
      name: `${config.agentName}Types`,
      type: 'typescript',
      content: generateAgentTypes(config),
    });

    // Add documentation
    this.addDoc(
      output,
      'docs/agents/runtime.md',
      `${config.agentName} Agent Runtime`,
      generateAgentDocs(config)
    );

    context.logger.info(`Generated ERC-8004 agent runtime: ${config.agentName}`, {
      nodeId: node.id,
      capabilities: config.capabilities,
    });

    return output;
  }
}

function generateAgentDocs(config: z.infer<typeof ERC8004AgentConfig>): string {
  return `# ${config.agentName} Agent Runtime

An AI agent with ERC-8004 on-chain registry integration.

## Overview

- **Version**: ${config.agentVersion}
- **Model Provider**: ${config.modelProvider}
- **Registry Integration**: ${config.registryIntegration ? 'Enabled' : 'Disabled'}

## Capabilities

${config.capabilities.map(c => `- \`${c}\``).join('\n')}

## Rate Limits

- **Requests per minute**: ${config.rateLimit.requestsPerMinute}
- **Tokens per minute**: ${config.rateLimit.tokensPerMinute}

## Quick Start

### 1. Set up environment variables

\`\`\`bash
export AGENT_NAME="${config.agentName}"
${config.modelProvider === 'openai' ? 'export OPENAI_API_KEY="your-api-key"' : ''}
${config.modelProvider === 'anthropic' ? 'export ANTHROPIC_API_KEY="your-api-key"' : ''}
${config.registryIntegration ? `export AGENT_REGISTRY_ADDRESS="0x..."
export AGENT_PRIVATE_KEY="your-private-key"` : ''}
\`\`\`

### 2. Register the agent (if using registry)

\`\`\`bash
pnpm agent:register
\`\`\`

### 3. Start the runtime

\`\`\`bash
pnpm agent:start
\`\`\`

## ERC-8004 Registry

${config.registryIntegration ? `
The agent is registered on-chain using the ERC-8004 standard. This provides:

- **Discoverability**: Other agents and applications can find your agent
- **Capability attestation**: Capabilities are attested on-chain
- **Reputation tracking**: Build reputation through successful interactions
${config.stakeAmount ? `- **Staking**: Agent stakes ${config.stakeAmount} wei as commitment` : ''}

### Registry Functions

- \`register()\`: Register the agent with capabilities
- \`updateCapabilities()\`: Update agent capabilities
- \`stake()\`: Add stake to the agent
- \`withdraw()\`: Withdraw stake (subject to conditions)
` : 'Registry integration is disabled.'}

## API Endpoints

The agent runtime exposes the following endpoints:

- \`POST /agent/invoke\`: Invoke the agent with a prompt
- \`GET /agent/status\`: Get agent status and capabilities
- \`GET /agent/health\`: Health check endpoint

## Example Usage

\`\`\`typescript
import { createAgentClient } from './sdk/agent-client';

const agent = createAgentClient({
  baseUrl: 'http://localhost:3002',
});

const response = await agent.invoke({
  prompt: 'Hello, agent!',
  capability: 'text-generation',
});

console.log(response.result);
\`\`\`
`;
}

