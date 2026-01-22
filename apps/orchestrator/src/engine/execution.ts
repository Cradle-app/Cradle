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
import { getDefaultRegistry, type NodePlugin } from '@dapp-forge/plugin-sdk';
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
        };

        // Validate node config
        const validationResult = await plugin.validate(node.config, context);
        if (!validationResult.valid) {
          const errors = validationResult.errors.map(e => `${e.field}: ${e.message}`).join(', ');
          throw new Error(`Node ${node.id} validation failed: ${errors}`);
        }

        // Generate code
        const output = await plugin.generate(node, context);
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
            plugin.componentPackage || 'component'
          );
        }


        // Collect env vars and scripts
        allEnvVars.push(...output.envVars);
        allScripts.push(...output.scripts);

        logger.info(`Node ${node.type} generated ${output.files.length} files`, { nodeId: node.id });
      }

      // Generate root files
      generateRootFiles(fs, '/output', blueprint, allEnvVars, allScripts);

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
   */
  private copyComponentToOutput(
    memFs: ReturnType<typeof createFsFromVolume>,
    outputPath: string,
    componentPath: string,
    packageName: string
  ): void {
    const currentFileDir = dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(currentFileDir, '../../../../');
    const sourcePath = path.join(projectRoot, componentPath);

    if (!realFs.existsSync(sourcePath)) {
      console.warn(`Component path not found: ${sourcePath}`);
      return;
    }

    console.log(`Copying component from: ${sourcePath}`);

    const dirName = packageName.includes('/')
      ? packageName.split('/').pop()!
      : packageName;

    const targetPath = `${outputPath}/packages/${dirName}`;

    this.copyDirectoryToMemfs(realFs, memFs, sourcePath, targetPath);

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
      if (item === 'node_modules' || item === 'dist' || item.startsWith('.')) {
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
  scripts: CodegenOutput['scripts']
): void {
  const { project } = blueprint.config;

  // Generate package.json
  const packageJson = {
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: project.version,
    description: project.description,
    private: true,
    scripts: {
      dev: 'turbo run dev',
      build: 'turbo run build',
      test: 'turbo run test',
      lint: 'turbo run lint',
      ...Object.fromEntries(scripts.map(s => [s.name, s.command])),
    },
    dependencies: {},
    devDependencies: {
      turbo: '^2.0.0',
      typescript: '^5.3.0',
    },
    packageManager: 'pnpm@9.0.0',
    author: project.author,
    license: project.license,
    keywords: project.keywords,
  };

  fs.writeFileSync(
    `${basePath}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );

  // Generate .env.example
  const envExampleHeader = '# Environment Variables\n# Copy this file to .env and fill in the values\n\n';
  const envVarsContent = envVars
    .map(v => `# ${v.description}${v.required ? ' (required)' : ''}${v.secret ? ' [secret]' : ''}\n${v.key}=${v.defaultValue || ''}`)
    .join('\n\n');
  const envExample = envExampleHeader + (envVarsContent || '# No environment variables required\n');

  fs.writeFileSync(`${basePath}/.env.example`, envExample);

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
  fs.writeFileSync(`${basePath}/turbo.json`, JSON.stringify(turboConfig, null, 2));

  // Generate pnpm-workspace.yaml
  const pnpmWorkspace = `packages:
  - "src/*"
  - "contracts/*"
`;
  fs.writeFileSync(`${basePath}/pnpm-workspace.yaml`, pnpmWorkspace);
}

function generateReadme(
  project: Blueprint['config']['project'],
  scripts: CodegenOutput['scripts'],
  envVars: CodegenOutput['envVars']
): string {
  return `# ${project.name}

${project.description || 'A Web3 application generated by Cradle.'}

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Rust (for Stylus contracts)

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Environment Variables

Copy \`.env.example\` to \`.env\` and fill in the required values:

\`\`\`bash
cp .env.example .env
\`\`\`

Required variables:
${envVars.filter(v => v.required).map(v => `- \`${v.key}\`: ${v.description}`).join('\n')}

### Development

\`\`\`bash
pnpm dev
\`\`\`

### Available Scripts

${scripts.map(s => `- \`pnpm ${s.name}\`: ${s.description || s.command}`).join('\n')}

## Project Structure

\`\`\`
├── src/                 # Application source code
├── contracts/           # Stylus smart contracts
├── docs/               # Documentation
├── .github/            # GitHub Actions workflows
└── package.json
\`\`\`

## License

${project.license}

---

Generated with ❤️ by [Cradle](https://cradle.dev)
`;
}

