import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { MaxxitLazyTradingConfig } from '@dapp-forge/blueprint-schema';

/**
 * Maxxit Lazy Trader Plugin
 * 
 * This plugin copies the pre-built @cradle/maxxit-lazy-trader component to the generated project
 */
export class MaxxitLazyTradingPlugin extends BasePlugin<z.infer<typeof MaxxitLazyTradingConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'maxxit',
    name: 'Maxxit Lazy Trader',
    version: '0.1.0',
    description: 'Connect and message Maxxit Lazy Trader agents via API',
    category: 'agents',
    tags: ['maxxit', 'lazy-trader', 'trading', 'api', 'agent'],
  };

  readonly configSchema = MaxxitLazyTradingConfig as unknown as z.ZodType<z.infer<typeof MaxxitLazyTradingConfig>>;

  /**
   * Path to the pre-built component package (relative to project root)
   * The orchestrator will copy this entire directory to the output
   */
  readonly componentPath = 'packages/components/maxxit-lazy-trader';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/maxxit-lazy-trader';

  readonly ports: PluginPort[] = [
    {
      id: 'api-key',
      name: 'Maxxit API Key',
      type: 'input',
      dataType: 'config',
      required: false,
    },
    {
      id: 'lazy-trader-out',
      name: 'Lazy Trader Agent',
      type: 'output',
      dataType: 'api',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof MaxxitLazyTradingConfig>> {
    return {};
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Add environment variable for Maxxit API base URL
    this.addEnvVar(output, 'MAXXIT_API_BASE_URL', 'Maxxit API base URL', {
      required: false,
      defaultValue: 'http://localhost:5000',
    });

    // Add scripts
    this.addScript(output, 'maxxit:setup', 'echo "See packages/maxxit-lazy-trader/README.md for setup instructions"', 'Maxxit setup instructions');

    context.logger.info('Generated Maxxit Lazy Trader setup', {
      nodeId: node.id,
      agentName: config.agentName,
      agentStatus: config.agentStatus,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}
