import { Volume, createFsFromVolume } from "memfs";
import * as realFs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type {
  Blueprint,
  BlueprintNode,
  CodegenOutput,
  ExecutionContext,
} from "@dapp-forge/blueprint-schema";
import { topologicalSort } from "@dapp-forge/blueprint-schema";
import {
  getDefaultRegistry,
  buildPathContext,
  rewriteOutputPaths,
  resolveOutputPath,
  shouldMergeFile,
  mergeFileContents,
  getPluginLibRoot,
  FRONTEND_SCAFFOLD_TYPES,
  BACKEND_SCAFFOLD_TYPES,
  type NodePlugin,
  type PathContext,
} from "@dapp-forge/plugin-sdk";
import type { PathCategory } from "@dapp-forge/blueprint-schema";
import { RunStore } from "../store/runs";
import { createExecutionLogger } from "../utils/logger";
import {
  applyCodegenOutput,
  formatAndLint,
  createManifest,
} from "./filesystem";
import { GitHubIntegration } from "./github";

export interface ExecutionOptions {
  dryRun?: boolean;
  createGitHubRepo?: boolean;
  githubToken?: string; // User's OAuth token from session
}

export interface ExecutionResult {
  success: boolean;
  files: Array<{ path: string; size: number }>;
  envVars: Array<{ key: string; description: string }>;
  scripts: Array<{ name: string; command: string }>;
  repoUrl?: string;
}

/**
 * Execution engine for running blueprint code generation
 */
export class ExecutionEngine {
  private registry = getDefaultRegistry();
  private runStore = new RunStore();
  private githubIntegration = new GitHubIntegration();

