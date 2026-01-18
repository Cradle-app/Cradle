import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { RepoQualityGatesConfig } from '@dapp-forge/blueprint-schema';
import {
  generateGitHubActionsWorkflow,
  generateBiomeConfig,
  generateESLintConfig,
  generatePrettierConfig,
  generateVitestConfig,
  generateJestConfig,
  generatePreCommitConfig,
  generateTypeScriptConfig,
} from './templates';

/**
 * Repository Quality Gates Plugin
 * Generates CI/CD, testing, linting, and formatting configuration
 */
export class RepoQualityGatesPlugin extends BasePlugin<z.infer<typeof RepoQualityGatesConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'repo-quality-gates',
    name: 'Repository Quality Gates',
    version: '0.1.0',
    description: 'Generate CI/CD pipelines, testing, linting, and formatting configuration',
    category: 'quality',
    tags: ['ci', 'testing', 'lint', 'format', 'quality'],
  };

  readonly configSchema = RepoQualityGatesConfig as unknown as z.ZodType<z.infer<typeof RepoQualityGatesConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'config-out',
      name: 'Quality Config',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof RepoQualityGatesConfig>> {
    return {
      ciProvider: 'github-actions',
      testFramework: 'vitest',
      linter: 'biome',
      formatter: 'biome',
      typecheck: true,
      preCommitHooks: true,
      coverageThreshold: 80,
      securityScanning: true,
      dependencyAudit: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate CI workflow
    if (config.ciProvider === 'github-actions') {
      this.addFile(
        output,
        '.github/workflows/ci.yml',
        generateGitHubActionsWorkflow(config, context.config)
      );
    }

    // Generate linter config
    if (config.linter === 'biome') {
      this.addFile(output, 'biome.json', generateBiomeConfig(config));
    } else if (config.linter === 'eslint') {
      this.addFile(output, 'eslint.config.js', generateESLintConfig(config));
    }

    // Generate formatter config (if different from linter)
    if (config.formatter === 'prettier' && config.linter !== 'biome') {
      this.addFile(output, '.prettierrc', generatePrettierConfig());
      this.addFile(output, '.prettierignore', generatePrettierIgnore());
    }

    // Generate test config
    if (config.testFramework === 'vitest') {
      this.addFile(output, 'vitest.config.ts', generateVitestConfig(config));
    } else if (config.testFramework === 'jest') {
      this.addFile(output, 'jest.config.js', generateJestConfig(config));
    }

    // Generate TypeScript config
    if (config.typecheck) {
      this.addFile(output, 'tsconfig.json', generateTypeScriptConfig());
    }

    // Generate pre-commit hooks
    if (config.preCommitHooks) {
      this.addFile(output, '.husky/pre-commit', generatePreCommitHook(config));
      this.addFile(output, '.lintstagedrc', generateLintStagedConfig(config));
    }

    // Generate editor config
    this.addFile(output, '.editorconfig', generateEditorConfig());

    // Add scripts
    this.addScript(output, 'lint', getLintCommand(config), 'Run linter');
    this.addScript(output, 'lint:fix', getLintFixCommand(config), 'Fix lint errors');
    this.addScript(output, 'format', getFormatCommand(config), 'Format code');
    this.addScript(output, 'format:check', getFormatCheckCommand(config), 'Check formatting');
    this.addScript(output, 'test', getTestCommand(config), 'Run tests');
    this.addScript(output, 'test:coverage', getTestCoverageCommand(config), 'Run tests with coverage');
    
    if (config.typecheck) {
      this.addScript(output, 'typecheck', 'tsc --noEmit', 'Run type checker');
    }

    if (config.preCommitHooks) {
      this.addScript(output, 'prepare', 'husky', 'Set up git hooks');
    }

    // Add documentation
    this.addDoc(
      output,
      'docs/development/quality.md',
      'Code Quality Guidelines',
      generateQualityDocs(config)
    );

    context.logger.info('Generated repository quality gates', {
      nodeId: node.id,
      ciProvider: config.ciProvider,
      testFramework: config.testFramework,
    });

    return output;
  }
}

function getLintCommand(config: z.infer<typeof RepoQualityGatesConfig>): string {
  return config.linter === 'biome' ? 'biome lint .' : 'eslint .';
}

function getLintFixCommand(config: z.infer<typeof RepoQualityGatesConfig>): string {
  return config.linter === 'biome' ? 'biome lint --write .' : 'eslint --fix .';
}

function getFormatCommand(config: z.infer<typeof RepoQualityGatesConfig>): string {
  if (config.formatter === 'biome') return 'biome format --write .';
  return 'prettier --write .';
}

