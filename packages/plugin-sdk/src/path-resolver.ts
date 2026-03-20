/**
 * Universal Path Resolver for Cradle Code Generation
 *
 * Routes plugin outputs to proper category folders (frontend, backend, contracts)
 * based on the context of which plugins are present in the workflow.
 */

import type { BlueprintNode } from "@dapp-forge/blueprint-schema";

/**
 * Path categories for organizing generated files
 */
export type PathCategory =
  // Frontend categories
  | "frontend-app" // app/, pages/ - main application pages (Next.js App Router)
  | "frontend-components" // components/ - React components
  | "frontend-hooks" // hooks/ - React hooks
  | "frontend-lib" // lib/, config/ - utilities, configuration
  | "frontend-types" // types/ - TypeScript type definitions
  | "frontend-styles" // styles/ - CSS, Tailwind, etc.
  | "frontend-public" // public/ - static assets

  // Backend categories
  | "backend-routes" // routes/, api/ - API route handlers
  | "backend-services" // services/ - business logic services
  | "backend-middleware" // middleware/ - Express/Fastify middleware
  | "backend-lib" // lib/, utils/ - backend utilities
  | "backend-types" // types/ - backend type definitions

  // Contract categories
  | "contract" // contracts/<name>/ - smart contract code
  | "contract-test" // contracts/<name>/tests/ - contract tests
  | "contract-source" // contracts/<name>/ - Stylus/Rust source files
  | "contract-scripts" // scripts/ - deployment and utility scripts

  // Shared/Root categories
  | "docs" // docs/ - documentation
  | "root" // root level - package.json, turbo.json, etc.
  | "shared-types"; // shared/ - types shared across frontend/backend

/**
 * Context built from analyzing blueprint nodes
 * Determines the base paths for each category
 */
export interface PathContext {
  /** Whether a frontend scaffold plugin is present */
  hasFrontend: boolean;

  /** Whether a backend scaffold plugin is present */
  hasBackend: boolean;

  /** Whether any contract plugins are present */
  hasContracts: boolean;

  /** Set of all node types in the blueprint (for plugin detection) */
  nodeTypes: Set<string>;

  /** Base path for frontend files (default: 'apps/web') */
  frontendPath: string;

  /** Source directory within frontend (default: 'src') */
  frontendSrcPath: string;

  /** Base path for backend files (default: 'apps/api') */
  backendPath: string;

  /** Source directory within backend (default: 'src') */
  backendSrcPath: string;

  /** Base path for contracts (default: 'contracts') */
  contractsPath: string;
}

/**
 * Compute the lib path for a plugin's component folder.
 *
 * With frontend scaffold: apps/web/src/lib/<plugin-id>
 * Without frontend scaffold: src/lib/<plugin-id>
 */
