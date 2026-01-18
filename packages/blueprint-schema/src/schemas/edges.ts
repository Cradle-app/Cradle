import { z } from 'zod';

/**
 * Edge types define the relationship between nodes
 */
export const EdgeType = z.enum([
  'dependency',     // Target depends on source (execution order)
  'data-flow',      // Data flows from source to target
  'contract-link',  // Contract reference/import
]);
export type EdgeType = z.infer<typeof EdgeType>;

/**
 * Handle positions for connections
 */
export const HandlePosition = z.enum(['top', 'right', 'bottom', 'left']);
export type HandlePosition = z.infer<typeof HandlePosition>;

/**
 * Blueprint edge definition
 */
export const BlueprintEdge = z.object({
  id: z.string().uuid(),
  source: z.string().uuid(),        // Source node ID
  target: z.string().uuid(),        // Target node ID
  sourceHandle: z.string().optional(), // Specific output handle
  targetHandle: z.string().optional(), // Specific input handle
  type: EdgeType.default('dependency'),
  metadata: z.object({
    label: z.string().max(50).optional(),
    animated: z.boolean().default(false),
  }).optional(),
});
export type BlueprintEdge = z.infer<typeof BlueprintEdge>;

/**
 * Validate that an edge connects valid node types
 */
export const ValidEdgeConnections: Record<string, string[]> = {
  'stylus-contract': ['x402-paywall-api', 'erc8004-agent-runtime', 'sdk-generator', 'frontend-scaffold'],
  'x402-paywall-api': ['erc8004-agent-runtime', 'frontend-scaffold'],
  'erc8004-agent-runtime': ['frontend-scaffold', 'sdk-generator'],
  'repo-quality-gates': [], // Quality gates connect to nothing, they're global
  'frontend-scaffold': [],
  'sdk-generator': ['frontend-scaffold'],
};

