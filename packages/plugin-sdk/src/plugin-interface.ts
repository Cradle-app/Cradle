import type { z } from 'zod';
import type {
  BlueprintNode,
  ExecutionContext,
  CodegenOutput,
  CodegenFile,
  CodegenPatch,
  EnvVarDefinition,
  ScriptDefinition,
  InterfaceDefinition,
  DocSnippet,
} from '@dapp-forge/blueprint-schema';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  category: 'contracts' | 'payments' | 'agents' | 'app' | 'quality' | 'telegram' | 'intelligence' | 'superposition' | 'analytics';
  icon?: string;
  tags?: string[];
}

/**
 * Validation result from a plugin
 */
export interface PluginValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Dependencies between plugins
 */
export interface PluginDependency {
  pluginId: string;
  required: boolean;
  dataMapping?: Record<string, string>;
}

/**
 * Input/Output port definition for visual connections
 */
export interface PluginPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: 'contract' | 'api' | 'types' | 'config' | 'code' | 'any';
  required?: boolean;
}

/**
 * Main plugin interface that all DappForge plugins must implement
 */
export interface NodePlugin<TConfig = Record<string, unknown>> {
  /**
   * Plugin metadata
   */
  readonly metadata: PluginMetadata;

  /**
   * Zod schema for validating the node configuration
   */
  readonly configSchema: z.ZodType<TConfig>;

  /**
   * Define the input/output ports for visual graph connections
   */
  readonly ports: PluginPort[];

  /**
   * Optional dependencies on other plugins
   */
  readonly dependencies?: PluginDependency[];

  /**
   * Optional: Path to a pre-built component package (relative to project root)
   * When set, the orchestrator will copy this component to the output
   */
  readonly componentPath?: string;

  /**
   * Optional: Package name for the component (e.g. '@cradle/ostium-onect')
   */
  readonly componentPackage?: string;

  /**
   * Optional: Define path category mappings for component files
   * Maps source file patterns to path categories for intelligent routing
   * 
   * Example:
   * {
   *   'src/hooks/**': 'frontend-hooks',
   *   'src/types.ts': 'frontend-types',
   *   'src/*.ts': 'frontend-lib',
   * }
   */
  readonly componentPathMappings?: Record<string, import('@dapp-forge/blueprint-schema').PathCategory>;

  /**
   * Validate the node configuration
   * Called before generation to ensure config is valid
   */
  validate(config: TConfig, context: ExecutionContext): Promise<PluginValidationResult>;

  /**
   * Generate code and artifacts for this node
   * This is the main codegen entry point
   */
  generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput>;

  /**
   * Optional: Get default configuration for new nodes
   */
  getDefaultConfig?(): Partial<TConfig>;

  /**
   * Optional: Transform incoming data from connected nodes
   */
  transformInputs?(inputs: Map<string, CodegenOutput>): Record<string, unknown>;
}

/**
 * Base class for plugins with common functionality
 */
export abstract class BasePlugin<TConfig = Record<string, unknown>> implements NodePlugin<TConfig> {
  abstract readonly metadata: PluginMetadata;
  abstract readonly configSchema: z.ZodType<TConfig>;
  abstract readonly ports: PluginPort[];
  readonly dependencies?: PluginDependency[];

  async validate(config: TConfig, _context: ExecutionContext): Promise<PluginValidationResult> {
    const result = this.configSchema.safeParse(config);

    if (!result.success) {
      return {
        valid: false,
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      };
    }

    return { valid: true, errors: [] };
  }

  abstract generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput>;

  getDefaultConfig(): Partial<TConfig> {
    return {};
  }

  /**
   * Helper to create an empty codegen output
   */
  protected createEmptyOutput(): CodegenOutput {
    return {
      files: [],
      patches: [],
      envVars: [],
      scripts: [],
      interfaces: [],
      docs: [],
    };
  }

  /**
   * Helper to add a file to the output
   * @param output - The output object to add the file to
   * @param path - File path (or just filename if using category)
   * @param content - File content
   * @param category - Optional category for intelligent path routing
   */
  protected addFile(
    output: CodegenOutput,
    path: string,
    content: string,
    category?: import('@dapp-forge/blueprint-schema').PathCategory
  ): void {
    output.files.push({ path, content, category });
  }

  /**
   * Helper to add an environment variable
   */
  protected addEnvVar(
    output: CodegenOutput,
    key: string,
    description: string,
    options?: { required?: boolean; defaultValue?: string; secret?: boolean }
  ): void {
    output.envVars.push({
      key,
      description,
      required: options?.required ?? true,
      defaultValue: options?.defaultValue,
      secret: options?.secret,
    });
  }

  /**
   * Helper to add a script
   */
  protected addScript(output: CodegenOutput, name: string, command: string, description?: string): void {
    output.scripts.push({ name, command, description });
  }

  /**
   * Helper to add documentation
   */
  protected addDoc(output: CodegenOutput, path: string, title: string, content: string): void {
    output.docs.push({ path, title, content });
  }
}

// Re-export types for convenience
export type {
  CodegenOutput,
  CodegenFile,
  CodegenPatch,
  EnvVarDefinition,
  ScriptDefinition,
  InterfaceDefinition,
  DocSnippet,
  ExecutionContext,
  BlueprintNode,
};

