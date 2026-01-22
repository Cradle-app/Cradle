import type { z } from 'zod';
import type {
  Blueprint,
  BlueprintCreateInput,
  BlueprintUpdateInput,
  ValidationResult,
} from './schemas/blueprint';
import type {
  BlueprintNode,
  NodeType,
  NodeCategory,
  NodeConfig,
  StylusContractConfig,
  X402PaywallConfig,
  ERC8004AgentConfig,
  RepoQualityGatesConfig,
  MaxxitLazyTradingConfig,
} from './schemas/nodes';
import type { BlueprintEdge, EdgeType } from './schemas/edges';
import type { BlueprintConfig, NetworkConfig, GitHubConfig } from './schemas/config';

/**
 * Re-export all types for convenience
 */
export type {
  Blueprint,
  BlueprintCreateInput,
  BlueprintUpdateInput,
  ValidationResult,
  BlueprintNode,
  NodeType,
  NodeCategory,
  NodeConfig,
  StylusContractConfig,
  X402PaywallConfig,
  ERC8004AgentConfig,
  RepoQualityGatesConfig,
  MaxxitLazyTradingConfig,
  BlueprintEdge,
  EdgeType,
  BlueprintConfig,
  NetworkConfig,
  GitHubConfig,
};

/**
 * Codegen output from a plugin
 */
export interface CodegenFile {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

/**
 * Patch instruction for existing files
 */
export interface CodegenPatch {
  path: string;
  operations: PatchOperation[];
}

export type PatchOperation =
  | { type: 'insert'; position: 'start' | 'end' | { after: string } | { before: string }; content: string }
  | { type: 'replace'; search: string; replace: string; all?: boolean }
  | { type: 'delete'; search: string };

/**
 * Environment variable definition
 */
export interface EnvVarDefinition {
  key: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  secret?: boolean;
}

/**
 * Script definition for package.json
 */
export interface ScriptDefinition {
  name: string;
  command: string;
  description?: string;
}

/**
 * Generated interface definitions
 */
export interface InterfaceDefinition {
  name: string;
  type: 'abi' | 'typescript' | 'openapi';
  content: string;
}

/**
 * Documentation snippet
 */
export interface DocSnippet {
  path: string;
  title: string;
  content: string;
}

/**
 * Complete output from code generation
 */
export interface CodegenOutput {
  files: CodegenFile[];
  patches: CodegenPatch[];
  envVars: EnvVarDefinition[];
  scripts: ScriptDefinition[];
  interfaces: InterfaceDefinition[];
  docs: DocSnippet[];
}

/**
 * Execution context passed to plugins
 */
export interface ExecutionContext {
  blueprintId: string;
  runId: string;
  config: BlueprintConfig;
  nodeOutputs: Map<string, CodegenOutput>;
  logger: ExecutionLogger;
}

/**
 * Logger interface for plugins
 */
export interface ExecutionLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Run status
 */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Execution run record
 */
export interface ExecutionRun {
  id: string;
  blueprintId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  logs: ExecutionLog[];
  artifacts: ExecutionArtifact[];
  error?: string;
}

/**
 * Log entry
 */
export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  meta?: Record<string, unknown>;
}

/**
 * Generated artifact
 */
export interface ExecutionArtifact {
  name: string;
  type: 'repo' | 'file' | 'report';
  url?: string;
  content?: string;
}

