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

/**
 * ERC-8004 Agent Runtime Plugin
 * 
 * This plugin copies the pre-built @cradle/erc8004-agent component to the generated project
 * and configures the agent runtime environment.
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

  /**
   * Path to the pre-built component package (relative to project root)
   * The orchestrator will copy this entire directory to the output
   */
  readonly componentPath = 'packages/components/erc8004-agent';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/erc8004-agent';

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
      selectedModel: 'openai/gpt-4o',
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

    // Environment variables
    this.addEnvVar(output, 'AGENT_NAME', 'Name of the AI agent', {
      required: true,
      defaultValue: config.agentName,
    });

    // OpenRouter API key (used for all models)
    this.addEnvVar(output, 'OPENROUTER_API_KEY', 'OpenRouter API key for LLM access', {
      required: true,
      secret: true,
    });

    this.addEnvVar(output, 'OPENROUTER_MODEL', 'Model to use via OpenRouter', {
      required: false,
      defaultValue: config.selectedModel,
    });

    if (config.registryIntegration) {
      this.addEnvVar(output, 'NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS', 'ERC-8004 registry contract address', {
        required: false,
      });
      this.addEnvVar(output, 'AGENT_PRIVATE_KEY', 'Agent wallet private key for registry operations', {
        required: false,
        secret: true,
      });
    }

    if (config.stakeAmount) {
      this.addEnvVar(output, 'AGENT_STAKE_AMOUNT', 'Stake amount in wei', {
        required: false,
        defaultValue: config.stakeAmount,
      });
    }

    this.addEnvVar(output, 'NEXT_PUBLIC_AGENT_NETWORK', 'Network for agent operations (arbitrum or arbitrum-sepolia)', {
      required: true,
      defaultValue: 'arbitrum',
    });

    // Add scripts
    this.addScript(output, 'agent:start', 'tsx src/agent/runtime.ts', 'Start the agent runtime');
    this.addScript(output, 'agent:register', 'tsx src/agent/registry.ts register', 'Register agent on-chain');
    this.addScript(output, 'agent:status', 'tsx src/agent/registry.ts status', 'Check agent registry status');

    context.logger.info(`Generated ERC-8004 agent runtime: ${config.agentName}`, {
      nodeId: node.id,
      capabilities: config.capabilities,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}