  /**
   * Execute a blueprint and generate code
   */
  async execute(
    blueprint: Blueprint,
    runId: string,
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    const logger = createExecutionLogger(runId);
    // Mark run as started
    this.runStore.start(runId);
    logger.info("Starting blueprint execution", { blueprintId: blueprint.id });

    try {
      // Create in-memory filesystem
      const vol = new Volume();
      const fs = createFsFromVolume(vol);

      // Initialize the filesystem with base structure
      fs.mkdirSync("/output", { recursive: true });
      fs.mkdirSync("/output/src", { recursive: true });
      fs.mkdirSync("/output/docs", { recursive: true });

      // Get topological order of nodes
      const sortedNodes = topologicalSort(blueprint.nodes, blueprint.edges);
      if (!sortedNodes) {
        throw new Error(
          "Blueprint contains cycles - cannot determine execution order",
        );
      }

      logger.info(`Executing ${sortedNodes.length} nodes in topological order`);

      // Build path context for intelligent file routing
      const pathContext = buildPathContext(sortedNodes);
      logger.info("Path context built", {
        hasFrontend: pathContext.hasFrontend,
        hasBackend: pathContext.hasBackend,
        hasContracts: pathContext.hasContracts,
      });

      // Track outputs from each node
      const nodeOutputs = new Map<string, CodegenOutput>();
      const allEnvVars: CodegenOutput["envVars"] = [];
      const allScripts: CodegenOutput["scripts"] = [];

      // Execute each node in order
      for (const node of sortedNodes) {
        logger.info(`Processing node: ${node.type}`, { nodeId: node.id });
        this.runStore.addLog(runId, {
          level: "info",
          message: `Processing node: ${node.type}`,
          nodeId: node.id,
        });

        // Get the plugin for this node type
        const plugin = this.registry.get(node.type) as NodePlugin | undefined;
        if (!plugin) {
          throw new Error(`No plugin found for node type: ${node.type}`);
        }

        // Create execution context
        const context: ExecutionContext = {
          blueprintId: blueprint.id,
          runId,
          config: blueprint.config,
          nodeOutputs,
          logger: createExecutionLogger(runId, node.id),
          pathContext,
        };

        // Validate node config
        const validationResult = await plugin.validate(node.config, context);
        if (!validationResult.valid) {
          const errors = validationResult.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join(", ");
          throw new Error(`Node ${node.id} validation failed: ${errors}`);
        }

        // Generate code
        const output = await plugin.generate(node, context);

        // Rewrite file paths based on path context (intelligent routing)
        // Auto-scope plugin outputs if they are not the primary scaffold
        const isScaffold =
          FRONTEND_SCAFFOLD_TYPES.includes(node.type) ||
          BACKEND_SCAFFOLD_TYPES.includes(node.type);
        const scope = isScaffold ? undefined : node.type;

        output.files = rewriteOutputPaths(output.files, pathContext, { scope });

        nodeOutputs.set(node.id, output);

        // Apply output to filesystem
        applyCodegenOutput(fs, "/output", output);

        // Copy component package if plugin has one (pre-built component architecture)
        if (plugin.componentPath) {
          logger.info(`Copying component package: ${plugin.componentPackage}`, {
            nodeId: node.id,
          });
          this.copyComponentToOutput(
            fs,
            "/output",
            plugin.componentPath,
            plugin.componentPackage || "component",
            pathContext,
            plugin.componentPathMappings,
            node.type,
          );
        }

        // Copy API routes if plugin declares a dependency on them
        if (plugin.apiRoutesPath) {
          logger.info(`Copying API routes from: ${plugin.apiRoutesPath}`, {
            nodeId: node.id,
          });
          this.copyApiRoutesToOutput(
            fs,
            "/output",
            plugin.apiRoutesPath,
            pathContext,
          );
        }

        // Copy API routes if plugin declares a dependency on them
        if (plugin.apiRoutesPath) {
          logger.info(`Copying API routes from: ${plugin.apiRoutesPath}`, {
            nodeId: node.id,
          });
          this.copyApiRoutesToOutput(
            fs,
            "/output",
            plugin.apiRoutesPath,
            pathContext,
          );
        }

        // Collect env vars and scripts
        allEnvVars.push(...output.envVars);
        allScripts.push(...output.scripts);

        logger.info(
          `Node ${node.type} generated ${output.files.length} files`,
          { nodeId: node.id },
        );
      }

      // Generate root files
      generateRootFiles(
        fs,
        "/output",
        blueprint,
        allEnvVars,
        allScripts,
        pathContext,
        sortedNodes,
      );

      // Run format and lint
      logger.info("Running format and lint checks");
      this.runStore.addLog(runId, {
        level: "info",
        message: "Running format and lint checks",
      });

      const lintResult = await formatAndLint(fs, "/output");
      if (!lintResult.success) {
        logger.warn("Lint/format warnings", { warnings: lintResult.warnings });
      }

      // Create manifest
      const manifest = createManifest(fs, "/output");

      // Handle GitHub repo creation
      let repoUrl: string | undefined;
      if (
        options.createGitHubRepo &&
        blueprint.config.github &&
        !options.dryRun
      ) {
        logger.info("Creating GitHub repository");
        this.runStore.addLog(runId, {
          level: "info",
          message: "Creating GitHub repository",
        });

        // Set the user's OAuth token if provided
        if (options.githubToken) {
          this.githubIntegration.setUserToken(options.githubToken);
        }

        const repoResult = await this.githubIntegration.createRepository(
          blueprint.config.github,
          fs,
          "/output",
        );

        repoUrl = repoResult.url;

        this.runStore.addArtifact(runId, {
          name: "GitHub Repository",
          type: "repo",
          url: repoUrl,
        });
      }

      // Add file manifest as artifact
      this.runStore.addArtifact(runId, {
        name: "Generated Files",
        type: "report",
        content: JSON.stringify(manifest, null, 2),
      });

      // Mark run as completed
      this.runStore.complete(runId);

      return {
        success: true,
        files: manifest.files,
        envVars: allEnvVars,
        scripts: allScripts,
        repoUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Execution failed", { error: message });
      this.runStore.fail(runId, message);
      throw error;
    }
  }

  /**
   * Copy a component package from the source repo to the output
   * Uses path mappings for intelligent file routing when available
   *
   * @param nodeType - The node type (e.g. 'pyth-oracle') used to scope output paths
   *                   so that multiple plugins with identically-named files (api.ts)
   *                   don't overwrite each other.
   */
  private copyComponentToOutput(
    memFs: ReturnType<typeof createFsFromVolume>,
    outputPath: string,
    componentPath: string,
    packageName: string,
    pathContext: PathContext,
    pathMappings?: Record<string, PathCategory>,
    nodeType?: string,
  ): void {
    const currentFileDir = dirname(fileURLToPath(import.meta.url));

    // Robust project root detection
    // 1. Check for environment variable
    // 2. Look for workspace marker (pnpm-workspace.yaml) in parent directories
    // 3. Fallback to rigid relative path
    let projectRoot = process.env.PROJECT_ROOT;

    if (!projectRoot) {
      let currentDir = currentFileDir;
      const rootMarker = "pnpm-workspace.yaml";
      while (currentDir !== path.parse(currentDir).root) {
        if (realFs.existsSync(path.join(currentDir, rootMarker))) {
          projectRoot = currentDir;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
    }

    if (!projectRoot) {
      // Fallback: This handles both src (../../../../) and dist (../../../)
      // but the recursive search above is much more reliable
      projectRoot = path.resolve(
        currentFileDir,
        currentFileDir.includes("dist") ? "../../../" : "../../../../",
      );
    }

    const sourcePath = path.join(projectRoot, componentPath);

    if (!realFs.existsSync(sourcePath)) {
      console.warn(`Component path not found: ${sourcePath}`);
      return;
    }

    // Determine scope: non-scaffold plugins get scoped by their node type
    const isScaffold =
      FRONTEND_SCAFFOLD_TYPES.includes(nodeType || "") ||
      BACKEND_SCAFFOLD_TYPES.includes(nodeType || "");
    const scope = isScaffold ? undefined : nodeType;

    console.log(
      `Copying component from: ${sourcePath}${scope ? ` (scoped: ${scope})` : ""}`,
    );

    // Non-scaffold plugins: copy entire component folder into lib/<plugin-id>/,
    // but extract contract/contracts folders to the root contracts/ directory.
    if (scope) {
      const pluginLibRoot = getPluginLibRoot(pathContext, scope);
      const libTarget = `${outputPath}/${pluginLibRoot}`;
      const contractsTarget = `${outputPath}/${pathContext.contractsPath}`;
      console.log(`Copying whole plugin folder to: ${pluginLibRoot}`);
      this.copyPluginWithContractsSplit(
        realFs,
        memFs,
        sourcePath,
        libTarget,
        contractsTarget,
      );
      return;
    }

    // Scaffold plugins with path mappings: use intelligent routing
    if (pathMappings && pathContext.hasFrontend) {
      console.log(`Using path mappings for ${packageName}`);
      this.copyWithPathMappings(
        realFs,
        memFs,
        sourcePath,
        outputPath,
        pathMappings,
        pathContext,
      );
      return;
    }

    // Default: Copy as separate package (scaffold-style)
    const dirName = packageName.includes("/")
      ? packageName.split("/").pop()!
      : packageName;

    const targetPath = `${outputPath}/packages/${dirName}`;

    this.copyDirectoryToMemfs(realFs, memFs, sourcePath, targetPath);
  }

  /**
   * Copy component files using path mappings for intelligent routing
   */
  private copyWithPathMappings(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
    pathMappings: Record<string, PathCategory>,
    pathContext: PathContext,
    scope?: string,
  ): void {
    this.copyDirectoryWithMappings(
      sourceFs,
      targetFs,
      sourcePath,
      outputPath,
      "",
      pathMappings,
      pathContext,
      scope,
    );
  }

  /**
   * Recursively copy directory with path mapping resolution
   *
   * @param scope - Optional plugin scope for namespacing files.
   *                When provided, scopable categories (lib, hooks, types, etc.)
   *                get a subdirectory: e.g. lib/pyth-oracle/api.ts
   */
  private copyDirectoryWithMappings(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
    relativePath: string,
    pathMappings: Record<string, PathCategory>,
    pathContext: PathContext,
    scope?: string,
  ): void {
    const currentPath = relativePath
      ? path.join(sourcePath, relativePath)
      : sourcePath;
    const items = sourceFs.readdirSync(currentPath);

    for (const item of items) {
      if (
        item === "node_modules" ||
        item === "dist" ||
        item === "target" ||
        item.startsWith(".")
      ) {
        continue;
      }

      const sourceItem = path.join(currentPath, item);
      const relativeItem = relativePath ? `${relativePath}/${item}` : item;
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        this.copyDirectoryWithMappings(
          sourceFs,
          targetFs,
          sourcePath,
          outputPath,
          relativeItem,
          pathMappings,
          pathContext,
          scope,
        );
      } else {
        const category = this.findPathCategory(relativeItem, pathMappings);

        if (category) {
          let targetPath: string;

          if (category === "contract-source") {
            // For contract source files, preserve directory structure under contracts/
            // e.g., contract/erc20/src/lib.rs -> contracts/erc20/src/lib.rs
            const contractRelativePath = relativeItem.replace(
              /^contracts?\//,
              "",
            );
            targetPath = `${outputPath}/contracts/${contractRelativePath}`;
          } else {
            const resolvedPath = resolveOutputPath(
              item,
              category,
              pathContext,
              { scope },
            );
            targetPath = `${outputPath}/${resolvedPath}`;
          }

          const targetDir = path.dirname(targetPath);

          targetFs.mkdirSync(targetDir, { recursive: true });
          const incomingContent = sourceFs.readFileSync(sourceItem, "utf-8");

          // Check if target file exists and needs merging
          let finalContent: string;
          let action = "created";

          try {
            const existingContent = targetFs.readFileSync(
              targetPath,
              "utf-8",
            ) as string;

            // File exists - check if we should merge
            if (shouldMergeFile(item)) {
              const mergeResult = mergeFileContents(
                existingContent,
                incomingContent,
                item,
              );

              if (mergeResult.success) {
                finalContent = mergeResult.content;
                action = "merged";

                if (mergeResult.warnings.length > 0) {
                  console.log(
                    `    ⚠️ Merge warnings: ${mergeResult.warnings.join(", ")}`,
                  );
                }
              } else {
                console.warn(
                  `    ⚠️ Could not merge ${item}, keeping existing`,
                );
                finalContent = existingContent;
                action = "kept-existing";
              }
            } else {
              // Not a mergeable file type - keep existing and warn
              console.warn(
                `    ⚠️ File conflict: ${item} - keeping existing (consider using unique names)`,
              );
              finalContent = existingContent;
              action = "kept-existing";
            }
          } catch {
            // File doesn't exist - write new content
            finalContent = incomingContent;
          }

          targetFs.writeFileSync(targetPath, finalContent);
          console.log(
            `  ${relativeItem} -> ${targetPath.replace(
              outputPath + "/",
              "",
            )} (${category}) [${action}]`,
          );
        } else {
          if (item === "README.md" || item.endsWith(".md")) {
            const docsPath = `${outputPath}/docs`;
            targetFs.mkdirSync(docsPath, { recursive: true });
            const content = sourceFs.readFileSync(sourceItem);
            targetFs.writeFileSync(`${docsPath}/${item}`, content);
          }
        }
      }
    }
  }

  /**
   * Find the path category for a file based on path mappings
   * Supports glob-like patterns: ** for any path, * for any filename
   */
  private findPathCategory(
    filePath: string,
    pathMappings: Record<string, PathCategory>,
  ): PathCategory | undefined {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, "/");

    for (const [pattern, category] of Object.entries(pathMappings)) {
      if (this.matchPattern(normalizedPath, pattern)) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Simple glob pattern matching
   * Supports: ** (any path), * (any filename without /)
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Escape regex special chars except *
    let regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "<<<DOUBLE>>>") // Placeholder for **
      .replace(/\*/g, "[^/]*") // * matches anything except /
      .replace(/<<<DOUBLE>>>/g, ".*"); // ** matches anything including /

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Copy wallet-auth files merged into apps/web/src/ structure
   */
  private copyWalletAuthMerged(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
  ): void {
    const srcPath = path.join(sourcePath, "src");
    if (!sourceFs.existsSync(srcPath)) {
      console.warn(`wallet-auth src/ not found: ${srcPath}`);
      return;
    }

    // Mapping: wallet-auth/src/X -> apps/web/src/X
    const webSrcPath = `${outputPath}/apps/web/src`;

    const items = sourceFs.readdirSync(srcPath);
    for (const item of items) {
      if (item === "node_modules" || item.startsWith(".")) continue;

      const sourceItem = path.join(srcPath, item);
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        // Copy directories like hooks/, preserving folder structure
        const targetDir = `${webSrcPath}/${item}`;
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, targetDir);
      } else {
        // Copy individual files to lib/ (config.ts, constants.ts, types.ts, etc)
        const targetDir = `${webSrcPath}/lib`;
        targetFs.mkdirSync(targetDir, { recursive: true });
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(`${targetDir}/${item}`, content);
      }
    }

    // Also copy README.md to docs/wallet-auth/
    const readmePath = path.join(sourcePath, "README.md");
    if (sourceFs.existsSync(readmePath)) {
      const docsPath = `${outputPath}/docs/wallet-auth`;
      targetFs.mkdirSync(docsPath, { recursive: true });
      const content = sourceFs.readFileSync(readmePath);
      targetFs.writeFileSync(`${docsPath}/README.md`, content);
    }
  }

