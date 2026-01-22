import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { OnchainActivityConfig } from '@dapp-forge/blueprint-schema';

/**
 * Onchain Activity Plugin
 * 
 * This plugin copies the pre-built @cradle/onchain-activity component to the generated project
 */
export class OnchainActivityPlugin extends BasePlugin<z.infer<typeof OnchainActivityConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'onchain-activity',
        name: 'Onchain Activity',
        version: '0.1.0',
        description: 'Fetch wallet transactions and activities from Arbitrum by category',
        category: 'agents',
        tags: ['onchain', 'activity', 'transactions', 'arbitrum', 'alchemy'],
    };

    readonly configSchema = OnchainActivityConfig as unknown as z.ZodType<z.infer<typeof OnchainActivityConfig>>;

    /**
     * Path to the pre-built component package (relative to project root)
     * The orchestrator will copy this entire directory to the output
     */
    readonly componentPath = 'packages/components/onchain-activity';

    /**
     * Package name for the component
     */
    readonly componentPackage = '@cradle/onchain-activity';

    readonly ports: PluginPort[] = [
        {
            id: 'wallet-in',
            name: 'Wallet Address',
            type: 'input',
            dataType: 'config',
            required: true,
        },
        {
            id: 'activity-out',
            name: 'Activity Data',
            type: 'output',
            dataType: 'config',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof OnchainActivityConfig>> {
        return {
            network: 'arbitrum',
            transactionLimit: '10',
            categories: ['erc20'],
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Add environment variable for Alchemy API key
        this.addEnvVar(output, 'ALCHEMY_API_KEY', 'Alchemy API key for fetching onchain activity', {
            required: true,
        });

        this.addEnvVar(output, 'NEXT_PUBLIC_ONCHAIN_NETWORK', 'Network for onchain activity (arbitrum or arbitrum-sepolia)', {
            required: true,
            defaultValue: config.network,
        });

        // Add scripts
        this.addScript(output, 'onchain:setup', 'echo "See packages/onchain-activity/README.md for setup instructions"', 'Onchain activity setup instructions');

        context.logger.info(`Generated onchain activity setup for network: ${config.network}`, {
            nodeId: node.id,
            network: config.network,
            transactionLimit: config.transactionLimit,
            categories: config.categories,
            componentPackage: this.componentPackage,
        });

        return output;
    }
}
