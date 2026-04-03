import { Volume, createFsFromVolume } from "memfs";
import type {
  Blueprint,
  BlueprintNode,
  BlueprintEdge,
  CodegenOutput,
  ExecutionContext,
} from "@dapp-forge/blueprint-schema";
import { topologicalSort } from "@dapp-forge/blueprint-schema";
import {
  getDefaultRegistry,
  buildPathContext,
  type NodePlugin,
  type PathContext,
} from "@dapp-forge/plugin-sdk";
import { PLUGIN_REGISTRY } from "@cradle/plugin-config";
import { RunStore } from "../store/runs";
import { createExecutionLogger } from "../utils/logger";
import { createManifest } from "./filesystem";
import { GitHubIntegration } from "./github";
import type { ExecutionResult, ExecutionOptions } from "./execution";

export interface SkillsGenerationResult extends ExecutionResult {
  vol: InstanceType<typeof Volume>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a camelCase key to a human-readable Title Case label. */
function humanizeKey(key: string): string {
  // Insert space before capitals and uppercase the first letter
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, " ")
    .trim();
}

/** Render a config value as a human-readable string. */
function humanizeValue(value: unknown): string {
  if (value === true) return "Enabled";
  if (value === false) return "Disabled";
  if (Array.isArray(value)) return value.join(", ") || "(none)";
  if (value === null || value === undefined) return "(not set)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Shorten a UUID to an 8-char prefix. */
function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

/** Dedupe environment variables by key. */
function dedupeEnvVars(
  envVars: CodegenOutput["envVars"]
): CodegenOutput["envVars"] {
  const byKey = new Map<string, CodegenOutput["envVars"][number]>();
  for (const v of envVars) {
    const existing = byKey.get(v.key);
    if (!existing) {
      byKey.set(v.key, { ...v });
    } else {
      existing.required = existing.required || v.required;
      existing.secret = existing.secret || v.secret;
      if (!existing.description && v.description)
        existing.description = v.description;
      if (!existing.defaultValue && v.defaultValue)
        existing.defaultValue = v.defaultValue;
    }
  }
  return Array.from(byKey.values());
}

/** Extract dependency versions from generated package.json files. */
function extractDependencies(
  outputs: Map<string, CodegenOutput>
): Map<string, { version: string; source: string }> {
  const deps = new Map<string, { version: string; source: string }>();

  for (const [nodeType, output] of outputs) {
    for (const file of output.files) {
      if (!file.path.endsWith("package.json")) continue;
      try {
        const pkg = JSON.parse(file.content);
        for (const section of [
          "dependencies",
          "devDependencies",
          "peerDependencies",
        ] as const) {
          const entries = pkg[section];
          if (!entries || typeof entries !== "object") continue;
          for (const [name, version] of Object.entries(entries)) {
            if (!deps.has(name)) {
              deps.set(name, {
                version: String(version),
                source: nodeType,
              });
            }
          }
        }
      } catch {
        // Not valid JSON, skip
      }
    }
  }
  return deps;
}

// ---------------------------------------------------------------------------
// Markdown renderers
// ---------------------------------------------------------------------------

function renderProjectMd(blueprint: Blueprint): string {
  const { project, network } = blueprint.config;
  return `# Project: ${project.name}

## Overview

| Field | Value |
|-------|-------|
| Name | ${project.name} |
| Description | ${project.description || "(not set)"} |
| Version | ${project.version} |
| License | ${project.license} |
| Keywords | ${(project.keywords || []).join(", ") || "(none)"} |

## Network Configuration

| Field | Value |
|-------|-------|
| Chain ID | ${network.chainId} |
| Network | ${network.name} |
| RPC URL | ${network.rpcUrl || "(default)"} |
| Explorer | ${network.explorerUrl || "(default)"} |
| Testnet | ${network.isTestnet ? "Yes" : "No"} |
`;
}

function renderArchitectureMd(
  sortedNodes: BlueprintNode[],
  edges: BlueprintEdge[]
): string {
  // Build mermaid graph
  const mermaidLines: string[] = ["graph TD"];
  for (const node of sortedNodes) {
    const label = (node.config as Record<string, unknown>).label || humanizeKey(node.type);
    mermaidLines.push(`  ${shortId(node.id)}["${label} (${node.type})"]`);
  }
  for (const edge of edges) {
    const srcShort = shortId(edge.source);
    const tgtShort = shortId(edge.target);
    mermaidLines.push(`  ${srcShort} --> ${tgtShort}`);
  }

  const orderList = sortedNodes
    .map((n, i) => `${i + 1}. **${humanizeKey(n.type)}** (\`${shortId(n.id)}\`)`)
    .join("\n");

  return `# Architecture

## Dependency Graph

\`\`\`mermaid
${mermaidLines.join("\n")}
\`\`\`

## Execution / Implementation Order

${orderList}
`;
}

function renderEnvironmentMd(
  envVars: CodegenOutput["envVars"]
): string {
  if (envVars.length === 0)
    return "# Environment Variables\n\nNo environment variables required.\n";

  const rows = envVars
    .map(
      (v) =>
        `| \`${v.key}\` | ${v.description} | ${v.required ? "Yes" : "No"} | ${v.secret ? "Yes" : "No"} | ${v.defaultValue || ""} |`
    )
    .join("\n");

  return `# Environment Variables

| Key | Description | Required | Secret | Default |
|-----|-------------|----------|--------|---------|
${rows}
`;
}

function renderDependenciesMd(
  deps: Map<string, { version: string; source: string }>
): string {
  if (deps.size === 0)
    return "# Dependencies\n\nNo pinned dependencies.\n";

  const rows = Array.from(deps.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([name, { version, source }]) =>
        `| \`${name}\` | \`${version}\` | ${source} |`
    )
    .join("\n");

  return `# Verified Compatible Dependencies

These dependency versions were extracted from plugin outputs and are known to work together.

| Package | Version | Source Component |
|---------|---------|-----------------|
${rows}
`;
}

function renderScriptsMd(
  scripts: CodegenOutput["scripts"]
): string {
  if (scripts.length === 0)
    return "# Scripts\n\nNo scripts defined.\n";

  const rows = scripts
    .map((s) => `| \`${s.name}\` | \`${s.command}\` | ${s.description || ""} |`)
    .join("\n");

  return `# Scripts

| Name | Command | Description |
|------|---------|-------------|
${rows}
`;
}

function renderIntegrationMapMd(
  edges: BlueprintEdge[],
  nodesById: Map<string, BlueprintNode>,
  pluginPorts: Map<string, { id: string; name: string; type: string; dataType: string }[]>
): string {
  if (edges.length === 0)
    return "# Integration Map\n\nNo connections between components.\n";

  const sections = edges.map((edge) => {
    const src = nodesById.get(edge.source);
    const tgt = nodesById.get(edge.target);
    if (!src || !tgt) return "";

    const srcPorts = pluginPorts.get(src.type) || [];
    const tgtPorts = pluginPorts.get(tgt.type) || [];

    const outputPorts = srcPorts.filter((p) => p.type === "output");
    const inputPorts = tgtPorts.filter((p) => p.type === "input");

    return `### ${humanizeKey(src.type)} --> ${humanizeKey(tgt.type)}

- **Source**: ${humanizeKey(src.type)} (\`${shortId(src.id)}\`)
  ${outputPorts.length > 0 ? `- Output ports: ${outputPorts.map((p) => `${p.name} (${p.dataType})`).join(", ")}` : ""}
- **Target**: ${humanizeKey(tgt.type)} (\`${shortId(tgt.id)}\`)
  ${inputPorts.length > 0 ? `- Input ports: ${inputPorts.map((p) => `${p.name} (${p.dataType})`).join(", ")}` : ""}
`;
  });

  return `# Integration Map

How components connect and what data flows between them.

${sections.join("\n")}`;
}

function renderComponentMd(
  node: BlueprintNode,
  output: CodegenOutput,
  edges: BlueprintEdge[],
  nodesById: Map<string, BlueprintNode>,
  pluginMeta: { name: string; description: string; category: string; tags: string[] } | undefined
): string {
  const config = node.config as Record<string, unknown>;
  const prompt = (config.prompt as string) || "";

  // Header
  const meta = pluginMeta || {
    name: humanizeKey(node.type),
    description: "",
    category: "",
    tags: [],
  };

  let md = `# ${meta.name}

| Field | Value |
|-------|-------|
| Type | \`${node.type}\` |
| ID | \`${shortId(node.id)}\` |
| Category | ${meta.category} |
| Tags | ${meta.tags.join(", ") || "(none)"} |
| Description | ${meta.description} |

`;

  // User prompt
  if (prompt) {
    md += `## User's Intent

> ${prompt.replace(/\n/g, "\n> ")}

`;
  }

  // Configuration table
  const configEntries = Object.entries(config).filter(
    ([key]) => !["label", "description", "prompt"].includes(key)
  );

  if (configEntries.length > 0) {
    md += `## Configuration

| Setting | Value |
|---------|-------|
`;
    for (const [key, value] of configEntries) {
      md += `| ${humanizeKey(key)} | ${humanizeValue(value)} |\n`;
    }
    md += "\n";
  }

  // Environment variables
  if (output.envVars.length > 0) {
    md += `## Environment Variables

| Key | Description | Required | Secret | Default |
|-----|-------------|----------|--------|---------|
`;
    for (const v of output.envVars) {
      md += `| \`${v.key}\` | ${v.description} | ${v.required ? "Yes" : "No"} | ${v.secret ? "Yes" : "No"} | ${v.defaultValue || ""} |\n`;
    }
    md += "\n";
  }

  // Scripts
  if (output.scripts.length > 0) {
    md += `## Scripts

| Name | Command |
|------|---------|
`;
    for (const s of output.scripts) {
      md += `| \`${s.name}\` | \`${s.command}\` |\n`;
    }
    md += "\n";
  }

  // ABIs / Interfaces
  const abis = output.interfaces.filter((i) => i.type === "abi");
  if (abis.length > 0) {
    md += `## Contract ABIs

`;
    for (const abi of abis) {
      md += `### ${abi.name}

\`\`\`json
${abi.content}
\`\`\`

`;
    }
  }

  // Documentation from plugin
  if (output.docs.length > 0) {
    md += `## Documentation

`;
    for (const doc of output.docs) {
      md += `### ${doc.title}

${doc.content}

`;
    }
  }

  // Generated file structure
  if (output.files.length > 0) {
    md += `## File Structure

This component would generate the following files:

`;
    for (const f of output.files) {
      const cat = f.category ? ` (${f.category})` : "";
      md += `- \`${f.path}\`${cat}\n`;
    }
    md += "\n";
  }

  // Integration points (edges)
  const incomingEdges = edges.filter((e) => e.target === node.id);
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  if (incomingEdges.length > 0 || outgoingEdges.length > 0) {
    md += `## Integration Points

`;
    if (incomingEdges.length > 0) {
      md += `**Depends on:**\n`;
      for (const e of incomingEdges) {
        const src = nodesById.get(e.source);
        if (src)
          md += `- ${humanizeKey(src.type)} (\`${shortId(src.id)}\`)\n`;
      }
      md += "\n";
    }
    if (outgoingEdges.length > 0) {
      md += `**Provides to:**\n`;
      for (const e of outgoingEdges) {
        const tgt = nodesById.get(e.target);
        if (tgt)
          md += `- ${humanizeKey(tgt.type)} (\`${shortId(tgt.id)}\`)\n`;
      }
      md += "\n";
    }
  }

  return md;
}

function renderClaudeMd(
  blueprint: Blueprint,
  sortedNodes: BlueprintNode[],
  edges: BlueprintEdge[],
  allEnvVars: CodegenOutput["envVars"],
  allScripts: CodegenOutput["scripts"],
  deps: Map<string, { version: string; source: string }>,
  nodeOutputs: Map<string, CodegenOutput>
): string {
  const { project, network } = blueprint.config;

  // Build component summary table
  const componentRows = sortedNodes
    .map((node) => {
      const config = node.config as Record<string, unknown>;
      const registryEntry = PLUGIN_REGISTRY[node.type];
      const name = registryEntry?.name || humanizeKey(node.type);
      const prompt = (config.prompt as string) || "";
      const promptExcerpt = prompt
        ? prompt.slice(0, 80) + (prompt.length > 80 ? "..." : "")
        : "(none)";
      return `| ${name} | \`${node.type}\` | ${registryEntry?.category || ""} | ${promptExcerpt} |`;
    })
    .join("\n");

  // Build mermaid graph
  const mermaidLines: string[] = ["graph TD"];
  for (const node of sortedNodes) {
    const registryEntry = PLUGIN_REGISTRY[node.type];
    const label = registryEntry?.name || humanizeKey(node.type);
    mermaidLines.push(`  ${shortId(node.id)}["${label}"]`);
  }
  for (const edge of edges) {
    mermaidLines.push(`  ${shortId(edge.source)} --> ${shortId(edge.target)}`);
  }

  // Env vars table
  const dedupedEnvVars = dedupeEnvVars(allEnvVars);
  const envRows = dedupedEnvVars
    .map(
      (v) =>
        `| \`${v.key}\` | ${v.description} | ${v.required ? "Yes" : "No"} | ${v.defaultValue || ""} |`
    )
    .join("\n");

  // Key dependencies
  const depRows = Array.from(deps.entries())
    .slice(0, 30) // Top 30 most important
    .map(([name, { version }]) => `| \`${name}\` | \`${version}\` |`)
    .join("\n");

  // Implementation order
  const implOrder = sortedNodes
    .map((n, i) => {
      const registryEntry = PLUGIN_REGISTRY[n.type];
      const name = registryEntry?.name || humanizeKey(n.type);
      return `${i + 1}. **${name}** (\`${n.type}\`) — see \`\.nskils/components/${n.type}--${shortId(n.id)}.md\``;
    })
    .join("\n");

  // Component spec links
  const specLinks = sortedNodes
    .map((n) => {
      const registryEntry = PLUGIN_REGISTRY[n.type];
      const name = registryEntry?.name || humanizeKey(n.type);
      return `- [${name}](\.nskils/components/${n.type}--${shortId(n.id)}.md)`;
    })
    .join("\n");

  return `# ${project.name}

> ${project.description || "A Web3 application composed with [N]skills."}

**Network**: ${network.name} (Chain ID: ${network.chainId})${network.isTestnet ? " — Testnet" : ""}
**Keywords**: ${(project.keywords || []).join(", ")}

---

## Architecture

\`\`\`mermaid
${mermaidLines.join("\n")}
\`\`\`

## Components

| Component | Type | Category | User Prompt |
|-----------|------|----------|-------------|
${componentRows}

## Implementation Order

Build the project in this order (respects dependencies):

${implOrder}

## Environment Variables

| Key | Description | Required | Default |
|-----|-------------|----------|---------|
${envRows || "| (none) | | | |"}

## Key Dependencies

| Package | Version |
|---------|---------|
${depRows || "| (none) | |"}

## Detailed Component Specs

${specLinks}

## Additional Context

- [Project Configuration](\.nskils/project.md)
- [Full Architecture Details](\.nskils/architecture.md)
- [All Environment Variables](\.nskils/environment.md)
- [Verified Dependencies](\.nskils/dependencies.md)
- [Scripts Reference](\.nskils/scripts.md)
- [Integration Map](\.nskils/integration-map.md)

---

*Generated by [[N]skills](https://www.nskills.xyz) — Compose N skills for your Web3 project.*
`;
}

// ---------------------------------------------------------------------------
// Main generator class
// ---------------------------------------------------------------------------

export class SkillsRepoGenerator {
  private registry = getDefaultRegistry();
  private runStore = new RunStore();
  private githubIntegration = new GitHubIntegration();

  /**
   * Generate a skills repo (rich context package) from a blueprint.
   *
   * Runs every plugin's generate() to extract metadata (env vars, scripts,
   * docs, interfaces/ABIs, file paths), then renders that data plus the
   * user's config and prompts into structured markdown files.
   */
  async generate(
    blueprint: Blueprint,
    runId: string,
    options: ExecutionOptions = {}
  ): Promise<SkillsGenerationResult> {
    const logger = createExecutionLogger(runId);
    this.runStore.start(runId);
    logger.info("Starting skills repo generation", {
      blueprintId: blueprint.id,
    });

    try {
      // In-memory filesystem for skills output
      const vol = new Volume();
      const fs = createFsFromVolume(vol);
      fs.mkdirSync("/output", { recursive: true });
      fs.mkdirSync("/output/\.nskils/components", { recursive: true });

      // Sort nodes topologically
      const sortedNodes = topologicalSort(blueprint.nodes, blueprint.edges);
      if (!sortedNodes) {
        throw new Error(
          "Blueprint contains cycles — cannot determine execution order"
        );
      }

      logger.info(
        `Processing ${sortedNodes.length} nodes for skills repo`
      );

      // Build path context (needed by plugins)
      const pathContext = buildPathContext(sortedNodes);

      // Lookup maps
      const nodesById = new Map<string, BlueprintNode>(
        sortedNodes.map((n) => [n.id, n])
      );

      // Run each plugin to extract rich metadata
      const nodeOutputs = new Map<string, CodegenOutput>();
      const allEnvVars: CodegenOutput["envVars"] = [];
      const allScripts: CodegenOutput["scripts"] = [];
      const pluginPorts = new Map<
        string,
        { id: string; name: string; type: string; dataType: string }[]
      >();

      for (const node of sortedNodes) {
        logger.info(`Analyzing node: ${node.type}`, { nodeId: node.id });
        this.runStore.addLog(runId, {
          level: "info",
          message: `Analyzing node: ${node.type}`,
          nodeId: node.id,
        });

        const plugin = this.registry.get(node.type) as
          | NodePlugin
          | undefined;
        if (!plugin) {
          logger.warn(`No plugin for node type: ${node.type}, skipping`);
          // Create empty output so the component spec still renders
          nodeOutputs.set(node.id, {
            files: [],
            patches: [],
            envVars: [],
            scripts: [],
            interfaces: [],
            docs: [],
          });
          continue;
        }

        // Store port definitions for integration map
        pluginPorts.set(
          node.type,
          (plugin.ports || []).map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            dataType: p.dataType,
          }))
        );

        // Build execution context
        const context: ExecutionContext = {
          blueprintId: blueprint.id,
          runId,
          config: blueprint.config,
          nodeOutputs,
          logger: createExecutionLogger(runId, node.id),
          pathContext,
        };

        // Run plugin.generate() to get full output metadata
        try {
          const output = await plugin.generate(node, context);
          nodeOutputs.set(node.id, output);
          allEnvVars.push(...output.envVars);
          allScripts.push(...output.scripts);

          logger.info(
            `Node ${node.type}: ${output.files.length} files, ${output.envVars.length} env vars, ${output.interfaces.length} interfaces`
          );
        } catch (err) {
          logger.warn(
            `Plugin generate() failed for ${node.type}: ${err instanceof Error ? err.message : "unknown"}`
          );
          nodeOutputs.set(node.id, {
            files: [],
            patches: [],
            envVars: [],
            scripts: [],
            interfaces: [],
            docs: [],
          });
        }
      }

      // Extract dependency versions from generated package.json files
      const deps = extractDependencies(nodeOutputs);

      // -- Render all markdown files --

      // Per-component specs
      for (const node of sortedNodes) {
        const output = nodeOutputs.get(node.id)!;
        const registryEntry = PLUGIN_REGISTRY[node.type];
        const pluginMeta = registryEntry
          ? {
              name: registryEntry.name,
              description: registryEntry.description,
              category: registryEntry.category,
              tags: registryEntry.tags,
            }
          : undefined;

        const componentMd = renderComponentMd(
          node,
          output,
          blueprint.edges,
          nodesById,
          pluginMeta
        );
        const filename = `${node.type}--${shortId(node.id)}.md`;
        fs.writeFileSync(
          `/output/\.nskils/components/${filename}`,
          componentMd
        );
      }

      // Project
      fs.writeFileSync(
        "/output/\.nskils/project.md",
        renderProjectMd(blueprint)
      );

      // Architecture
      fs.writeFileSync(
        "/output/\.nskils/architecture.md",
        renderArchitectureMd(sortedNodes, blueprint.edges)
      );

      // Environment
      const dedupedEnvVars = dedupeEnvVars(allEnvVars);
      fs.writeFileSync(
        "/output/\.nskils/environment.md",
        renderEnvironmentMd(dedupedEnvVars)
      );

      // Dependencies
      fs.writeFileSync(
        "/output/\.nskils/dependencies.md",
        renderDependenciesMd(deps)
      );

      // Scripts
      fs.writeFileSync(
        "/output/\.nskils/scripts.md",
        renderScriptsMd(allScripts)
      );

      // Integration map
      fs.writeFileSync(
        "/output/\.nskils/integration-map.md",
        renderIntegrationMapMd(blueprint.edges, nodesById, pluginPorts)
      );

      // CLAUDE.md — master context
      fs.writeFileSync(
        "/output/CLAUDE.md",
        renderClaudeMd(
          blueprint,
          sortedNodes,
          blueprint.edges,
          allEnvVars,
          allScripts,
          deps,
          nodeOutputs
        )
      );

      // Create manifest
      const manifest = createManifest(fs, "/output");

      // Handle GitHub repo creation (same flow as codegen)
      let repoUrl: string | undefined;
      if (
        options.createGitHubRepo &&
        blueprint.config.github &&
        !options.dryRun
      ) {
        logger.info("Creating GitHub repository for skills repo");
        this.runStore.addLog(runId, {
          level: "info",
          message: "Creating GitHub repository",
        });

        if (options.githubToken) {
          this.githubIntegration.setUserToken(options.githubToken);
        }

        const repoResult = await this.githubIntegration.createRepository(
          blueprint.config.github,
          fs,
          "/output"
        );
        repoUrl = repoResult.url;

        this.runStore.addArtifact(runId, {
          name: "GitHub Repository (Skills Repo)",
          type: "repo",
          url: repoUrl,
        });
      }

      this.runStore.addArtifact(runId, {
        name: "Skills Repo Files",
        type: "report",
        content: JSON.stringify(manifest, null, 2),
      });

      this.runStore.complete(runId);

      return {
        success: true,
        files: manifest.files,
        envVars: dedupedEnvVars,
        scripts: allScripts,
        repoUrl,
        vol,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Skills repo generation failed", { error: message });
      this.runStore.fail(runId, message);
      throw error;
    }
  }
}