function getFormatCheckCommand(config: z.infer<typeof RepoQualityGatesConfig>): string {
  if (config.formatter === 'biome') return 'biome format .';
  return 'prettier --check .';
}

function getTestCommand(config: z.infer<typeof RepoQualityGatesConfig>): string {
  return config.testFramework === 'vitest' ? 'vitest run' : 'jest';
}

function getTestCoverageCommand(config: z.infer<typeof RepoQualityGatesConfig>): string {
  return config.testFramework === 'vitest' ? 'vitest run --coverage' : 'jest --coverage';
}

function generatePreCommitHook(config: z.infer<typeof RepoQualityGatesConfig>): string {
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
${config.typecheck ? 'pnpm typecheck' : ''}
`;
}

function generateLintStagedConfig(config: z.infer<typeof RepoQualityGatesConfig>): string {
  const commands: string[] = [];
  
  if (config.linter === 'biome') {
    commands.push('"biome lint --write"');
  } else {
    commands.push('"eslint --fix"');
  }

  if (config.formatter === 'biome') {
    commands.push('"biome format --write"');
  } else if (config.formatter === 'prettier') {
    commands.push('"prettier --write"');
  }

  return JSON.stringify({
    '*.{js,jsx,ts,tsx}': commands,
    '*.{json,md,yml,yaml}': config.formatter === 'biome' 
      ? ['"biome format --write"']
      : ['"prettier --write"'],
  }, null, 2);
}

function generateEditorConfig(): string {
  return `# EditorConfig helps maintain consistent coding styles
# https://editorconfig.org

root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{rs,toml}]
indent_size = 4

[Makefile]
indent_style = tab
`;
}

function generatePrettierIgnore(): string {
  return `# Build outputs
dist/
build/
.next/
out/

# Dependencies
node_modules/

# Generated files
*.generated.*
*.min.*

# Rust/WASM
target/
*.wasm

# Coverage
coverage/
`;
}

function generateQualityDocs(config: z.infer<typeof RepoQualityGatesConfig>): string {
  return `# Code Quality Guidelines

This document describes the code quality tools and standards used in this project.

## Overview

| Tool | Purpose | Command |
|------|---------|---------|
| ${config.linter} | Linting | \`pnpm lint\` |
| ${config.formatter} | Formatting | \`pnpm format\` |
| ${config.testFramework} | Testing | \`pnpm test\` |
${config.typecheck ? '| TypeScript | Type Checking | `pnpm typecheck` |' : ''}

## Linting

We use **${config.linter}** for code linting.

\`\`\`bash
# Check for lint errors
pnpm lint

# Auto-fix lint errors
pnpm lint:fix
\`\`\`

## Formatting

We use **${config.formatter}** for code formatting.

\`\`\`bash
# Format all files
pnpm format

# Check formatting without modifying
pnpm format:check
\`\`\`

## Testing

We use **${config.testFramework}** for testing.

\`\`\`bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage
\`\`\`

### Coverage Requirements

- Minimum coverage threshold: **${config.coverageThreshold}%**
- Coverage report is generated in the \`coverage/\` directory

${config.typecheck ? `
## Type Checking

TypeScript is used for type safety.

\`\`\`bash
pnpm typecheck
\`\`\`
` : ''}

${config.preCommitHooks ? `
## Pre-commit Hooks

This project uses Husky and lint-staged to run quality checks before commits.

The following checks run automatically:
- Lint staged files
- Format staged files
${config.typecheck ? '- Type check the entire project' : ''}

To bypass hooks in emergencies (not recommended):
\`\`\`bash
git commit --no-verify -m "your message"
\`\`\`
` : ''}

## CI/CD

${config.ciProvider === 'github-actions' ? `
GitHub Actions runs the following checks on every PR:

1. **Lint** - Ensures code follows style guidelines
2. **Format** - Verifies code formatting
3. **Test** - Runs the test suite with coverage
${config.typecheck ? '4. **Typecheck** - Validates TypeScript types' : ''}
${config.securityScanning ? '5. **Security Scan** - Checks for vulnerabilities' : ''}
${config.dependencyAudit ? '6. **Dependency Audit** - Audits npm dependencies' : ''}
` : ''}

## Best Practices

1. Run \`pnpm lint:fix && pnpm format\` before committing
2. Write tests for new features
3. Maintain ${config.coverageThreshold}%+ test coverage
4. Keep dependencies up to date
5. Address lint warnings, don't suppress them
`;
}

