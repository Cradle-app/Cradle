import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { OstiumTradingConfig } from '@dapp-forge/blueprint-schema';

/**
 * Ostium One-Click Trading Plugin
 * 
 * This plugin copies the pre-built @cradle/ostium-onect component to the generated project
 */
export class OstiumTradingPlugin extends BasePlugin<z.infer<typeof OstiumTradingConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'ostium-trading',
        name: 'Ostium One-Click Trading',
        version: '0.1.0',
        description: 'Enable one-click trading on Ostium with delegation and USDC approval',
        category: 'agents',
        tags: ['ostium', 'trading', 'delegation', 'usdc', 'defi'],
    };

    readonly configSchema = OstiumTradingConfig as unknown as z.ZodType<z.infer<typeof OstiumTradingConfig>>;

    /**
     * Path to the pre-built component package (relative to project root)
     * The orchestrator will copy this entire directory to the output
     */
    readonly componentPath = 'packages/components/ostium-onect';

    /**
     * Package name for the component
     */
    readonly componentPackage = '@cradle/ostium-onect';

    /**
     * Path mappings for component files to enable intelligent routing
     */
    readonly componentPathMappings = {
        'src/hooks/**': 'frontend-hooks' as const,
        'src/types.ts': 'frontend-types' as const,
        'src/constants.ts': 'frontend-lib' as const,
        'src/approval.ts': 'frontend-lib' as const,
        'src/delegation.ts': 'frontend-lib' as const,
        'src/index.ts': 'frontend-lib' as const,
        'src/example.tsx': 'frontend-components' as const,
    };

    readonly ports: PluginPort[] = [
        {
            id: 'wallet-in',
            name: 'Wallet',
            type: 'input',
            dataType: 'config',
            required: false,
        },
        {
            id: 'trading-out',
            name: 'Trading Setup',
            type: 'output',
            dataType: 'config',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof OstiumTradingConfig>> {
        return {
            network: 'arbitrum',
            usdcApprovalAmount: '1000000',
            delegationEnabled: false,
            usdcApproved: false,
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        this.addEnvVar(output, 'NEXT_PUBLIC_OSTIUM_NETWORK', 'Network for Ostium trading (arbitrum or arbitrum-sepolia)', {
            required: true,
            defaultValue: config.network,
        });

        // Add scripts
        this.addScript(output, 'ostium:setup', 'echo "See packages/ostium-onect/README.md for setup instructions"', 'Ostium setup instructions');

        context.logger.info(`Generated Ostium trading setup for network: ${config.network}`, {
            nodeId: node.id,
            network: config.network,
            delegationEnabled: config.delegationEnabled,
            usdcApproved: config.usdcApproved,
            componentPackage: this.componentPackage,
        });

        return output;
    }
}