  /**
   * Copy API route files that a plugin depends on into the generated output.
   *
   * Resolves the source directory from the project root and copies it into
   * the correct Next.js App Router location:
   *   - With frontend scaffold: apps/web/src/app/api/<namespace>/
   *   - Without frontend scaffold: src/app/api/<namespace>/
   *
   * The namespace is derived from the last segment of the apiRoutesPath
   * (e.g., 'apps/web/src/app/api/maxxit' → 'maxxit').
   */
  private copyApiRoutesToOutput(
    memFs: ReturnType<typeof createFsFromVolume>,
    outputPath: string,
    apiRoutesPath: string,
    pathContext: PathContext,
  ): void {
    // Resolve project root using the same strategy as copyComponentToOutput
    const currentFileDir = dirname(fileURLToPath(import.meta.url));
    let projectRoot = process.env.PROJECT_ROOT;

    if (!projectRoot) {
      let currentDir = currentFileDir;
      const rootMarker = "pnpm-workspace.yaml";
      while (currentDir !== path.parse(currentDir).root) {
        if (realFs.existsSync(path.join(currentDir, rootMarker))) {
          projectRoot = currentDir;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
    }

    if (!projectRoot) {
      projectRoot = path.resolve(
        currentFileDir,
        currentFileDir.includes("dist") ? "../../../" : "../../../../",
      );
    }

    const sourcePath = path.join(projectRoot, apiRoutesPath);

    if (!realFs.existsSync(sourcePath)) {
      console.warn(`API routes path not found: ${sourcePath}`);
      return;
    }

    // Derive namespace from the last path segment (e.g., 'maxxit')
    const namespace = path.basename(apiRoutesPath);

    // Determine the target path inside the generated project
    let targetPath: string;
    if (pathContext.hasFrontend) {
      const srcPath = pathContext.frontendSrcPath
        ? `/${pathContext.frontendSrcPath}`
        : "";
      targetPath = `${outputPath}/${pathContext.frontendPath}${srcPath}/app/api/${namespace}`;
    } else {
      targetPath = `${outputPath}/src/app/api/${namespace}`;
    }

    console.log(
      `Copying API routes: ${apiRoutesPath} → ${targetPath.replace(outputPath + "/", "")}`,
    );
    this.copyDirectoryToMemfs(realFs, memFs, sourcePath, targetPath);
  }

  /**
   * Copy a plugin component folder into lib/<plugin-id>/ while extracting
   * any contract/ or contracts/ subdirectories to the root contracts/ folder.
   */
  private copyPluginWithContractsSplit(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    libTarget: string,
    contractsTarget: string,
  ): void {
    targetFs.mkdirSync(libTarget, { recursive: true });

    const items = sourceFs.readdirSync(sourcePath);

    for (const item of items) {
      if (
        item === "node_modules" ||
        item === "dist" ||
        item === "target" ||
        item.startsWith(".")
      ) {
        continue;
      }

      const sourceItem = path.join(sourcePath, item);
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory() && (item === "contract" || item === "contracts")) {
        // Redirect contract folders to root contracts/
        console.log(`  Extracting ${item}/ → ${contractsTarget.replace(/.*\/output\//, "")}/`);
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, contractsTarget);
      } else if (stat.isDirectory()) {
        this.copyDirectoryToMemfs(
          sourceFs,
          targetFs,
          sourceItem,
          `${libTarget}/${item}`,
        );
      } else {
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(`${libTarget}/${item}`, content);
      }
    }
  }

