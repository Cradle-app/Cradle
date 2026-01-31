import { Volume, createFsFromVolume } from 'memfs';
import * as realFs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type {
  Blueprint,
  BlueprintNode,
  CodegenOutput,
  ExecutionContext,
} from '@dapp-forge/blueprint-schema';
import { topologicalSort } from '@dapp-forge/blueprint-schema';
import { getDefaultRegistry, buildPathContext, rewriteOutputPaths, resolveOutputPath, type NodePlugin, type PathContext } from '@dapp-forge/plugin-sdk';
import type { PathCategory } from '@dapp-forge/blueprint-schema';
import { RunStore } from '../store/runs';
import { createExecutionLogger } from '../utils/logger';
import { applyCodegenOutput, formatAndLint, createManifest } from './filesystem';
import { GitHubIntegration } from './github';


export interface ExecutionOptions {
  dryRun?: boolean;
  createGitHubRepo?: boolean;
  githubToken?: string; // User's OAuth token from session
}

export interface ExecutionResult {
  success: boolean;
  files: Array<{ path: string; size: number }>;
  envVars: Array<{ key: string; description: string }>;
  scripts: Array<{ name: string; command: string }>;
  repoUrl?: string;
}

/**
 * Execution engine for running blueprint code generation
 */
export class ExecutionEngine {
  private registry = getDefaultRegistry();
  private runStore = new RunStore();
  private githubIntegration = new GitHubIntegration();

