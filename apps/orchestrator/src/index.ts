// Cradle Orchestrator API
// Main entry point

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { blueprintRoutes } from './routes/blueprints';
import { runsRoutes } from './routes/runs';
import { healthRoutes } from './routes/health';
import { initializePlugins } from './plugins';
import { createLogger } from './utils/logger';

const logger = createLogger();

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Initialize Cradle plugins
  initializePlugins();

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/' });
  await fastify.register(blueprintRoutes, { prefix: '/blueprints' });
  await fastify.register(runsRoutes, { prefix: '/runs' });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error('Request error', { 
      error: error.message, 
      stack: error.stack,
      path: request.url,
    });

    reply.status(error.statusCode || 500).send({
      error: error.name || 'InternalServerError',
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  });

  // Start server
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    logger.info(`Cradle Orchestrator running on ${host}:${port}`);
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

bootstrap();

