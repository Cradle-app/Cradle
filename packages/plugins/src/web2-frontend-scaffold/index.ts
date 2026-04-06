import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { Web2FrontendScaffoldConfig } from '@dapp-forge/blueprint-schema';
import {
  generatePackageJson,
  generateNextConfig,
  generateTailwindConfig,
  generatePostCSSConfig,
  generateTSConfig,
  generateLayout,
  generatePage,
  generateGlobalCSS,
  generateProviders,
  generateEnvTypes,
} from './templates';

export class Web2FrontendScaffoldPlugin extends BasePlugin<z.infer<typeof Web2FrontendScaffoldConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'web2-frontend-scaffold',
    name: 'Web2 Frontend',
    version: '0.1.0',
    description: 'Next.js scaffold without Web3 dependencies',
    category: 'app',
    tags: ['frontend', 'nextjs', 'react', 'web2', 'scaffold'],
  };

  readonly configSchema = Web2FrontendScaffoldConfig as unknown as z.ZodType<z.infer<typeof Web2FrontendScaffoldConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'scaffold-out', name: 'Frontend App', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof Web2FrontendScaffoldConfig>> {
    return {
      framework: 'nextjs',
      styling: 'tailwind',
      stateManagement: 'tanstack-query',
      authProvider: 'none',
      appName: 'My App',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const webBase = 'apps/web';
    const srcBase = config.srcDirectory ? `${webBase}/src` : webBase;

    this.addFile(output, `${webBase}/package.json`, generatePackageJson(config));
    this.addFile(output, `${webBase}/next.config.mjs`, generateNextConfig());
    this.addFile(output, `${webBase}/tsconfig.json`, generateTSConfig(config));

    if (config.styling === 'tailwind') {
      this.addFile(output, `${webBase}/tailwind.config.ts`, generateTailwindConfig(config));
      this.addFile(output, `${webBase}/postcss.config.mjs`, generatePostCSSConfig());
    }

    this.addFile(output, `${srcBase}/app/layout.tsx`, generateLayout(config));
    this.addFile(output, `${srcBase}/app/page.tsx`, generatePage(config));
    this.addFile(output, `${srcBase}/app/globals.css`, generateGlobalCSS(config));
    this.addFile(output, `${srcBase}/components/providers.tsx`, generateProviders(config));
    this.addFile(output, `${srcBase}/types/env.d.ts`, generateEnvTypes(config));

    if (config.authProvider === 'nextauth') {
      this.addEnvVar(output, 'NEXTAUTH_SECRET', 'NextAuth.js secret key', { required: true });
      this.addEnvVar(output, 'NEXTAUTH_URL', 'NextAuth.js base URL', { required: true });
    } else if (config.authProvider === 'clerk') {
      this.addEnvVar(output, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'Clerk publishable key', { required: true });
      this.addEnvVar(output, 'CLERK_SECRET_KEY', 'Clerk secret key', { required: true });
    }

    this.addScript(output, 'dev', 'next dev');
    this.addScript(output, 'build', 'next build');
    this.addScript(output, 'start', 'next start');
    this.addScript(output, 'lint', 'next lint');

    this.addDoc(output, 'docs/getting-started.md', 'Getting Started', generateDocs(config));

    context.logger.info('Generated Web2 frontend scaffold', {
      nodeId: node.id,
      appName: config.appName,
      auth: config.authProvider,
    });

    return output;
  }
}

function generateDocs(config: z.infer<typeof Web2FrontendScaffoldConfig>): string {
  return `# ${config.appName}

A Next.js application scaffold.

## Quick Start

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Stack
- **Framework**: Next.js (App Router)
- **Styling**: ${config.styling}
- **State**: ${config.stateManagement}
- **Auth**: ${config.authProvider === 'none' ? 'None (add your own)' : config.authProvider}

## Project Structure

\`\`\`
${config.srcDirectory ? 'src/' : ''}app/
  layout.tsx        # Root layout with providers
  page.tsx          # Home page
  globals.css       # Global styles
${config.srcDirectory ? 'src/' : ''}components/
  providers.tsx     # Client-side providers
\`\`\`
`;
}
