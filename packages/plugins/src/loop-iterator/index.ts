import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { LoopIteratorConfig } from '@dapp-forge/blueprint-schema';

export class LoopIteratorPlugin extends BasePlugin<z.infer<typeof LoopIteratorConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'loop-iterator',
    name: 'Loop',
    version: '0.1.0',
    description: 'Iterate over arrays or repeat actions N times',
    category: 'app',
    tags: ['loop', 'iterate', 'repeat', 'for-each', 'batch', 'web2'],
  };

  readonly configSchema = LoopIteratorConfig as unknown as z.ZodType<z.infer<typeof LoopIteratorConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'loop-in', name: 'Input', type: 'input', dataType: 'config' },
    { id: 'loop-body', name: 'Loop Body', type: 'output', dataType: 'config' },
    { id: 'loop-done', name: 'Complete', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof LoopIteratorConfig>> {
    return { loopType: 'for-each', iterableExpression: '', count: 10, maxIterations: 1000 };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(output, 'iterator.ts', generateIterator(config), 'frontend-lib');
    this.addFile(output, 'useLoop.ts', generateHook(config), 'frontend-hooks');
    this.addDoc(output, 'docs/logic/loop-iterator.md', 'Loop Block', generateDocs(config));

    context.logger.info('Generated loop/iterator utilities', { nodeId: node.id, type: config.loopType });
    return output;
  }
}

function generateIterator(config: z.infer<typeof LoopIteratorConfig>): string {
  return `export type LoopType = 'for-each' | 'count' | 'while';

export interface LoopResult<T> {
  results: T[];
  iterations: number;
  completed: boolean;
}

export async function forEachAsync<T, R>(
  items: T[],
  fn: (item: T, index: number) => R | Promise<R>,
  maxIterations = ${config.maxIterations},
): Promise<LoopResult<R>> {
  const results: R[] = [];
  const limit = Math.min(items.length, maxIterations);

  for (let i = 0; i < limit; i++) {
    results.push(await fn(items[i], i));
  }

  return { results, iterations: limit, completed: limit >= items.length };
}

export async function countLoop<R>(
  count: number,
  fn: (index: number) => R | Promise<R>,
  maxIterations = ${config.maxIterations},
): Promise<LoopResult<R>> {
  const results: R[] = [];
  const limit = Math.min(count, maxIterations);

  for (let i = 0; i < limit; i++) {
    results.push(await fn(i));
  }

  return { results, iterations: limit, completed: limit >= count };
}

export async function whileLoop<R>(
  condition: () => boolean | Promise<boolean>,
  fn: (index: number) => R | Promise<R>,
  maxIterations = ${config.maxIterations},
): Promise<LoopResult<R>> {
  const results: R[] = [];
  let i = 0;

  while (i < maxIterations && (await condition())) {
    results.push(await fn(i));
    i++;
  }

  return { results, iterations: i, completed: !(await condition()) };
}

export async function batchProcess<T, R>(
  items: T[],
  fn: (batch: T[]) => R | Promise<R>,
  batchSize = 10,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    results.push(await fn(items.slice(i, i + batchSize)));
  }
  return results;
}
`;
}

function generateHook(config: z.infer<typeof LoopIteratorConfig>): string {
  return `import { useState, useCallback } from 'react';
import { forEachAsync, countLoop, type LoopResult } from '../lib/iterator';

export function useLoop<T = unknown>() {
  const [results, setResults] = useState<T[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const forEach = useCallback(async <I>(
    items: I[],
    fn: (item: I, index: number) => T | Promise<T>,
  ): Promise<LoopResult<T>> => {
    setRunning(true);
    setProgress({ current: 0, total: items.length });
    setResults([]);

    const result = await forEachAsync(items, async (item, idx) => {
      const r = await fn(item, idx);
      setProgress((p) => ({ ...p, current: idx + 1 }));
      setResults((prev) => [...prev, r]);
      return r;
    }, ${config.maxIterations});

    setRunning(false);
    return result;
  }, []);

  const repeat = useCallback(async (
    count: number,
    fn: (index: number) => T | Promise<T>,
  ): Promise<LoopResult<T>> => {
    setRunning(true);
    setProgress({ current: 0, total: count });
    setResults([]);

    const result = await countLoop(count, async (idx) => {
      const r = await fn(idx);
      setProgress((p) => ({ ...p, current: idx + 1 }));
      setResults((prev) => [...prev, r]);
      return r;
    }, ${config.maxIterations});

    setRunning(false);
    return result;
  }, []);

  return { results, running, progress, forEach, repeat };
}
`;
}

function generateDocs(config: z.infer<typeof LoopIteratorConfig>): string {
  return `# Loop / Iterator Block

Iterates over collections or repeats actions.

## Configuration
- **Loop Type**: ${config.loopType}
- **Count**: ${config.count}
- **Max Iterations**: ${config.maxIterations}

## Usage

\`\`\`typescript
import { forEachAsync, countLoop } from '@/lib/loop-iterator/lib/iterator';

// Iterate over items
const result = await forEachAsync(items, async (item, i) => {
  return processItem(item);
});

// Repeat N times
const result = await countLoop(5, async (i) => {
  return doWork(i);
});
\`\`\`
`;
}