  /**
   * Recursively copy a directory from real fs to memfs
   */
  private copyDirectoryToMemfs(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    targetPath: string,
  ): void {
    targetFs.mkdirSync(targetPath, { recursive: true });

    const items = sourceFs.readdirSync(sourcePath);

    for (const item of items) {
      if (
        item === "node_modules" ||
        item === "dist" ||
        item === "target" ||
        item.startsWith(".")
      ) {
        continue;
      }

      const sourceItem = path.join(sourcePath, item);
      const targetItem = `${targetPath}/${item}`;
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, targetItem);
      } else {
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(targetItem, content);
      }
    }
  }
}

/**
 * Generate root project files
 */
function generateRootFiles(
  fs: ReturnType<typeof createFsFromVolume>,
  basePath: string,
  blueprint: Blueprint,
  envVars: CodegenOutput["envVars"],
  scripts: CodegenOutput["scripts"],
  pathContext?: PathContext,
  nodes?: BlueprintNode[],
): void {
  // Determine if we need monorepo structure
  // Only need monorepo if:
  // 1. Has backend (multiple apps need coordination), OR
  // 2. Has contracts WITHOUT frontend (standalone contract project needs different setup)
  // When frontend + ERC contracts, we don't need monorepo - frontend handles the interaction
  const needsMonorepo =
    pathContext?.hasBackend ||
    (pathContext?.hasContracts && !pathContext?.hasFrontend) ||
    !pathContext?.hasFrontend;
  const { project } = blueprint.config;

  // Generate package.json
  // Adjust scripts based on whether we need monorepo structure
  const packageJson = needsMonorepo
    ? {
        name: project.name.toLowerCase().replace(/\s+/g, "-"),
        version: project.version,
        description: project.description,
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
          ...Object.fromEntries(scripts.map((s) => [s.name, s.command])),
        },
        dependencies: {},
        devDependencies: {
          typescript: "^5.3.0",
        },
        packageManager: "pnpm@9.0.0",
        author: project.author,
        license: project.license,
        keywords: project.keywords,
      }
    : {
        // Standalone frontend - simpler package.json pointing to apps/web
        name: project.name.toLowerCase().replace(/\s+/g, "-"),
        version: project.version,
        description: project.description,
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
          ...Object.fromEntries(scripts.map((s) => [s.name, s.command])),
        },
        dependencies: {},
        devDependencies: {
          typescript: "^5.3.0",
        },
        packageManager: "pnpm@9.0.0",
        license: project.license,
        keywords: project.keywords,
      };

  fs.writeFileSync(
    `${basePath}/package.json`,
    JSON.stringify(packageJson, null, 2),
  );

  // Generate .env.example
  // Put in apps/web for standalone frontend, root for monorepo
  const envExampleHeader =
    "# Environment Variables\n# Copy this file to .env and fill in the values\n\n";
  const dedupedEnvVars = dedupeEnvVars(envVars);
  const envVarsContent = dedupedEnvVars
    .map(
      (v) =>
        `# ${v.description}${v.required ? " (required)" : ""}${
          v.secret ? " [secret]" : ""
        }\n${v.key}=${v.defaultValue || ""}`,
    )
    .join("\n\n");
  const envExample =
    envExampleHeader +
    (envVarsContent || "# No environment variables required\n");

  const envPath =
    pathContext?.hasFrontend && !needsMonorepo
      ? `${basePath}/apps/web/.env.example`
      : `${basePath}/.env.example`;
  fs.writeFileSync(envPath, envExample);

  // Generate README.md
  const readme = generateReadme(project, scripts, dedupedEnvVars, nodes);
  fs.writeFileSync(`${basePath}/README.md`, readme);

  // Generate .gitignore
  const gitignore = `# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store

# Logs
*.log

# Test coverage
coverage/

# Rust/WASM
target/
*.wasm

# Generated
*.generated.*
`;
  fs.writeFileSync(`${basePath}/.gitignore`, gitignore);

  // Generate turbo.json and pnpm-workspace.yaml only for monorepo structure
  if (needsMonorepo) {
    // Generate turbo.json
    const turboConfig = {
      $schema: "https://turbo.build/schema.json",
      tasks: {
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**", ".next/**"],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        test: {
          dependsOn: ["^build"],
        },
        lint: {},
      },
    };
    // fs.writeFileSync(`${basePath}/turbo.json`, JSON.stringify(turboConfig, null, 2));

    // Generate pnpm-workspace.yaml
    const pnpmWorkspace = `packages:
  - "apps/*"
  - "packages/*"
  - "contracts/*"
`;
    fs.writeFileSync(`${basePath}/pnpm-workspace.yaml`, pnpmWorkspace);
  }
}

/**
 * Dedupe environment variables by key while preserving important flags.
 * If the same key appears multiple times, we:
 * - keep the first description (if any)
 * - OR flags (required/secret)
 * - keep the first non-empty defaultValue
 */
function dedupeEnvVars(
  envVars: CodegenOutput["envVars"],
): CodegenOutput["envVars"] {
  const byKey = new Map<string, CodegenOutput["envVars"][number]>();

  for (const v of envVars) {
    const existing = byKey.get(v.key);

    if (!existing) {
      byKey.set(v.key, { ...v });
    } else {
      existing.required = existing.required || v.required;
      existing.secret = existing.secret || v.secret;

      if (!existing.description && v.description) {
        existing.description = v.description;
      }

      if (
        (existing.defaultValue === undefined || existing.defaultValue === "") &&
        v.defaultValue !== undefined &&
        v.defaultValue !== ""
      ) {
        existing.defaultValue = v.defaultValue;
      }
    }
  }

  return Array.from(byKey.values());
}

function generateReadme(
  project: Blueprint["config"]["project"],
  scripts: CodegenOutput["scripts"],
  envVars: CodegenOutput["envVars"],
  nodes?: BlueprintNode[],
): string {
  const appSlug = project.name.toLowerCase().replace(/\s+/g, "-");
  const nodeTypes = new Set((nodes || []).map((n) => n.type));

  // Build contracts section based on which plugins are present
  let contractsStructure =
    "├── contracts/                  # Rust/Stylus smart contracts\n";
  if (nodeTypes.has("smartcache-caching")) {
    contractsStructure += `│   ├── mycontract/            # Original contract (no caching)\n`;
    contractsStructure += `│   │   └── src/lib.rs\n`;
    contractsStructure += `│   └── cached-contract/       # Contract with is_cacheable helper\n`;
    contractsStructure += `│       └── src/lib.rs\n`;
  } else if (nodeTypes.has("stylus-contract")) {
    contractsStructure += `│   └── counter-contract/      # Stylus template (edit src/lib.rs per docs)\n`;
    contractsStructure += `│       └── src/lib.rs\n`;
  } else if (
    nodeTypes.has("erc20-stylus") ||
    nodeTypes.has("erc721-stylus") ||
    nodeTypes.has("erc1155-stylus")
  ) {
    const contracts: string[] = [];
    if (nodeTypes.has("erc20-stylus")) contracts.push("erc20");
    if (nodeTypes.has("erc721-stylus")) contracts.push("erc721");
    if (nodeTypes.has("erc1155-stylus")) contracts.push("erc1155");
    contracts.forEach((c) => {
      contractsStructure += `│   └── ${c}/\n`;
    });
  } else {
    contractsStructure += `│   └── (contract source)\n`;
  }

  const hasFrontend = nodeTypes.has("frontend-scaffold");
  let structureBlock = `\`\`\`\n${appSlug}/\n`;
  if (hasFrontend) {
    structureBlock += `├── apps/\n│   └── web/                    # Next.js frontend\n│       ├── src/\n│       ├── package.json\n│       └── ...\n`;
  }
  structureBlock += `${contractsStructure}├── docs/                       # Documentation\n├── scripts/                     # Deploy scripts\n├── .gitignore\n└── README.md\n\`\`\``;

  return `# ${project.name}

${
  project.description ||
  "A Web3 dApp composed with [[N]skills](https://www.nskills.xyz)."
}

## 📁 Project Structure

${structureBlock}

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd ${appSlug}
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit \`.env\` and configure:
   ${
     envVars
       .filter((v) => v.required)
       .map((v) => `   - \`${v.key}\`: ${v.description}`)
       .join("\n") || "   - No required variables"
   }

4. **Deploy contracts** (from repo root): \`pnpm deploy:sepolia\` or \`pnpm deploy:mainnet\`

5. **Scripts (Windows):** Run \`pnpm fix-scripts\` or \`dos2unix scripts/*.sh\` if you see line-ending errors.

## 🔗 Smart Contracts

The \`contracts/\` folder contains Rust/Stylus smart contract source code. See \`docs/\` for deployment and integration guides.

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| \`pnpm deploy:sepolia\` | Deploy to Arbitrum Sepolia |
| \`pnpm deploy:mainnet\` | Deploy to Arbitrum One |
| \`pnpm fix-scripts\` | Fix CRLF line endings (Windows) |

## 🌐 Supported Networks

- Arbitrum Sepolia (Testnet)
- Arbitrum One (Mainnet)
- Superposition
- Superposition Testnet

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem
- **Wallet Connection:** RainbowKit

## 📖 Documentation

See the \`docs/\` folder for:
- Contract interaction guide
- Deployment instructions
- API reference

## License

${project.license}

---

Generated with ❤️ by [[N]skills](https://www.nskills.xyz)
`;
}
