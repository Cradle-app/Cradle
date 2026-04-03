import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';
import { Blueprint, validateBlueprint } from '@dapp-forge/blueprint-schema';
import { ExecutionEngine } from '../engine/execution';
import { SkillsRepoGenerator } from '../engine/skills-generator';
import { RunStore } from '../store/runs';

// Request/Response schemas
const ValidateRequestSchema = z.object({
  blueprint: z.unknown(),
});

const GenerateOptionsSchema = z.object({
  dryRun: z.boolean().default(false),
  createGitHubRepo: z.boolean().default(false),
  generateMode: z.enum(['codebase', 'skills', 'both']).default('codebase'),
});

const GenerateRequestSchema = z.object({
  blueprint: z.unknown(),
  options: GenerateOptionsSchema.optional(),
});

export const blueprintRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  const engine = new ExecutionEngine();
  const skillsGenerator = new SkillsRepoGenerator();
  const runStore = new RunStore();

  /**
   * POST /blueprints/validate
   * Validate a blueprint without executing it
   */
  fastify.post('/validate', async (request, reply) => {
    const body = ValidateRequestSchema.parse(request.body);
    
    const result = validateBlueprint(body.blueprint);
    
    return reply.status(result.valid ? 200 : 400).send({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    });
  });

  /**
   * POST /blueprints/generate
   * Generate code from a blueprint
   */
  fastify.post('/generate', async (request, reply) => {
    const body = GenerateRequestSchema.parse(request.body);
    
    // Validate first
    const validation = validateBlueprint(body.blueprint);
    if (!validation.valid) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Blueprint validation failed',
        errors: validation.errors,
      });
    }

    // Parse the validated blueprint
    const blueprint = Blueprint.parse(body.blueprint);
    const options = GenerateOptionsSchema.parse(body.options ?? {});

    // Create a run
    const run = runStore.create(blueprint.id);

    // Execute asynchronously
    engine.execute(blueprint, run.id, {
      dryRun: options.dryRun,
      createGitHubRepo: options.createGitHubRepo,
    }).catch(error => {
      runStore.fail(run.id, error.message);
    });

    // Return immediately with run ID
    return reply.status(202).send({
      runId: run.id,
      status: 'pending',
      message: 'Generation started. Poll /runs/:id for status.',
    });
  });

  /**
   * POST /blueprints/generate/sync
   * Generate code synchronously (for smaller blueprints)
   */
  fastify.post('/generate/sync', async (request, reply) => {
    const body = GenerateRequestSchema.parse(request.body);
    
    // Validate first
    const validation = validateBlueprint(body.blueprint);
    if (!validation.valid) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Blueprint validation failed',
        errors: validation.errors,
      });
    }

    // Parse the validated blueprint
    const blueprint = Blueprint.parse(body.blueprint);
    const options = GenerateOptionsSchema.parse(body.options ?? {});

    // Get GitHub token from request header (passed from user's OAuth session)
    const githubToken = request.headers['x-github-token'] as string | undefined;

    // Create a run
    const run = runStore.create(blueprint.id);

    const execOptions = {
      dryRun: options.dryRun,
      createGitHubRepo: options.createGitHubRepo,
      githubToken, // Pass user's token to engine
    };

    try {
      let result;

      if (options.generateMode === 'skills') {
        // Skills repo only
        result = await skillsGenerator.generate(blueprint, run.id, execOptions);
      } else if (options.generateMode === 'both') {
        // 1. Generate skills files first (no GitHub push) to get the .nskils vol
        const skillsResult = await skillsGenerator.generate(blueprint, `${run.id}-skills`, {
          ...execOptions,
          createGitHubRepo: false,
        });

        // 2. Run codegen, injecting the skills vol so .nskils files are included in the GitHub push
        const codeResult = await engine.execute(blueprint, run.id, {
          ...execOptions,
          injectVol: skillsResult.vol,
        });

        // Merge file manifests for the response
        result = {
          ...codeResult,
          files: [...codeResult.files, ...skillsResult.files],
        };
      } else {
        // Default: codebase only (existing behavior, unchanged)
        result = await engine.execute(blueprint, run.id, execOptions);
      }

      const completedRun = runStore.get(run.id);

      return reply.status(200).send({
        runId: run.id,
        status: completedRun?.status || 'completed',
        result,
        logs: completedRun?.logs || [],
      });
    } catch (error) {
      runStore.fail(run.id, (error as Error).message);
      
      return reply.status(500).send({
        runId: run.id,
        status: 'failed',
        error: (error as Error).message,
        logs: runStore.get(run.id)?.logs || [],
      });
    }
  });

  done();
};

