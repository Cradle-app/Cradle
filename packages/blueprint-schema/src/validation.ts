import { Blueprint, ValidationResult } from './schemas/blueprint';
import { BlueprintNode, getConfigSchemaForType, NodeType } from './schemas/nodes';
import { BlueprintEdge, ValidEdgeConnections } from './schemas/edges';
import type { z } from 'zod';

interface ValidationError {
  path: string;
  message: string;
  code: string;
  nodeId?: string;
}

interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  nodeId?: string;
}

/**
 * Validate a blueprint comprehensively
 */
export function validateBlueprint(blueprint: unknown): z.infer<typeof ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Step 1: Validate base schema
  const baseResult = Blueprint.safeParse(blueprint);
  if (!baseResult.success) {
    for (const issue of baseResult.error.issues) {
      errors.push({
        path: issue.path.join('.'),
        message: issue.message,
        code: 'SCHEMA_VALIDATION',
      });
    }
    return { valid: false, errors, warnings };
  }

  const bp = baseResult.data;

  // Step 2: Validate each node's config against its specific schema
  for (const node of bp.nodes) {
    const configSchema = getConfigSchemaForType(node.type as NodeType);
    const configResult = configSchema.safeParse(node.config);
    if (!configResult.success) {
      for (const issue of configResult.error.issues) {
        errors.push({
          path: `nodes.${node.id}.config.${issue.path.join('.')}`,
          message: issue.message,
          code: 'NODE_CONFIG_INVALID',
          nodeId: node.id,
        });
      }
    }
  }

  // Step 3: Validate DAG (no cycles)
  const cycleError = detectCycles(bp.nodes, bp.edges);
  if (cycleError) {
    errors.push({
      path: 'edges',
      message: cycleError,
      code: 'CYCLE_DETECTED',
    });
  }

  // Step 4: Validate edge connections
  const nodeMap = new Map(bp.nodes.map(n => [n.id, n]));
  for (const edge of bp.edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
      errors.push({
        path: `edges.${edge.id}.source`,
        message: `Source node ${edge.source} not found`,
        code: 'INVALID_EDGE_SOURCE',
      });
      continue;
    }

    if (!targetNode) {
      errors.push({
        path: `edges.${edge.id}.target`,
        message: `Target node ${edge.target} not found`,
        code: 'INVALID_EDGE_TARGET',
      });
      continue;
    }

    // Check if this connection type is valid
    const validTargets = ValidEdgeConnections[sourceNode.type] || [];
    if (validTargets.length > 0 && !validTargets.includes(targetNode.type)) {
      warnings.push({
        path: `edges.${edge.id}`,
        message: `Connection from ${sourceNode.type} to ${targetNode.type} may not be meaningful`,
        code: 'UNUSUAL_CONNECTION',
      });
    }
  }

  // Step 5: Check for required dependencies
  const nodeTypes = new Set(bp.nodes.map(n => n.type));
  
  // If there's a frontend, recommend having contracts or agents
  if (nodeTypes.has('frontend-scaffold') && 
      !nodeTypes.has('stylus-contract') && 
      !nodeTypes.has('erc8004-agent-runtime')) {
    warnings.push({
      path: 'nodes',
      message: 'Frontend scaffold without contracts or agents - consider adding Web3 functionality',
      code: 'MISSING_WEB3_NODES',
    });
  }

  // Step 6: Validate no duplicate node IDs
  const nodeIds = bp.nodes.map(n => n.id);
  const duplicateIds = nodeIds.filter((id, idx) => nodeIds.indexOf(id) !== idx);
  if (duplicateIds.length > 0) {
    errors.push({
      path: 'nodes',
      message: `Duplicate node IDs: ${duplicateIds.join(', ')}`,
      code: 'DUPLICATE_NODE_ID',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect cycles in the blueprint graph using DFS
 */
function detectCycles(nodes: BlueprintNode[], edges: BlueprintEdge[]): string | null {
  const adjacency = new Map<string, string[]>();
  
  // Build adjacency list
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
    }
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycleResult = dfs(neighbor);
        if (cycleResult) return cycleResult;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStart).concat(neighbor);
        return `Cycle detected: ${cyclePath.join(' → ')}`;
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const cycleResult = dfs(node.id);
      if (cycleResult) return cycleResult;
    }
  }

  return null;
}

/**
 * Perform topological sort on blueprint nodes
 * Returns nodes in execution order, or null if there's a cycle
 */
export function topologicalSort(nodes: BlueprintNode[], edges: BlueprintEdge[]): BlueprintNode[] | null {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Build graph
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Find all nodes with no incoming edges
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const result: BlueprintNode[] = [];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If we haven't processed all nodes, there's a cycle
  if (result.length !== nodes.length) {
    return null;
  }

  return result;
}

