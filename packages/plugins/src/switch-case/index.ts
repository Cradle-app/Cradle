import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { SwitchCaseConfig } from '@dapp-forge/blueprint-schema';

export class SwitchCasePlugin extends BasePlugin<z.infer<typeof SwitchCaseConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'switch-case',
    name: 'Switch / Case',
    version: '0.1.0',
    description: 'Multi-way branching with pattern matching',
    category: 'app',
    tags: ['switch', 'case', 'branch', 'logic', 'routing', 'web2'],
  };

  readonly configSchema = SwitchCaseConfig as unknown as z.ZodType<z.infer<typeof SwitchCaseConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'switch-in', name: 'Input', type: 'input', dataType: 'config' },
    { id: 'switch-out', name: 'Output', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof SwitchCaseConfig>> {
    return {
      switchExpression: '',
      cases: [{ value: '', label: 'Case 1' }],
      hasDefault: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(output, 'switch-router.ts', generateSwitchRouter(config), 'frontend-lib');
    this.addFile(output, 'useSwitchCase.ts', generateSwitchHook(config), 'frontend-hooks');
    this.addDoc(output, 'docs/logic/switch-case.md', 'Switch/Case Block', generateDocs(config));

    context.logger.info('Generated switch/case utilities', { nodeId: node.id });
    return output;
  }
}

function generateSwitchRouter(config: z.infer<typeof SwitchCaseConfig>): string {
  return `export interface SwitchCase {
  value: string;
  label: string;
}

export interface SwitchResult<T = unknown> {
  matched: boolean;
  matchedCase: SwitchCase | null;
  value: T | undefined;
}

export function switchRoute<T>(
  expression: string,
  cases: SwitchCase[],
  handlers: Record<string, () => T>,
  defaultHandler?: () => T,
): SwitchResult<T> {
  for (const c of cases) {
    if (expression === c.value) {
      const handler = handlers[c.value];
      return {
        matched: true,
        matchedCase: c,
        value: handler ? handler() : undefined,
      };
    }
  }

  return {
    matched: false,
    matchedCase: null,
    value: defaultHandler ? defaultHandler() : undefined,
  };
}
`;
}

function generateSwitchHook(config: z.infer<typeof SwitchCaseConfig>): string {
  return `import { useMemo } from 'react';
import { switchRoute, type SwitchCase } from '../lib/switch-router';

const DEFAULT_CASES: SwitchCase[] = ${JSON.stringify(config.cases)};

export function useSwitchCase<T>(
  expression: string,
  handlers: Record<string, () => T>,
  options?: { cases?: SwitchCase[]; defaultHandler?: () => T },
) {
  const cases = options?.cases ?? DEFAULT_CASES;
  const result = useMemo(
    () => switchRoute(expression, cases, handlers, options?.defaultHandler),
    [expression, cases, handlers, options?.defaultHandler],
  );
  return result;
}
`;
}

function generateDocs(config: z.infer<typeof SwitchCaseConfig>): string {
  return `# Switch/Case Block

Routes execution through multiple branches based on an expression value.

## Cases
${config.cases.map((c, i) => `- **${c.label}**: matches \`${c.value || '(empty)'}\``).join('\n')}
${config.hasDefault ? '- **Default**: fallback when no case matches' : ''}

## Usage

\`\`\`typescript
import { switchRoute } from '@/lib/switch-case/lib/switch-router';

const result = switchRoute(myValue, cases, {
  'option-a': () => handleA(),
  'option-b': () => handleB(),
}, () => handleDefault());
\`\`\`
`;
}