export function getPluginLibRoot(
  context: PathContext,
  pluginId: string,
): string {
  const srcPath = context.frontendSrcPath
    ? `/${context.frontendSrcPath}`
    : "";
  const safeId = pluginId.replace("@", "").replace(/\//g, "-");

  if (context.hasFrontend) {
    return `${context.frontendPath}${srcPath}/lib/${safeId}`;
  }

  return `src/lib/${safeId}`;
}

/**
 * Options for path resolution
 */
export interface ResolverOptions {
  /**
   * Optional scope (namespace) for the file.
   * Usually the plugin ID or feature name.
   * Used to group files and prevent collisions.
   */
  scope?: string;
}

/**
 * Plugin types that indicate a primary scaffold
 */
export const FRONTEND_SCAFFOLD_TYPES = ["frontend-scaffold"];
export const BACKEND_SCAFFOLD_TYPES: string[] = [];
export const CONTRACT_TYPES = [
  "stylus-contract",
  "stylus-zk-contract",
  "erc20-stylus",
  "erc721-stylus",
  "erc1155-stylus",
  "eip7702-smart-eoa",
  "erc8004-agent-runtime",
];

/**
 * Build path context from blueprint nodes
 */
export function buildPathContext(nodes: BlueprintNode[]): PathContext {
  const nodeTypesArray = nodes.map((n) => n.type);
  const nodeTypes = new Set(nodeTypesArray);

  // Detect scaffolds
  const hasFrontend = nodeTypesArray.some((t) =>
    FRONTEND_SCAFFOLD_TYPES.includes(t),
  );
  const hasBackend = nodeTypesArray.some((t) =>
    BACKEND_SCAFFOLD_TYPES.includes(t),
  );
  const hasContracts = nodeTypesArray.some((t) => CONTRACT_TYPES.includes(t));

  // Get frontend config to determine structure
  const frontendNode = nodes.find((n) => n.type === "frontend-scaffold");
  const frontendConfig = frontendNode?.config as
    | Record<string, unknown>
    | undefined;

  // Determine paths based on configuration
  const useSrcDirectory = frontendConfig?.srcDirectory !== false;

  return {
    hasFrontend,
    hasBackend,
    hasContracts,
    nodeTypes,
    frontendPath: "apps/web",
    frontendSrcPath: useSrcDirectory ? "src" : "",
    backendPath: "apps/api",
    backendSrcPath: "src",
    contractsPath: "contracts",
  };
}

/**
 * Configuration for category routing
 */
export const CATEGORY_CONFIG: Record<
  PathCategory,
  {
    domain: "frontend" | "backend" | "contract" | "shared";
    subdir: string;
    scopable: boolean; // Whether this category supports automatic scoping
  }
> = {
  // Frontend
  "frontend-app": { domain: "frontend", subdir: "app", scopable: false }, // Don't scope routes automatically
  "frontend-components": {
    domain: "frontend",
    subdir: "components",
    scopable: true,
  },
  "frontend-hooks": { domain: "frontend", subdir: "hooks", scopable: true },
  "frontend-lib": { domain: "frontend", subdir: "lib", scopable: true },
  "frontend-types": { domain: "frontend", subdir: "types", scopable: true },
  "frontend-styles": { domain: "frontend", subdir: "styles", scopable: false },
  "frontend-public": { domain: "frontend", subdir: "public", scopable: false },

  // Backend
  "backend-routes": { domain: "backend", subdir: "routes", scopable: false },
  "backend-services": { domain: "backend", subdir: "services", scopable: true },
  "backend-middleware": {
    domain: "backend",
    subdir: "middleware",
    scopable: true,
  },
  "backend-lib": { domain: "backend", subdir: "lib", scopable: true },
  "backend-types": { domain: "backend", subdir: "types", scopable: true },

  // Contracts
  contract: { domain: "contract", subdir: "", scopable: false },
  "contract-test": { domain: "contract", subdir: "tests", scopable: false },
  "contract-source": { domain: "contract", subdir: "", scopable: false },
  "contract-scripts": { domain: "shared", subdir: "scripts", scopable: false },

  // Shared
  docs: { domain: "shared", subdir: "docs", scopable: true },
  root: { domain: "shared", subdir: "", scopable: false },
  "shared-types": { domain: "shared", subdir: "shared/types", scopable: false },
};

/**
 * Resolve the output path for a file based on its category and context
 *
 * Universal resolver that handles:
 * 1. Base path selection (frontend vs backend vs contracts)
 * 2. Source directory handling (src/)
 * 3. Fallback routing (e.g. backend code to frontend lib when no backend exists)
 * 4. Automatic scoping (namespacing) for plugins
 */
export function resolveOutputPath(
  originalPath: string,
  category: PathCategory | undefined,
  context: PathContext,
  options: ResolverOptions = {},
): string {
  // If no category specified, return original path (backward compatibility)
  if (!category) {
    return originalPath;
  }

  const config = CATEGORY_CONFIG[category];
  if (!config) {
    // Fallback for unknown categories
    return originalPath;
  }

  let basePath = "";
  const srcPath = context.frontendSrcPath ? `/${context.frontendSrcPath}` : "";

  // 1. Determine Base Path Strategy
  if (config.domain === "frontend") {
    if (context.hasFrontend) {
      if (category === "frontend-public") {
        basePath = `${context.frontendPath}/public`;
      } else if (category === "frontend-app") {
        basePath = `${context.frontendPath}${srcPath}/app`;
      } else {
        basePath = `${context.frontendPath}${srcPath}/${config.subdir}`;
      }
    } else {
      // Fallback: Frontend code in a standalone library structure
      basePath = `src/${config.subdir}`;
    }
  } else if (config.domain === "backend") {
    if (context.hasBackend) {
      basePath = `${context.backendPath}/${context.backendSrcPath}/${config.subdir}`;
    } else if (context.hasFrontend) {
      // Fallback: Backend code maps to Next.js API or lib
      if (category === "backend-routes") {
        basePath = `${context.frontendPath}${srcPath}/app/api`;
      } else {
        basePath = `${context.frontendPath}${srcPath}/lib`;
      }
    } else {
      basePath = `src/lib`;
    }
  } else if (config.domain === "contract") {
    basePath = context.contractsPath;
  } else {
    // Shared domain
    basePath = config.subdir;
  }

  // 2. Apply Scoping (if enabled and provided)
  // This allows plugins to have their own subdirectories to prevent collisions.
  if (options.scope && config.scopable) {
    // Clean scope name (remove @, slashes, etc if needed)
    const safeScope = options.scope.replace("@", "").replace(/\//g, "-");

    // VERTICAL SCOPING STRATEGY
    // For frontend/backend code, group by plugin under lib/: `src/lib/my-plugin/hooks/useMe.ts`
    // This keeps each plugin as a self-contained folder inside lib/.
    if (
      config.domain === "frontend" ||
      (config.domain === "backend" && context.hasBackend)
    ) {
      let rootPath = "";

      if (config.domain === "frontend") {
        rootPath = `${context.frontendPath}${srcPath}`;
        if (category === "frontend-public") {
          basePath = `${basePath}/${safeScope}`;
        } else {
          basePath = `${rootPath}/lib/${safeScope}/${config.subdir}`;
        }
      } else {
        rootPath = `${context.backendPath}/${context.backendSrcPath}`;
        basePath = `${rootPath}/lib/${safeScope}/${config.subdir}`;
      }
    } else {
      // Horizontal Scoping (Suffix) for others (docs, contracts, or backend-in-frontend mapping)
      // e.g. docs/my-plugin
      basePath = basePath ? `${basePath}/${safeScope}` : safeScope;
    }
  }

  // 3. Normalize and Append Filename
  // Remove leading slashes and fix separators
  const normalizedPath = originalPath.replace(/\\/g, "/").replace(/^\/+/, "");

  // Check if original path is already deep (contains slash)
  // If it is, and we're scoping, we might be double-nesting if we're not careful.
  // But usually originalPath from plugins is just "api.ts" or "hooks/useMe.ts".

  // For contract sources, we preserve the hierarchy relative to contracts/
  if (category === "contract-source") {
    // Special handling handled by caller usually, but let's be safe
    return basePath ? `${basePath}/${normalizedPath}` : normalizedPath;
  }

  return basePath ? `${basePath}/${normalizedPath}` : normalizedPath;
}

/**
 * Rewrite all file paths in a CodegenOutput based on context
 *
 * This is the main entry point used by the execution engine
 */
export function rewriteOutputPaths<
  T extends { path: string; category?: PathCategory },
>(files: T[], context: PathContext, options: ResolverOptions = {}): T[] {
  return files.map((file) => ({
    ...file,
    path: resolveOutputPath(file.path, file.category, context, options),
  }));
}

/**
 * Helper to create a categorized file path
 */
export function categorizedPath(
  filename: string,
  category: PathCategory,
): { path: string; category: PathCategory } {
  return { path: filename, category };
}
