import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type PluginDependency,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { FrontendScaffoldConfig } from '@dapp-forge/blueprint-schema';
import {
    generateAppLayout,
    generateProviders,
    generateWagmiConfig,
    generateChainConfig,
    generatePackageJson,
    generateNextConfig,
    generateTailwindConfig,
    generateHomePage,
    generateWalletButton,
    generateGlobalStyles,
    generateEnvTypes,
    generateTsConfig,
    generateUtils,
} from './templates';
import { generateContractHooks, extractConnectedContracts } from './contract-integration';

/**
 * Frontend Scaffold Plugin
 * 
 * Generates a comprehensive Next.js Web3 application scaffold with:
 * - wagmi + viem for Web3 connectivity
 * - RainbowKit for wallet connection UI
 * - TanStack Query for state management
 * - Smart contract integration
 * - Tailwind CSS styling
 */
export class FrontendScaffoldPlugin extends BasePlugin<z.infer<typeof FrontendScaffoldConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'frontend-scaffold',
        name: 'Frontend Scaffold',
        version: '0.1.0',
        description: 'Generate a Next.js Web3 application with wagmi, RainbowKit, and smart contract integration',
        category: 'app',
        tags: ['nextjs', 'web3', 'wagmi', 'rainbowkit', 'frontend', 'scaffold', 'dapp'],
    };

    readonly configSchema = FrontendScaffoldConfig as unknown as z.ZodType<z.infer<typeof FrontendScaffoldConfig>>;

    //   /**
    //  * Path to the pre-built component package
    //  */
    // readonly componentPath = 'packages/components/frontend-scaffold';

    //     /**
    //  * Package name for the component
    //  */
    // readonly componentPackage = '@cradle/frontend-scaffold';

    readonly ports: PluginPort[] = [
        {
            id: 'contract-in',
            name: 'Contract ABI',
            type: 'input',
            dataType: 'contract',
            required: false,
        },
        {
            id: 'network-in',
            name: 'Network Config',
            type: 'input',
            dataType: 'config',
            required: false,
        },
        {
            id: 'app-out',
            name: 'App Context',
            type: 'output',
            dataType: 'config',
        },
    ];

    readonly dependencies: PluginDependency[] = [
        {
            pluginId: 'wallet-auth',
            required: false,
            dataMapping: { 'auth-out': 'auth-config' },
        },
        {
            pluginId: 'superposition-network',
            required: false,
            dataMapping: { 'network-out': 'network-config' },
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof FrontendScaffoldConfig>> {
        return {
            framework: 'nextjs',
            styling: 'tailwind',
            web3Provider: 'wagmi-viem',
            walletConnect: true,
            rainbowKit: true,
            siweAuth: false,
            includeContracts: true,
            contractsPath: 'contracts',
            generateContractHooks: true,
            projectStructure: 'app-router',
            srcDirectory: true,
            stateManagement: 'tanstack-query',
            ssrEnabled: true,
            pwaSupport: false,
            strictMode: true,
            appName: 'My DApp',
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Determine base path for generated files
        const srcBase = config.srcDirectory ? 'src' : '';
        const appBase = config.projectStructure === 'app-router'
            ? `${srcBase}/app`
            : `${srcBase}/pages`;

        context.logger.info(`Generating frontend scaffold: ${config.appName}`, {
            nodeId: node.id,
            framework: config.framework,
            styling: config.styling,
        });

        // =========================================================================
        // Generate Core Next.js Files
        // =========================================================================

        // package.json
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/package.json`,
            generatePackageJson(config)
        );

        // next.config.js
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/next.config.js`,
            generateNextConfig(config)
        );

        // tsconfig.json
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/tsconfig.json`,
            generateTsConfig(config)
        );

        // =========================================================================
        // Generate App Router Structure
        // =========================================================================

        if (config.projectStructure === 'app-router') {
            // app/layout.tsx - Root layout with providers
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/layout.tsx`,
                generateAppLayout(config)
            );

            // app/page.tsx - Home page
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/page.tsx`,
                generateHomePage(config)
            );

            // app/providers.tsx - Web3 providers wrapper
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/providers.tsx`,
                generateProviders(config)
            );
        }

        // =========================================================================
        // Generate Web3 Configuration
        // =========================================================================

        // lib/wagmi.ts - wagmi configuration
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/lib/wagmi.ts`,
            generateWagmiConfig(config, context)
        );

        // lib/chains.ts - Chain definitions
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/lib/chains.ts`,
            generateChainConfig(config, context)
        );

        // lib/utils.ts - cn utility for className merging (required by ERC interaction panels)
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/lib/utils.ts`,
            generateUtils()
        );

        // =========================================================================
        // Generate Components
        // =========================================================================

        // components/wallet-button.tsx
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/components/wallet-button.tsx`,
            generateWalletButton(config)
        );

        // =========================================================================
        // Generate Styles
        // =========================================================================

        if (config.styling === 'tailwind') {
            // tailwind.config.js
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}/tailwind.config.js`,
                generateTailwindConfig(config)
            );

            // app/globals.css
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/globals.css`,
                generateGlobalStyles(config)
            );
        }

        // =========================================================================
        // Generate Type Definitions
        // =========================================================================

        // env.d.ts for type-safe environment variables
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/types/env.d.ts`,
            generateEnvTypes(config)
        );

        // =========================================================================
        // Generate Contract Hooks (if contracts are connected)
        // =========================================================================

        if (config.includeContracts && config.generateContractHooks) {
            const connectedContracts = extractConnectedContracts(context);

            if (connectedContracts.length > 0) {
                const contractHooks = generateContractHooks(connectedContracts, config);
                this.addFile(
                    output,
                    `${srcBase ? 'apps/web/' : ''}${srcBase}/hooks/useContracts.ts`,
                    contractHooks
                );
            }
        }

        // =========================================================================
        // Environment Variables
        // =========================================================================

        this.addEnvVar(output, 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'WalletConnect Cloud project ID for wallet connections', {
            required: config.walletConnect,
        });

        this.addEnvVar(output, 'NEXT_PUBLIC_APP_NAME', 'Application name displayed in wallet dialogs', {
            required: false,
            defaultValue: config.appName,
        });

        // Add network-specific env vars if we detect superposition integration
        const hasSuperposition = context.nodeOutputs?.has('superposition-network');
        if (hasSuperposition) {
            this.addEnvVar(output, 'NEXT_PUBLIC_SUPERPOSITION_RPC_URL', 'Superposition L3 RPC endpoint', {
                required: false,
                defaultValue: 'https://rpc.superposition.so',
            });
        }

        // =========================================================================
        // Scripts
        // =========================================================================

        this.addScript(output, 'dev', 'next dev', 'Start development server');
        this.addScript(output, 'build', 'next build', 'Build for production');
        this.addScript(output, 'start', 'next start', 'Start production server');
        this.addScript(output, 'lint', 'next lint', 'Run ESLint');

        // =========================================================================
        // Documentation
        // =========================================================================

        this.addDoc(
            output,
            `docs/frontend/README.md`,
            'Frontend Application',
            generateFrontendDocs(config)
        );

        context.logger.info(`Generated frontend scaffold with ${output.files.length} files`, {
            nodeId: node.id,
        });

        return output;
    }
}

/**
 * Generate documentation for the frontend application
 */
function generateFrontendDocs(config: z.infer<typeof FrontendScaffoldConfig>): string {
    return `# ${config.appName}

