import pino from 'pino';
import type { ExecutionLogger } from '@dapp-forge/blueprint-schema';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

export function createLogger(): pino.Logger {
  return pinoLogger;
}

/**
 * Create an execution logger for plugin execution
 */
export function createExecutionLogger(runId: string, nodeId?: string): ExecutionLogger {
  const child = pinoLogger.child({ runId, nodeId });

  return {
    info(message: string, meta?: Record<string, unknown>) {
      child.info(meta, message);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      child.warn(meta, message);
    },
    error(message: string, meta?: Record<string, unknown>) {
      child.error(meta, message);
    },
    debug(message: string, meta?: Record<string, unknown>) {
      child.debug(meta, message);
    },
  };
}

