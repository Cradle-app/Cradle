import { nanoid } from 'nanoid';
import type { ExecutionRun, ExecutionLog, ExecutionArtifact, RunStatus } from '@dapp-forge/blueprint-schema';

/**
 * In-memory store for execution runs
 * In production, this would be backed by a database
 */
export class RunStore {
  private static instance: RunStore;
  private runs: Map<string, ExecutionRun> = new Map();

  constructor() {
    // Singleton pattern
    if (RunStore.instance) {
      return RunStore.instance;
    }
    RunStore.instance = this;
  }

  /**
   * Create a new run
   */
  create(blueprintId: string): ExecutionRun {
    const run: ExecutionRun = {
      id: nanoid(),
      blueprintId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      logs: [],
      artifacts: [],
    };

    this.runs.set(run.id, run);
    return run;
  }

  /**
   * Get a run by ID
   */
  get(id: string): ExecutionRun | undefined {
    return this.runs.get(id);
  }

  /**
   * Update run status
   */
  updateStatus(id: string, status: RunStatus): void {
    const run = this.runs.get(id);
    if (run) {
      run.status = status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        run.completedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Add a log entry
   */
  addLog(id: string, log: Omit<ExecutionLog, 'timestamp'>): void {
    const run = this.runs.get(id);
    if (run) {
      run.logs.push({
        ...log,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Add an artifact
   */
  addArtifact(id: string, artifact: ExecutionArtifact): void {
    const run = this.runs.get(id);
    if (run) {
      run.artifacts.push(artifact);
    }
  }

  /**
   * Mark run as running
   */
  start(id: string): void {
    this.updateStatus(id, 'running');
    this.addLog(id, {
      level: 'info',
      message: 'Execution started',
    });
  }

  /**
   * Mark run as completed
   */
  complete(id: string): void {
    this.updateStatus(id, 'completed');
    this.addLog(id, {
      level: 'info',
      message: 'Execution completed successfully',
    });
  }

  /**
   * Mark run as failed
   */
  fail(id: string, error: string): void {
    const run = this.runs.get(id);
    if (run) {
      run.status = 'failed';
      run.error = error;
      run.completedAt = new Date().toISOString();
      run.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Execution failed: ${error}`,
      });
    }
  }

  /**
   * Cancel a run
   */
  cancel(id: string): void {
    this.updateStatus(id, 'cancelled');
    this.addLog(id, {
      level: 'info',
      message: 'Execution cancelled',
    });
  }

  /**
   * Delete old runs (cleanup)
   */
  cleanup(olderThan: Date): number {
    let deleted = 0;
    const threshold = olderThan.getTime();

    for (const [id, run] of this.runs) {
      const completedAt = run.completedAt ? new Date(run.completedAt).getTime() : null;
      if (completedAt && completedAt < threshold) {
        this.runs.delete(id);
        deleted++;
      }
    }

    return deleted;
  }
}

