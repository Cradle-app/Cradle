import type { FastifyPluginCallback } from 'fastify';
import { getDefaultRegistry } from '../plugins';

export const healthRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  });

  fastify.get('/info', async () => {
    const registry = getDefaultRegistry();
    
    return {
      name: 'Cradle Orchestrator',
      version: '0.1.0',
      plugins: registry.getAllMetadata(),
    };
  });

  done();
};

