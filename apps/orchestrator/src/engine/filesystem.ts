import type { IFs } from 'memfs';
import type { CodegenOutput, CodegenPatch, PatchOperation } from '@dapp-forge/blueprint-schema';
import * as path from 'path';

/**
 * Apply codegen output to the in-memory filesystem
 */
export function applyCodegenOutput(
  fs: IFs,
  basePath: string,
  output: CodegenOutput
): void {
  // Create files
  for (const file of output.files) {
    const fullPath = path.posix.join(basePath, file.path);
    const dir = path.posix.dirname(fullPath);

    // Create directory if needed
    fs.mkdirSync(dir, { recursive: true });

    // Write file content
    const content = file.encoding === 'base64'
      ? Buffer.from(file.content, 'base64')
      : file.content;

    fs.writeFileSync(fullPath, content);
  }

  // Apply patches
  for (const patch of output.patches) {
    const fullPath = path.posix.join(basePath, patch.path);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Cannot patch non-existent file: ${patch.path}`);
      continue;
    }

    let content = fs.readFileSync(fullPath, 'utf-8') as string;

    for (const operation of patch.operations) {
      content = applyPatchOperation(content, operation);
    }

    fs.writeFileSync(fullPath, content);
  }

  // Write documentation files
  for (const doc of output.docs) {
    const fullPath = path.posix.join(basePath, doc.path);
    const dir = path.posix.dirname(fullPath);

    fs.mkdirSync(dir, { recursive: true });

    const content = `# ${doc.title}\n\n${doc.content}`;
    fs.writeFileSync(fullPath, content);
  }
}

/**
 * Apply a single patch operation to content
 */
function applyPatchOperation(content: string, operation: PatchOperation): string {
  switch (operation.type) {
    case 'insert': {
      if (operation.position === 'start') {
        return operation.content + '\n' + content;
      } else if (operation.position === 'end') {
        return content + '\n' + operation.content;
      } else if ('after' in operation.position) {
        const marker = operation.position.after;
        const index = content.indexOf(marker);
        if (index === -1) return content;
        const insertPoint = index + marker.length;
        return content.slice(0, insertPoint) + '\n' + operation.content + content.slice(insertPoint);
      } else if ('before' in operation.position) {
        const marker = operation.position.before;
        const index = content.indexOf(marker);
        if (index === -1) return content;
        return content.slice(0, index) + operation.content + '\n' + content.slice(index);
      }
      return content;
    }
    case 'replace': {
      if (operation.all) {
        return content.replaceAll(operation.search, operation.replace);
      }
      return content.replace(operation.search, operation.replace);
    }
    case 'delete': {
      return content.replace(operation.search, '');
    }
    default:
      return content;
  }
}

/**
 * Run format and lint on generated code
 * In a real implementation, this would spawn external tools
 */
export async function formatAndLint(
  fs: IFs,
  basePath: string
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // Walk through all TypeScript/JavaScript files
  const files = walkDirectory(fs, basePath);

  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      // Basic validation - check for common issues
      const content = fs.readFileSync(file, 'utf-8') as string;

      // Check for console.log in production code
      if (content.includes('console.log') && !file.includes('test')) {
        warnings.push(`${file}: contains console.log statements`);
      }

      // Check for TODO comments
      if (content.includes('TODO')) {
        warnings.push(`${file}: contains TODO comments`);
      }
    }
  }

  return {
    success: true,
    warnings,
  };
}

/**
 * Walk a directory recursively and return all file paths
 */
function walkDirectory(fs: IFs, dir: string): string[] {
  const results: string[] = [];

  try {
    const items = fs.readdirSync(dir) as string[];

    for (const item of items) {
      const fullPath = path.posix.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...walkDirectory(fs, fullPath));
      } else {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist
  }

  return results;
}

/**
 * Create a manifest of all generated files
 */
export function createManifest(
  fs: IFs,
  basePath: string
): { files: Array<{ path: string; size: number }> } {
  const files = walkDirectory(fs, basePath).map(fullPath => {
    const stat = fs.statSync(fullPath);
    const relativePath = path.posix.relative(basePath, fullPath);

    return {
      path: relativePath,
      size: stat.size as number,
    };
  });

  return { files };
}

/**
 * Export filesystem to a real directory
 * Used when not using GitHub integration
 */
export async function exportToDirectory(
  fs: IFs,
  sourcePath: string,
  targetPath: string,
  realFs: typeof import('fs')
): Promise<void> {
  const files = walkDirectory(fs, sourcePath);

  for (const file of files) {
    const relativePath = path.posix.relative(sourcePath, file);
    const targetFile = path.join(targetPath, relativePath.replace(/\//g, path.sep));
    const targetDir = path.dirname(targetFile);

    // Create target directory
    realFs.mkdirSync(targetDir, { recursive: true });

    // Copy file
    const content = fs.readFileSync(file);
    realFs.writeFileSync(targetFile, content);
  }
}