A Next.js Web3 application generated by Cradle.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: ${config.styling === 'tailwind' ? 'Tailwind CSS' : config.styling}
- **Web3**: wagmi + viem
- **Wallet UI**: ${config.rainbowKit ? 'RainbowKit' : 'Custom'}
- **State Management**: ${config.stateManagement === 'tanstack-query' ? 'TanStack Query' : config.stateManagement}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Start the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

## Project Structure

\`\`\`
src/
├── app/
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Home page
│   ├── providers.tsx   # Web3 providers wrapper
│   └── globals.css     # Global styles
├── components/
│   └── wallet-button.tsx
├── lib/
│   ├── wagmi.ts        # wagmi configuration
│   └── chains.ts       # Chain definitions
├── hooks/
│   └── useContracts.ts # Contract interaction hooks
└── types/
    └── env.d.ts        # Type-safe environment variables
\`\`\`

## Features

${config.walletConnect ? '- ✅ WalletConnect integration' : ''}
${config.rainbowKit ? '- ✅ RainbowKit wallet UI' : ''}
${config.siweAuth ? '- ✅ Sign-In With Ethereum (SIWE)' : ''}
${config.includeContracts ? '- ✅ Smart contract integration' : ''}
${config.darkModeSupport ? '- ✅ Dark mode support' : ''}
${config.ssrEnabled ? '- ✅ Server-side rendering' : ''}

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| \`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\` | ${config.walletConnect ? 'Yes' : 'No'} | Get from [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| \`NEXT_PUBLIC_APP_NAME\` | No | Application name for wallet dialogs |

---

Generated with ❤️ by [Cradle](https://cradle-web-eight.vercel.app)
`;
}
