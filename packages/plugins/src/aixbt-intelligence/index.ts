import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import {
    AIXBTMomentumConfig,
    AIXBTSignalsConfig,
    AIXBTIndigoConfig,
    AIXBTObserverConfig
} from '@dapp-forge/blueprint-schema';
import * as templates from './templates';

/**
 * AIXBT Momentum Plugin
 */
export class AIXBTMomentumPlugin extends BasePlugin<z.infer<typeof AIXBTMomentumConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'aixbt-momentum',
        name: 'AIXBT Momentum',
        version: '0.1.0',
        description: 'Track social momentum and cluster convergence for projects',
        category: 'intelligence' as any,
        tags: ['aixbt', 'momentum', 'market-intelligence'],
    };
    readonly configSchema = AIXBTMomentumConfig as any;
    readonly ports: PluginPort[] = [
        { id: 'momentum-out', name: 'Momentum Data', type: 'output', dataType: 'api' },
    ];
    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const output = this.createEmptyOutput();
        this.addFile(output, 'src/intelligence/aixbt-client.ts', templates.generateAIXBTClient());
        this.addEnvVar(output, 'AIXBT_API_KEY', 'AIXBT API Key for market intelligence', { required: true, secret: true });
        this.addDoc(output, 'docs/intelligence/aixbt.md', 'AIXBT Integration', templates.generateDocs());
        return output;
    }
}

/**
 * AIXBT Signals Plugin
 */
export class AIXBTSignalsPlugin extends BasePlugin<z.infer<typeof AIXBTSignalsConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'aixbt-signals',
        name: 'AIXBT Signals',
        version: '0.1.0',
        description: 'Real-time event signals for project activity',
        category: 'intelligence' as any,
        tags: ['aixbt', 'signals', 'alerts'],
    };
    readonly configSchema = AIXBTSignalsConfig as any;
    readonly ports: PluginPort[] = [
        { id: 'signals-out', name: 'Signals Feed', type: 'output', dataType: 'api' },
    ];
    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const output = this.createEmptyOutput();
        this.addFile(output, 'src/intelligence/aixbt-client.ts', templates.generateAIXBTClient());
        this.addEnvVar(output, 'AIXBT_API_KEY', 'AIXBT API Key for market intelligence', { required: true });
        return output;
    }
}

/**
 * AIXBT Indigo Plugin
 */
export class AIXBTIndigoPlugin extends BasePlugin<z.infer<typeof AIXBTIndigoConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'aixbt-indigo',
        name: 'AIXBT Indigo',
        version: '0.1.0',
        description: 'Conversational AI market research',
        category: 'intelligence' as any,
        tags: ['aixbt', 'indigo', 'ai-research'],
    };
    readonly configSchema = AIXBTIndigoConfig as any;
    readonly ports: PluginPort[] = [
        { id: 'indigo-out', name: 'Research API', type: 'output', dataType: 'api' },
    ];
    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();
        this.addFile(output, 'src/intelligence/indigo.ts', templates.generateIndigoIntegration(config));
        this.addEnvVar(output, 'AIXBT_API_KEY', 'AIXBT API Key for market intelligence', { required: true });
        return output;
    }
}

/**
 * AIXBT Observer Plugin
 */
export class AIXBTObserverPlugin extends BasePlugin<z.infer<typeof AIXBTObserverConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'aixbt-observer',
        name: 'AIXBT Observer',
        version: '0.1.0',
        description: 'Correlate on-chain activity with social signals',
        category: 'intelligence' as any,
        tags: ['aixbt', 'observer', 'on-chain'],
    };
    readonly configSchema = AIXBTObserverConfig as any;
    readonly ports: PluginPort[] = [
        { id: 'observer-out', name: 'Observer Alerts', type: 'output', dataType: 'api' },
    ];
    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();
        this.addFile(output, 'src/intelligence/observer.ts', templates.generateObserverLogic(config));
        this.addFile(output, 'src/intelligence/aixbt-client.ts', templates.generateAIXBTClient());
        this.addEnvVar(output, 'AIXBT_API_KEY', 'AIXBT API Key for market intelligence', { required: true });
        return output;
    }
}
