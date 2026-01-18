import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';
import { RunStore } from '../store/runs';

const GetRunParamsSchema = z.object({
  id: z.string(),
});

export const runsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  const runStore = new RunStore();

  /**
   * GET /runs/:id
   * Get the status and logs of a run
   */
  fastify.get('/:id', async (request, reply) => {
    const { id } = GetRunParamsSchema.parse(request.params);
    
    const run = runStore.get(id);
    
    if (!run) {
      return reply.status(404).send({
        error: 'NotFound',
        message: `Run ${id} not found`,
      });
    }

    return {
      id: run.id,
      blueprintId: run.blueprintId,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      error: run.error,
      logs: run.logs,
      artifacts: run.artifacts,
    };
  });

  /**
   * GET /runs/:id/logs
   * Get only the logs for a run (for streaming/polling)
   */
  fastify.get('/:id/logs', async (request, reply) => {
    const { id } = GetRunParamsSchema.parse(request.params);
    const since = (request.query as { since?: string }).since;
    
    const run = runStore.get(id);
    
    if (!run) {
      return reply.status(404).send({
        error: 'NotFound',
        message: `Run ${id} not found`,
      });
    }

    let logs = run.logs;
    
    // Filter logs by timestamp if 'since' is provided
    if (since) {
      const sinceTime = new Date(since).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() > sinceTime);
    }

    return {
      runId: id,
      status: run.status,
      logs,
      hasMore: run.status === 'running' || run.status === 'pending',
    };
  });

  /**
   * GET /runs/:id/artifacts
   * Get the generated artifacts for a completed run
   */
  fastify.get('/:id/artifacts', async (request, reply) => {
    const { id } = GetRunParamsSchema.parse(request.params);
    
    const run = runStore.get(id);
    
    if (!run) {
      return reply.status(404).send({
        error: 'NotFound',
        message: `Run ${id} not found`,
      });
    }

    if (run.status !== 'completed') {
      return reply.status(400).send({
        error: 'NotReady',
        message: `Run ${id} is not completed yet. Status: ${run.status}`,
      });
    }

    return {
      runId: id,
      artifacts: run.artifacts,
    };
  });

  /**
   * DELETE /runs/:id
   * Cancel a pending/running run
   */
  fastify.delete('/:id', async (request, reply) => {
    const { id } = GetRunParamsSchema.parse(request.params);
    
    const run = runStore.get(id);
    
    if (!run) {
      return reply.status(404).send({
        error: 'NotFound',
        message: `Run ${id} not found`,
      });
    }

    if (run.status !== 'pending' && run.status !== 'running') {
      return reply.status(400).send({
        error: 'InvalidOperation',
        message: `Cannot cancel run with status: ${run.status}`,
      });
    }

    runStore.cancel(id);

    return {
      id,
      status: 'cancelled',
      message: 'Run cancelled successfully',
    };
  });

  done();
};

