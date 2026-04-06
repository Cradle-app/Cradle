import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { IfElseConfig } from '@dapp-forge/blueprint-schema';

export class IfElsePlugin extends BasePlugin<z.infer<typeof IfElseConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'if-else',
    name: 'If / Else',
    version: '0.1.0',
    description: 'Conditional branching based on expressions',
    category: 'app',
    tags: ['condition', 'branch', 'logic', 'if', 'else', 'web2'],
  };

  readonly configSchema = IfElseConfig as unknown as z.ZodType<z.infer<typeof IfElseConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'condition-in', name: 'Input', type: 'input', dataType: 'config' },
    { id: 'true-out', name: 'True Branch', type: 'output', dataType: 'config' },
    { id: 'false-out', name: 'False Branch', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof IfElseConfig>> {
    return {
      conditionType: 'value-compare',
      condition: '',
      compareOperator: 'eq',
      compareValue: '',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(
      output,
      'condition-evaluator.ts',
      generateConditionEvaluator(),
      'frontend-lib',
    );

    this.addFile(
      output,
      'useCondition.ts',
      generateConditionHook(config),
      'frontend-hooks',
    );

    this.addDoc(
      output,
      'docs/logic/if-else.md',
      'If/Else Conditional Block',
      generateDocs(config),
    );

    context.logger.info('Generated if/else conditional utilities', { nodeId: node.id });
    return output;
  }
}

function generateConditionEvaluator(): string {
  return `export type CompareOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith';

export interface ConditionConfig {
  conditionType: 'expression' | 'value-compare' | 'exists';
  condition: string;
  compareOperator: CompareOperator;
  compareValue: string;
}

export function evaluateCondition(
  value: unknown,
  config: ConditionConfig,
): boolean {
  if (config.conditionType === 'exists') {
    return value !== undefined && value !== null && value !== '';
  }

  if (config.conditionType === 'expression') {
    try {
      return Boolean(config.condition);
    } catch {
      return false;
    }
  }

  const strValue = String(value ?? '');
  const compare = config.compareValue;

  switch (config.compareOperator) {
    case 'eq': return strValue === compare;
    case 'neq': return strValue !== compare;
    case 'gt': return Number(strValue) > Number(compare);
    case 'lt': return Number(strValue) < Number(compare);
    case 'gte': return Number(strValue) >= Number(compare);
    case 'lte': return Number(strValue) <= Number(compare);
    case 'contains': return strValue.includes(compare);
    case 'startsWith': return strValue.startsWith(compare);
    default: return false;
  }
}
`;
}

function generateConditionHook(config: z.infer<typeof IfElseConfig>): string {
  return `import { useMemo } from 'react';
import { evaluateCondition, type ConditionConfig } from '../lib/condition-evaluator';

export function useCondition(value: unknown, config?: Partial<ConditionConfig>) {
  const resolvedConfig: ConditionConfig = {
    conditionType: config?.conditionType ?? '${config.conditionType}',
    condition: config?.condition ?? '${config.condition}',
    compareOperator: config?.compareOperator ?? '${config.compareOperator}',
    compareValue: config?.compareValue ?? '${config.compareValue}',
  };

  const result = useMemo(
    () => evaluateCondition(value, resolvedConfig),
    [value, resolvedConfig.condition, resolvedConfig.compareOperator, resolvedConfig.compareValue],
  );

  return { result, isTrue: result, isFalse: !result };
}
`;
}

function generateDocs(config: z.infer<typeof IfElseConfig>): string {
  return `# If/Else Conditional Block

Evaluates conditions and branches execution accordingly.

## Configuration
- **Condition Type**: ${config.conditionType}
- **Operator**: ${config.compareOperator}

## Usage

\`\`\`typescript
import { evaluateCondition } from '@/lib/if-else/lib/condition-evaluator';

const result = evaluateCondition(myValue, {
  conditionType: 'value-compare',
  condition: '',
  compareOperator: 'eq',
  compareValue: 'expected',
});

if (result) {
  // true branch
} else {
  // false branch
}
\`\`\`
`;
}
