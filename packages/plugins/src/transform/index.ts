import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { TransformConfig } from '@dapp-forge/blueprint-schema';

export class TransformPlugin extends BasePlugin<z.infer<typeof TransformConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'transform',
    name: 'Transform',
    version: '0.1.0',
    description: 'Map and transform data between blocks',
    category: 'app',
    tags: ['transform', 'map', 'data', 'convert', 'json', 'web2'],
  };

  readonly configSchema = TransformConfig as unknown as z.ZodType<z.infer<typeof TransformConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'transform-in', name: 'Input', type: 'input', dataType: 'config' },
    { id: 'transform-out', name: 'Output', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof TransformConfig>> {
    return { transformType: 'template', inputMapping: '', outputFormat: 'json', transformExpression: '' };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(output, 'transformer.ts', generateTransformer(config), 'frontend-lib');
    this.addFile(output, 'useTransform.ts', generateHook(config), 'frontend-hooks');
    this.addDoc(output, 'docs/logic/transform.md', 'Transform Block', generateDocs(config));

    context.logger.info('Generated data transformer', { nodeId: node.id, type: config.transformType });
    return output;
  }
}

function generateTransformer(config: z.infer<typeof TransformConfig>): string {
  return `export type TransformType = 'jq' | 'jsonpath' | 'template' | 'javascript';
export type OutputFormat = 'json' | 'text' | 'csv';

export interface TransformOptions {
  type: TransformType;
  expression: string;
  outputFormat: OutputFormat;
}

export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.replace(/\\[(\d+)\\]/g, '.$1').split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function templateReplace(template: string, data: Record<string, unknown>): string {
  return template.replace(/\\{\\{\\s*([\\w.\\[\\]]+)\\s*\\}\\}/g, (_, path: string) => {
    const value = getByPath(data, path);
    return value != null ? String(value) : '';
  });
}

export function transform(input: unknown, options: TransformOptions): unknown {
  const { type, expression, outputFormat } = options;

  let result: unknown;

  switch (type) {
    case 'jsonpath':
      result = getByPath(input, expression);
      break;
    case 'template':
      result = templateReplace(expression, (input ?? {}) as Record<string, unknown>);
      break;
    case 'javascript':
      try {
        const fn = new Function('input', \`return (\${expression})\`);
        result = fn(input);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : 'Transform failed' };
      }
      break;
    default:
      result = input;
  }

  switch (outputFormat) {
    case 'text':
      return String(result ?? '');
    case 'csv':
      if (Array.isArray(result)) {
        if (result.length === 0) return '';
        const headers = Object.keys(result[0] as Record<string, unknown>);
        const rows = result.map((r) =>
          headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(','),
        );
        return [headers.join(','), ...rows].join('\\n');
      }
      return String(result ?? '');
    default:
      return result;
  }
}
`;
}

function generateHook(config: z.infer<typeof TransformConfig>): string {
  return `import { useMemo } from 'react';
import { transform, type TransformOptions } from '../lib/transformer';

export function useTransform<T = unknown>(
  input: unknown,
  options?: Partial<TransformOptions>,
): T {
  const opts: TransformOptions = {
    type: options?.type ?? '${config.transformType}',
    expression: options?.expression ?? \`${config.transformExpression.replace(/`/g, '\\`')}\`,
    outputFormat: options?.outputFormat ?? '${config.outputFormat}',
  };

  return useMemo(() => transform(input, opts) as T, [input, opts.type, opts.expression, opts.outputFormat]);
}
`;
}

function generateDocs(config: z.infer<typeof TransformConfig>): string {
  return `# Transform Block

Maps and transforms data between workflow blocks.

## Configuration
- **Transform Type**: ${config.transformType}
- **Output Format**: ${config.outputFormat}

## Usage

\`\`\`typescript
import { transform } from '@/lib/transform/lib/transformer';

const result = transform(inputData, {
  type: 'jsonpath',
  expression: 'data.items',
  outputFormat: 'json',
});
\`\`\`
`;
}
