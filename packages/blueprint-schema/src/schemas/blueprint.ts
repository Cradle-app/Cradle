import { z } from 'zod';
import { BlueprintNode } from './nodes';
import { BlueprintEdge } from './edges';
import { BlueprintConfig } from './config';

/**
 * Blueprint status in the system
 */
export const BlueprintStatus = z.enum([
  'draft',
  'validated',
  'generating',
  'completed',
  'failed',
]);
export type BlueprintStatus = z.infer<typeof BlueprintStatus>;

/**
 * Complete Blueprint definition
 * This is the main schema for the workflow/graph
 */
export const Blueprint = z.object({
  id: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  
  // Core graph data
  nodes: z.array(BlueprintNode).min(1),
  edges: z.array(BlueprintEdge).default([]),
  
  // Configuration
  config: BlueprintConfig,
  
  // Metadata
  status: BlueprintStatus.default('draft'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Canvas viewport state (for UI restoration)
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().min(0.1).max(2),
  }).optional(),
});
export type Blueprint = z.infer<typeof Blueprint>;

/**
 * Blueprint creation input (without auto-generated fields)
 */
export const BlueprintCreateInput = Blueprint.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  nodes: z.array(BlueprintNode.omit({ id: true }).extend({
    id: z.string().uuid().optional(),
  })),
  edges: z.array(BlueprintEdge.omit({ id: true }).extend({
    id: z.string().uuid().optional(),
  })).default([]),
});
export type BlueprintCreateInput = z.infer<typeof BlueprintCreateInput>;

/**
 * Blueprint update input
 */
export const BlueprintUpdateInput = Blueprint.partial().omit({
  id: true,
  createdAt: true,
});
export type BlueprintUpdateInput = z.infer<typeof BlueprintUpdateInput>;

/**
 * Validation result for a blueprint
 */
export const ValidationResult = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string(),
    code: z.string(),
    nodeId: z.string().uuid().optional(),
  })),
  warnings: z.array(z.object({
    path: z.string(),
    message: z.string(),
    code: z.string(),
    nodeId: z.string().uuid().optional(),
  })),
});
export type ValidationResult = z.infer<typeof ValidationResult>;

