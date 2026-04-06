import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { DelayTimerConfig } from '@dapp-forge/blueprint-schema';

export class DelayTimerPlugin extends BasePlugin<z.infer<typeof DelayTimerConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'delay-timer',
    name: 'Delay / Timer',
    version: '0.1.0',
    description: 'Pause execution or schedule delayed actions',
    category: 'app',
    tags: ['delay', 'timer', 'wait', 'schedule', 'pause', 'web2'],
  };

  readonly configSchema = DelayTimerConfig as unknown as z.ZodType<z.infer<typeof DelayTimerConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'timer-in', name: 'Input', type: 'input', dataType: 'config' },
    { id: 'timer-out', name: 'After Delay', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof DelayTimerConfig>> {
    return { delayType: 'fixed', delayMs: 1000, unit: 'seconds' };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(output, 'delay.ts', generateDelayUtil(config), 'frontend-lib');
    this.addFile(output, 'useDelay.ts', generateDelayHook(config), 'frontend-hooks');
    this.addDoc(output, 'docs/logic/delay-timer.md', 'Delay/Timer Block', generateDocs(config));

    context.logger.info('Generated delay/timer utilities', { nodeId: node.id });
    return output;
  }
}

function toMs(value: number, unit: string): number {
  switch (unit) {
    case 'seconds': return value * 1000;
    case 'minutes': return value * 60000;
    case 'hours': return value * 3600000;
    default: return value;
  }
}

function generateDelayUtil(config: z.infer<typeof DelayTimerConfig>): string {
  return `export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toMs(value: number, unit: 'ms' | 'seconds' | 'minutes' | 'hours'): number {
  switch (unit) {
    case 'seconds': return value * 1000;
    case 'minutes': return value * 60000;
    case 'hours': return value * 3600000;
    default: return value;
  }
}

export const DEFAULT_DELAY_MS = ${toMs(config.delayMs, config.unit)};
`;
}

function generateDelayHook(config: z.infer<typeof DelayTimerConfig>): string {
  const delayMs = toMs(config.delayMs, config.unit);
  return `import { useState, useCallback, useRef, useEffect } from 'react';
import { delay as delayFn } from '../lib/delay';

export function useDelay(defaultMs = ${delayMs}) {
  const [waiting, setWaiting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const execute = useCallback(async <T>(fn: () => T | Promise<T>, ms?: number): Promise<T> => {
    const waitMs = ms ?? defaultMs;
    setWaiting(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => Math.min(prev + 100, waitMs));
    }, 100);

    await delayFn(waitMs);

    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(waitMs);
    setWaiting(false);

    return fn();
  }, [defaultMs]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return { waiting, elapsed, execute };
}
`;
}

function generateDocs(config: z.infer<typeof DelayTimerConfig>): string {
  return `# Delay / Timer Block

Pauses execution for a configurable duration.

## Configuration
- **Type**: ${config.delayType}
- **Delay**: ${config.delayMs} ${config.unit}

## Usage

\`\`\`typescript
import { delay } from '@/lib/delay-timer/lib/delay';

await delay(2000); // wait 2 seconds
\`\`\`
`;
}