  /**
   * Execute a blueprint and generate code
   */
  async execute(
    blueprint: Blueprint,
    runId: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const logger = createExecutionLogger(runId);
    // Mark run as started
    this.runStore.start(runId);
    logger.info('Starting blueprint execution', { blueprintId: blueprint.id });

    try {
      // Create in-memory filesystem
      const vol = new Volume();
      const fs = createFsFromVolume(vol);

      // Initialize the filesystem with base structure
      fs.mkdirSync('/output', { recursive: true });
      fs.mkdirSync('/output/src', { recursive: true });
      fs.mkdirSync('/output/docs', { recursive: true });

      // Get topological order of nodes
      const sortedNodes = topologicalSort(blueprint.nodes, blueprint.edges);
      if (!sortedNodes) {
        throw new Error('Blueprint contains cycles - cannot determine execution order');
      }

      logger.info(`Executing ${sortedNodes.length} nodes in topological order`);

      // Build path context for intelligent file routing
      const pathContext = buildPathContext(sortedNodes);
      logger.info('Path context built', {
        hasFrontend: pathContext.hasFrontend,
        hasBackend: pathContext.hasBackend,
        hasContracts: pathContext.hasContracts,
      });

      // Track outputs from each node
      const nodeOutputs = new Map<string, CodegenOutput>();
      const allEnvVars: CodegenOutput['envVars'] = [];
      const allScripts: CodegenOutput['scripts'] = [];

      // Execute each node in order
      for (const node of sortedNodes) {
        logger.info(`Processing node: ${node.type}`, { nodeId: node.id });
        this.runStore.addLog(runId, {
          level: 'info',
          message: `Processing node: ${node.type}`,
          nodeId: node.id,
        });

        // Get the plugin for this node type
        const plugin = this.registry.get(node.type) as NodePlugin | undefined;
        if (!plugin) {
          throw new Error(`No plugin found for node type: ${node.type}`);
        }

        // Create execution context
        const context: ExecutionContext = {
          blueprintId: blueprint.id,
          runId,
          config: blueprint.config,
          nodeOutputs,
          logger: createExecutionLogger(runId, node.id),
          pathContext,
        };

        // Validate node config
        const validationResult = await plugin.validate(node.config, context);
        if (!validationResult.valid) {
          const errors = validationResult.errors.map(e => `${e.field}: ${e.message}`).join(', ');
          throw new Error(`Node ${node.id} validation failed: ${errors}`);
        }

        // Generate code
        const output = await plugin.generate(node, context);

        // Rewrite file paths based on path context (intelligent routing)
        output.files = rewriteOutputPaths(output.files, pathContext);

        nodeOutputs.set(node.id, output);

        // Apply output to filesystem
        applyCodegenOutput(fs, '/output', output);

        // Copy component package if plugin has one (pre-built component architecture)
        if (plugin.componentPath) {
          logger.info(`Copying component package: ${plugin.componentPackage}`, { nodeId: node.id });
          this.copyComponentToOutput(
            fs,
            '/output',
            plugin.componentPath,
            plugin.componentPackage || 'component',
            pathContext,
            plugin.componentPathMappings
          );
        }


        // Collect env vars and scripts
        allEnvVars.push(...output.envVars);
        allScripts.push(...output.scripts);

        logger.info(`Node ${node.type} generated ${output.files.length} files`, { nodeId: node.id });
      }

      // Generate root files
      generateRootFiles(fs, '/output', blueprint, allEnvVars, allScripts, pathContext);

      // Run format and lint
      logger.info('Running format and lint checks');
      this.runStore.addLog(runId, {
        level: 'info',
        message: 'Running format and lint checks',
      });

      const lintResult = await formatAndLint(fs, '/output');
      if (!lintResult.success) {
        logger.warn('Lint/format warnings', { warnings: lintResult.warnings });
      }

      // Create manifest
      const manifest = createManifest(fs, '/output');

      // Handle GitHub repo creation
      let repoUrl: string | undefined;
      if (options.createGitHubRepo && blueprint.config.github && !options.dryRun) {
        logger.info('Creating GitHub repository');
        this.runStore.addLog(runId, {
          level: 'info',
          message: 'Creating GitHub repository',
        });

        // Set the user's OAuth token if provided
        if (options.githubToken) {
          this.githubIntegration.setUserToken(options.githubToken);
        }

        const repoResult = await this.githubIntegration.createRepository(
          blueprint.config.github,
          fs,
          '/output'
        );

        repoUrl = repoResult.url;

        this.runStore.addArtifact(runId, {
          name: 'GitHub Repository',
          type: 'repo',
          url: repoUrl,
        });
      }

      // Add file manifest as artifact
      this.runStore.addArtifact(runId, {
        name: 'Generated Files',
        type: 'report',
        content: JSON.stringify(manifest, null, 2),
      });

      // Mark run as completed
      this.runStore.complete(runId);

      return {
        success: true,
        files: manifest.files,
        envVars: allEnvVars,
        scripts: allScripts,
        repoUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Execution failed', { error: message });
      this.runStore.fail(runId, message);
      throw error;
    }
  }

  /**
   * Copy a component package from the source repo to the output
   * Uses path mappings for intelligent file routing when available
   */
  private copyComponentToOutput(
    memFs: ReturnType<typeof createFsFromVolume>,
    outputPath: string,
    componentPath: string,
    packageName: string,
    pathContext: PathContext,
    pathMappings?: Record<string, PathCategory>
  ): void {
    const currentFileDir = dirname(fileURLToPath(import.meta.url));

    // Robust project root detection
    // 1. Check for environment variable
    // 2. Look for workspace marker (pnpm-workspace.yaml) in parent directories
    // 3. Fallback to rigid relative path
    let projectRoot = process.env.PROJECT_ROOT;

    if (!projectRoot) {
      let currentDir = currentFileDir;
      const rootMarker = 'pnpm-workspace.yaml';
      while (currentDir !== path.parse(currentDir).root) {
        if (realFs.existsSync(path.join(currentDir, rootMarker))) {
          projectRoot = currentDir;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
    }

    if (!projectRoot) {
      // Fallback: This handles both src (../../../../) and dist (../../../)
      // but the recursive search above is much more reliable
      projectRoot = path.resolve(currentFileDir, currentFileDir.includes('dist') ? '../../../' : '../../../../');
    }

    const sourcePath = path.join(projectRoot, componentPath);

    if (!realFs.existsSync(sourcePath)) {
      console.warn(`Component path not found: ${sourcePath}`);
      return;
    }

    console.log(`Copying component from: ${sourcePath}`);

    // If path mappings are provided and we have a frontend scaffold, use intelligent routing
    if (pathMappings && pathContext.hasFrontend) {
      console.log(`Using path mappings for ${packageName}`);
      this.copyWithPathMappings(realFs, memFs, sourcePath, outputPath, pathMappings, pathContext);
      return;
    }

    // Legacy: Special case for wallet-auth without path mappings
    if (packageName === '@cradle/wallet-auth' && pathContext.hasFrontend) {
      console.log('Merging wallet-auth into apps/web/src/ (frontend-scaffold detected)');
      this.copyWalletAuthMerged(realFs, memFs, sourcePath, outputPath);
      return;
    }

    // Default: Copy as separate package
    const dirName = packageName.includes('/')
      ? packageName.split('/').pop()!
      : packageName;

    const targetPath = `${outputPath}/packages/${dirName}`;

    this.copyDirectoryToMemfs(realFs, memFs, sourcePath, targetPath);
  }

  /**
   * Copy component files using path mappings for intelligent routing
   */
  private copyWithPathMappings(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
    pathMappings: Record<string, PathCategory>,
    pathContext: PathContext
  ): void {
    this.copyDirectoryWithMappings(sourceFs, targetFs, sourcePath, outputPath, '', pathMappings, pathContext);
  }

  /**
   * Recursively copy directory with path mapping resolution
   */
  private copyDirectoryWithMappings(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
    relativePath: string,
    pathMappings: Record<string, PathCategory>,
    pathContext: PathContext
  ): void {
    const currentPath = relativePath ? path.join(sourcePath, relativePath) : sourcePath;
    const items = sourceFs.readdirSync(currentPath);

    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item === 'target' || item.startsWith('.')) {
        continue;
      }

      const sourceItem = path.join(currentPath, item);
      const relativeItem = relativePath ? `${relativePath}/${item}` : item;
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        this.copyDirectoryWithMappings(
          sourceFs, targetFs, sourcePath, outputPath,
          relativeItem, pathMappings, pathContext
        );
      } else {
        const category = this.findPathCategory(relativeItem, pathMappings);

        if (category) {
          let targetPath: string;

          if (category === 'contract-source') {
            // For contract source files, preserve directory structure under contracts/
            // e.g., contract/erc20/src/lib.rs -> contracts/erc20/src/lib.rs
            const contractRelativePath = relativeItem.replace(/^contract\//, '');
            targetPath = `${outputPath}/contracts/${contractRelativePath}`;
          } else {
            const resolvedPath = resolveOutputPath(item, category, pathContext);
            targetPath = `${outputPath}/${resolvedPath}`;
          }

          const targetDir = path.dirname(targetPath);

          targetFs.mkdirSync(targetDir, { recursive: true });
          const content = sourceFs.readFileSync(sourceItem);
          targetFs.writeFileSync(targetPath, content);
          console.log(`  ${relativeItem} -> ${targetPath.replace(outputPath + '/', '')} (${category})`);
        } else {
          if (item === 'README.md' || item.endsWith('.md')) {
            const docsPath = `${outputPath}/docs`;
            targetFs.mkdirSync(docsPath, { recursive: true });
            const content = sourceFs.readFileSync(sourceItem);
            targetFs.writeFileSync(`${docsPath}/${item}`, content);
          }
        }
      }
    }
  }

  /**
   * Find the path category for a file based on path mappings
   * Supports glob-like patterns: ** for any path, * for any filename
   */
  private findPathCategory(
    filePath: string,
    pathMappings: Record<string, PathCategory>
  ): PathCategory | undefined {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const [pattern, category] of Object.entries(pathMappings)) {
      if (this.matchPattern(normalizedPath, pattern)) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Simple glob pattern matching
   * Supports: ** (any path), * (any filename without /)
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Escape regex special chars except * 
    let regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '<<<DOUBLE>>>') // Placeholder for **
      .replace(/\*/g, '[^/]*')          // * matches anything except /
      .replace(/<<<DOUBLE>>>/g, '.*');  // ** matches anything including /

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Copy wallet-auth files merged into apps/web/src/ structure
   */
  private copyWalletAuthMerged(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string
  ): void {
    const srcPath = path.join(sourcePath, 'src');
    if (!sourceFs.existsSync(srcPath)) {
      console.warn(`wallet-auth src/ not found: ${srcPath}`);
      return;
    }

    // Mapping: wallet-auth/src/X -> apps/web/src/X
    const webSrcPath = `${outputPath}/apps/web/src`;

    const items = sourceFs.readdirSync(srcPath);
    for (const item of items) {
      if (item === 'node_modules' || item.startsWith('.')) continue;

      const sourceItem = path.join(srcPath, item);
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        // Copy directories like hooks/, preserving folder structure
        const targetDir = `${webSrcPath}/${item}`;
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, targetDir);
      } else {
        // Copy individual files to lib/ (config.ts, constants.ts, types.ts, etc)
        const targetDir = `${webSrcPath}/lib`;
        targetFs.mkdirSync(targetDir, { recursive: true });
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(`${targetDir}/${item}`, content);
      }
    }

