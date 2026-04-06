import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { VariableStoreConfig } from '@dapp-forge/blueprint-schema';

export class VariableStorePlugin extends BasePlugin<z.infer<typeof VariableStoreConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'variable-store',
    name: 'Variable',
    version: '0.1.0',
    description: 'Declare and set variables for use across blocks',
    category: 'app',
    tags: ['variable', 'store', 'state', 'data', 'assign', 'web2'],
  };

  readonly configSchema = VariableStoreConfig as unknown as z.ZodType<z.infer<typeof VariableStoreConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'var-in', name: 'Set Value', type: 'input', dataType: 'config' },
    { id: 'var-out', name: 'Value', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof VariableStoreConfig>> {
    return { variableName: 'myVariable', variableType: 'string', defaultValue: '', scope: 'local' };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(output, 'variable-store.ts', generateStore(config), 'frontend-lib');
    this.addFile(output, 'useVariable.ts', generateHook(config), 'frontend-hooks');
    this.addDoc(output, 'docs/logic/variable-store.md', 'Variable Block', generateDocs(config));

    context.logger.info('Generated variable store', { nodeId: node.id, name: config.variableName });
    return output;
  }
}

function generateStore(config: z.infer<typeof VariableStoreConfig>): string {
  return `export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface Variable<T = unknown> {
  name: string;
  type: VariableType;
  value: T;
}

const store = new Map<string, Variable>();

export function setVariable<T>(name: string, value: T, type: VariableType = '${config.variableType}'): void {
  store.set(name, { name, type, value });
}

export function getVariable<T = unknown>(name: string): T | undefined {
  return store.get(name)?.value as T | undefined;
}

export function hasVariable(name: string): boolean {
  return store.has(name);
}

export function deleteVariable(name: string): boolean {
  return store.delete(name);
}

export function getAllVariables(): Variable[] {
  return Array.from(store.values());
}

export function clearVariables(): void {
  store.clear();
}

export function parseDefault(value: string, type: VariableType): unknown {
  if (!value) return type === 'number' ? 0 : type === 'boolean' ? false : type === 'array' ? [] : type === 'object' ? {} : '';
  switch (type) {
    case 'number': return Number(value);
    case 'boolean': return value === 'true';
    case 'object':
    case 'array':
      try { return JSON.parse(value); } catch { return type === 'array' ? [] : {}; }
    default: return value;
  }
}
`;
}

function generateHook(config: z.infer<typeof VariableStoreConfig>): string {
  return `import { useState, useCallback } from 'react';
import {
  setVariable as storeSet,
  getVariable as storeGet,
  parseDefault,
  type VariableType,
} from '../lib/variable-store';

export function useVariable<T = unknown>(
  name = '${config.variableName}',
  type: VariableType = '${config.variableType}',
  defaultValue = '${config.defaultValue}',
) {
  const [value, setValue] = useState<T>(() => {
    const existing = storeGet<T>(name);
    if (existing !== undefined) return existing;
    return parseDefault(defaultValue, type) as T;
  });

  const set = useCallback((newValue: T) => {
    storeSet(name, newValue, type);
    setValue(newValue);
  }, [name, type]);

  return { value, set, name, type };
}
`;
}

function generateDocs(config: z.infer<typeof VariableStoreConfig>): string {
  return `# Variable Block

Declare, read, and update variables shared across workflow blocks.

## Configuration
- **Name**: ${config.variableName}
- **Type**: ${config.variableType}
- **Scope**: ${config.scope}
- **Default**: ${config.defaultValue || '(empty)'}

## Usage

\`\`\`typescript
import { setVariable, getVariable } from '@/lib/variable-store/lib/variable-store';

setVariable('count', 42, 'number');
const count = getVariable<number>('count'); // 42
\`\`\`
`;
}
