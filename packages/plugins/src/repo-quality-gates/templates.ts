import type { z } from 'zod';
import type { RepoQualityGatesConfig, BlueprintConfig } from '@dapp-forge/blueprint-schema';
import { dedent } from '@dapp-forge/plugin-sdk';

type Config = z.infer<typeof RepoQualityGatesConfig>;

/**
 * Generate GitHub Actions CI workflow
 */
export function generateGitHubActionsWorkflow(config: Config, blueprintConfig: BlueprintConfig): string {
  return dedent(`
    name: CI

    on:
      push:
        branches: [main, master]
      pull_request:
        branches: [main, master]

    concurrency:
      group: \${{ github.workflow }}-\${{ github.ref }}
      cancel-in-progress: true

    jobs:
      quality:
        name: Code Quality
        runs-on: ubuntu-latest
        
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Setup pnpm
            uses: pnpm/action-setup@v2
            with:
              version: 9

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'pnpm'

          - name: Install dependencies
            run: pnpm install --frozen-lockfile

          - name: Lint
            run: pnpm lint

          - name: Format check
            run: pnpm format:check

          ${config.typecheck ? `
          - name: Type check
            run: pnpm typecheck
          ` : ''}

      test:
        name: Tests
        runs-on: ubuntu-latest
        needs: quality
        
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Setup pnpm
            uses: pnpm/action-setup@v2
            with:
              version: 9

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'pnpm'

          - name: Install dependencies
            run: pnpm install --frozen-lockfile

          - name: Run tests
            run: pnpm test:coverage

          - name: Upload coverage
            uses: codecov/codecov-action@v3
            with:
              files: ./coverage/lcov.info
              fail_ci_if_error: false

      ${config.securityScanning ? `
      security:
        name: Security Scan
        runs-on: ubuntu-latest
        needs: quality
        
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Run Trivy vulnerability scanner
            uses: aquasecurity/trivy-action@master
            with:
              scan-type: 'fs'
              scan-ref: '.'
              severity: 'CRITICAL,HIGH'
      ` : ''}

      ${config.dependencyAudit ? `
      audit:
        name: Dependency Audit
        runs-on: ubuntu-latest
        
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Setup pnpm
            uses: pnpm/action-setup@v2
            with:
              version: 9

          - name: Audit dependencies
            run: pnpm audit --audit-level=high
      ` : ''}

      build:
        name: Build
        runs-on: ubuntu-latest
        needs: [quality, test]
        
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Setup pnpm
            uses: pnpm/action-setup@v2
            with:
              version: 9

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'pnpm'

          - name: Install dependencies
            run: pnpm install --frozen-lockfile

          - name: Build
            run: pnpm build

          - name: Upload build artifacts
            uses: actions/upload-artifact@v4
            with:
              name: build
              path: |
                dist/
                .next/
              retention-days: 7
  `);
}

/**
 * Generate Biome configuration
 */
export function generateBiomeConfig(config: Config): string {
  return JSON.stringify({
    $schema: 'https://biomejs.dev/schemas/1.5.0/schema.json',
    organizeImports: {
      enabled: true,
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
        complexity: {
          noExcessiveCognitiveComplexity: 'warn',
          noForEach: 'off',
        },
        correctness: {
          noUnusedImports: 'error',
          noUnusedVariables: 'error',
          useExhaustiveDependencies: 'warn',
        },
        style: {
          noNonNullAssertion: 'warn',
          useConst: 'error',
          useImportType: 'error',
        },
        suspicious: {
          noExplicitAny: 'error',
          noConsoleLog: 'warn',
        },
        security: {
          noDangerouslySetInnerHtml: 'error',
        },
      },
    },
    formatter: {
      enabled: true,
      indentStyle: 'space',
      indentWidth: 2,
      lineWidth: 100,
    },
    javascript: {
      formatter: {
        quoteStyle: 'single',
        trailingComma: 'es5',
        semicolons: 'always',
      },
    },
    files: {
      ignore: [
        'node_modules',
        'dist',
        'build',
        '.next',
        'coverage',
        '*.min.*',
        'target',
      ],
    },
  }, null, 2);
}

/**
 * Generate ESLint configuration
 */
export function generateESLintConfig(config: Config): string {
  return dedent(`
    import js from '@eslint/js';
    import tseslint from 'typescript-eslint';
    import reactPlugin from 'eslint-plugin-react';
    import reactHooksPlugin from 'eslint-plugin-react-hooks';

    export default tseslint.config(
      js.configs.recommended,
      ...tseslint.configs.recommended,
      {
        files: ['**/*.{ts,tsx}'],
        plugins: {
          react: reactPlugin,
          'react-hooks': reactHooksPlugin,
        },
        rules: {
          '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/consistent-type-imports': 'error',
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'warn',
          'no-console': 'warn',
        },
        settings: {
          react: {
            version: 'detect',
          },
        },
      },
      {
        ignores: [
          'node_modules/',
          'dist/',
          'build/',
          '.next/',
          'coverage/',
          '*.config.js',
        ],
      }
    );
  `);
}

/**
 * Generate Prettier configuration
 */
export function generatePrettierConfig(): string {
  return JSON.stringify({
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
  }, null, 2);
}

/**
 * Generate Vitest configuration
 */
export function generateVitestConfig(config: Config): string {
  return dedent(`
    import { defineConfig } from 'vitest/config';
    import react from '@vitejs/plugin-react';
    import path from 'path';

    export default defineConfig({
      plugins: [react()],
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.next'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html', 'lcov'],
          exclude: [
            'node_modules/',
            'src/test/',
            '**/*.d.ts',
            '**/*.config.*',
            '**/types/**',
          ],
          thresholds: {
            lines: ${config.coverageThreshold},
            functions: ${config.coverageThreshold},
            branches: ${config.coverageThreshold - 10},
            statements: ${config.coverageThreshold},
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    });
  `);
}

/**
 * Generate Jest configuration
 */
export function generateJestConfig(config: Config): string {
  return dedent(`
    /** @type {import('jest').Config} */
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
      transform: {
        '^.+\\\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/test/**',
        '!src/**/types/**',
      ],
      coverageThreshold: {
        global: {
          branches: ${config.coverageThreshold - 10},
          functions: ${config.coverageThreshold},
          lines: ${config.coverageThreshold},
          statements: ${config.coverageThreshold},
        },
      },
      coverageReporters: ['text', 'lcov', 'html'],
    };
  `);
}

/**
 * Generate pre-commit configuration
 */
export function generatePreCommitConfig(config: Config): string {
  const stages: string[] = [];

  if (config.linter === 'biome') {
    stages.push('biome lint --write');
  } else {
    stages.push('eslint --fix');
  }

  if (config.formatter === 'biome') {
    stages.push('biome format --write');
  } else if (config.formatter === 'prettier') {
    stages.push('prettier --write');
  }

  return JSON.stringify({
    '*.{js,jsx,ts,tsx}': stages,
  }, null, 2);
}

/**
 * Generate TypeScript configuration
 */
export function generateTypeScriptConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowImportingTsExtensions: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      strictNullChecks: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      skipLibCheck: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*', '*.config.ts'],
    exclude: ['node_modules', 'dist', 'build'],
  }, null, 2);
}