    // Also copy README.md to docs/wallet-auth/
    const readmePath = path.join(sourcePath, 'README.md');
    if (sourceFs.existsSync(readmePath)) {
      const docsPath = `${outputPath}/docs/wallet-auth`;
      targetFs.mkdirSync(docsPath, { recursive: true });
      const content = sourceFs.readFileSync(readmePath);
      targetFs.writeFileSync(`${docsPath}/README.md`, content);
    }
  }

  /**
   * Recursively copy a directory from real fs to memfs
   */
  private copyDirectoryToMemfs(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    targetPath: string
  ): void {
    targetFs.mkdirSync(targetPath, { recursive: true });

    const items = sourceFs.readdirSync(sourcePath);

    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item === 'target' || item.startsWith('.')) {
        continue;
      }

      const sourceItem = path.join(sourcePath, item);
      const targetItem = `${targetPath}/${item}`;
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, targetItem);
      } else {
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(targetItem, content);
      }
    }
  }
}


/**
 * Generate root project files
 */
function generateRootFiles(
  fs: ReturnType<typeof createFsFromVolume>,
  basePath: string,
  blueprint: Blueprint,
  envVars: CodegenOutput['envVars'],
  scripts: CodegenOutput['scripts'],
  pathContext?: PathContext
): void {
  // Determine if we need monorepo structure
  // Only need monorepo if:
  // 1. Has backend (multiple apps need coordination), OR
  // 2. Has contracts WITHOUT frontend (standalone contract project needs different setup)
  // When frontend + ERC contracts, we don't need monorepo - frontend handles the interaction
  const needsMonorepo = pathContext?.hasBackend ||
    (pathContext?.hasContracts && !pathContext?.hasFrontend) ||
    !pathContext?.hasFrontend;
  const { project } = blueprint.config;

  // Generate package.json
  // Adjust scripts based on whether we need monorepo structure
  const packageJson = needsMonorepo ? {
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: project.version,
    description: project.description,
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      ...Object.fromEntries(scripts.map(s => [s.name, s.command])),
    },
    dependencies: {},
    devDependencies: {
      typescript: '^5.3.0',
    },
    packageManager: 'pnpm@9.0.0',
    author: project.author,
    license: project.license,
    keywords: project.keywords,
  } : {
    // Standalone frontend - simpler package.json pointing to apps/web
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: project.version,
    description: project.description,
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      ...Object.fromEntries(scripts.map(s => [s.name, s.command])),
    },
    dependencies: {},
    devDependencies: {
      typescript: '^5.3.0',
    },
    packageManager: 'pnpm@9.0.0',
    license: project.license,
    keywords: project.keywords,
  };

  fs.writeFileSync(
    `${basePath}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );

  // Generate .env.example
  // Put in apps/web for standalone frontend, root for monorepo
  const envExampleHeader = '# Environment Variables\n# Copy this file to .env and fill in the values\n\n';
  const envVarsContent = envVars
    .map(v => `# ${v.description}${v.required ? ' (required)' : ''}${v.secret ? ' [secret]' : ''}\n${v.key}=${v.defaultValue || ''}`)
    .join('\n\n');
  const envExample = envExampleHeader + (envVarsContent || '# No environment variables required\n');

  const envPath = pathContext?.hasFrontend && !needsMonorepo
    ? `${basePath}/apps/web/.env.example`
    : `${basePath}/.env.example`;
  fs.writeFileSync(envPath, envExample);

  // Generate README.md
  const readme = generateReadme(project, scripts, envVars);
  fs.writeFileSync(`${basePath}/README.md`, readme);

  // Generate .gitignore
  const gitignore = `# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store

# Logs
*.log

# Test coverage
coverage/

# Rust/WASM
target/
*.wasm

# Generated
*.generated.*
`;
  fs.writeFileSync(`${basePath}/.gitignore`, gitignore);

  // Generate turbo.json and pnpm-workspace.yaml only for monorepo structure
  if (needsMonorepo) {
    // Generate turbo.json
    const turboConfig = {
      $schema: 'https://turbo.build/schema.json',
      tasks: {
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**', '.next/**'],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        test: {
          dependsOn: ['^build'],
        },
        lint: {},
      },
    };
    // fs.writeFileSync(`${basePath}/turbo.json`, JSON.stringify(turboConfig, null, 2));

    // Generate pnpm-workspace.yaml
    const pnpmWorkspace = `packages:
  - "apps/*"
  - "packages/*"
  - "contracts/*"
`;
    fs.writeFileSync(`${basePath}/pnpm-workspace.yaml`, pnpmWorkspace);
  }
}

function generateReadme(
  project: Blueprint['config']['project'],
  scripts: CodegenOutput['scripts'],
  envVars: CodegenOutput['envVars']
): string {
  const appSlug = project.name.toLowerCase().replace(/\s+/g, '-');

  return `# ${project.name}

${project.description || 'A Web3 dApp generated with [Cradle](https://cradle.dev) featuring smart contract interactions.'}

## 📁 Project Structure

\`\`\`
${appSlug}/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # React components
│       │   │   └── contract-interactions/
│       │   │       └── ERC20InteractionPanel.tsx
│       │   └── lib/            # Utilities & wagmi config
│       ├── package.json
│       ├── tailwind.config.js
│       └── postcss.config.js
├── contracts/                  # Rust/Stylus smart contracts
│   └── erc20/                  # ERC-20 token contract source
├── docs/                       # Documentation
├── .gitignore
└── README.md
\`\`\`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd ${appSlug}
   \`\`\`

2. **Navigate to the web app:**
   \`\`\`bash
   cd apps/web
   \`\`\`

3. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

4. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

   Edit \`.env.local\` and configure:
   ${envVars.filter(v => v.required).map(v => `   - \`${v.key}\`: ${v.description}`).join('\n') || '   - No required variables'}

   > **Get a WalletConnect Project ID** at [WalletConnect Cloud](https://cloud.walletconnect.com/)

5. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🔗 Smart Contracts

The \`contracts/\` folder contains Rust/Stylus smart contract source code.

**Default deployed contracts (Arbitrum Sepolia testnet):**
- ERC-20: \`0x5af02ab1d47cc700c1ec4578618df15b8c9c565e\`

## 🛠 Available Scripts

Run these from the \`apps/web\` directory:

| Command | Description |
|---------|-------------|
| \`npm run dev\` | Start development server |
| \`npm run build\` | Build for production |
| \`npm run start\` | Start production server |
| \`npm run lint\` | Run ESLint |

## 🌐 Supported Networks

- Arbitrum Sepolia (Testnet)
- Arbitrum One (Mainnet)
- Superposition
- Superposition Testnet

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem
- **Wallet Connection:** RainbowKit

## 📖 Documentation

See the \`docs/\` folder for:
- Contract interaction guide
- Deployment instructions
- API reference

## License

${project.license}

---

Generated with ❤️ by [Cradle](https://cradle.dev)
`;
}

