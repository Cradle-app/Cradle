import type { CodegenFile, CodegenPatch, PatchOperation } from '@dapp-forge/blueprint-schema';

/**
 * Builder pattern for creating files with proper structure
 */
export class FileBuilder {
  private files: CodegenFile[] = [];
  private patches: CodegenPatch[] = [];

  /**
   * Add a file to the output
   */
  addFile(path: string, content: string, encoding?: 'utf-8' | 'base64'): this {
    this.files.push({ path, content, encoding });
    return this;
  }

  /**
   * Add a JSON file (auto-stringifies the content)
   */
  addJsonFile(path: string, content: Record<string, unknown>): this {
    this.files.push({
      path,
      content: JSON.stringify(content, null, 2),
    });
    return this;
  }

  /**
   * Add a patch for an existing file
   */
  addPatch(path: string, operations: PatchOperation[]): this {
    this.patches.push({ path, operations });
    return this;
  }

  /**
   * Add an insert patch operation
   */
  insertInFile(
    path: string,
    position: 'start' | 'end' | { after: string } | { before: string },
    content: string
  ): this {
    const existingPatch = this.patches.find(p => p.path === path);
    const operation: PatchOperation = { type: 'insert', position, content };
    
    if (existingPatch) {
      existingPatch.operations.push(operation);
    } else {
      this.patches.push({ path, operations: [operation] });
    }
    
    return this;
  }

  /**
   * Add a replace patch operation
   */
  replaceInFile(path: string, search: string, replace: string, all = false): this {
    const existingPatch = this.patches.find(p => p.path === path);
    const operation: PatchOperation = { type: 'replace', search, replace, all };
    
    if (existingPatch) {
      existingPatch.operations.push(operation);
    } else {
      this.patches.push({ path, operations: [operation] });
    }
    
    return this;
  }

  /**
   * Get all built files
   */
  getFiles(): CodegenFile[] {
    return this.files;
  }

  /**
   * Get all patches
   */
  getPatches(): CodegenPatch[] {
    return this.patches;
  }

  /**
   * Clear all files and patches
   */
  clear(): this {
    this.files = [];
    this.patches = [];
    return this;
  }
}

/**
 * Builder for TypeScript/JavaScript files
 */
export class TypeScriptFileBuilder {
  private imports: Map<string, Set<string>> = new Map();
  private typeImports: Map<string, Set<string>> = new Map();
  private exports: string[] = [];
  private content: string[] = [];
  private topComments: string[] = [];

  /**
   * Add a top-level comment
   */
  addComment(comment: string): this {
    this.topComments.push(comment);
    return this;
  }

  /**
   * Add an import statement
   */
  addImport(from: string, ...names: string[]): this {
    if (!this.imports.has(from)) {
      this.imports.set(from, new Set());
    }
    for (const name of names) {
      this.imports.get(from)!.add(name);
    }
    return this;
  }

  /**
   * Add a type import statement
   */
  addTypeImport(from: string, ...names: string[]): this {
    if (!this.typeImports.has(from)) {
      this.typeImports.set(from, new Set());
    }
    for (const name of names) {
      this.typeImports.get(from)!.add(name);
    }
    return this;
  }

  /**
   * Add content to the file
   */
  addContent(content: string): this {
    this.content.push(content);
    return this;
  }

  /**
   * Add an export statement
   */
  addExport(exportStatement: string): this {
    this.exports.push(exportStatement);
    return this;
  }

  /**
   * Build the final file content
   */
  build(): string {
    const parts: string[] = [];

    // Add top comments
    if (this.topComments.length > 0) {
      parts.push(this.topComments.map(c => `// ${c}`).join('\n'));
      parts.push('');
    }

    // Add type imports
    for (const [from, names] of this.typeImports) {
      const sortedNames = Array.from(names).sort();
      parts.push(`import type { ${sortedNames.join(', ')} } from '${from}';`);
    }

    // Add regular imports
    for (const [from, names] of this.imports) {
      const sortedNames = Array.from(names).sort();
      parts.push(`import { ${sortedNames.join(', ')} } from '${from}';`);
    }

    if (this.imports.size > 0 || this.typeImports.size > 0) {
      parts.push('');
    }

    // Add content
    parts.push(...this.content);

    // Add exports
    if (this.exports.length > 0) {
      parts.push('');
      parts.push(...this.exports);
    }

    return parts.join('\n');
  }
}

/**
 * Builder for Rust files (Stylus contracts)
 */
export class RustFileBuilder {
  private uses: Set<string> = new Set();
  private attributes: string[] = [];
  private content: string[] = [];
  private topComments: string[] = [];

  /**
   * Add a top comment
   */
  addComment(comment: string): this {
    this.topComments.push(comment);
    return this;
  }

  /**
   * Add a use statement
   */
  addUse(path: string): this {
    this.uses.add(path);
    return this;
  }

  /**
   * Add a crate-level attribute
   */
  addAttribute(attr: string): this {
    this.attributes.push(attr);
    return this;
  }

  /**
   * Add content to the file
   */
  addContent(content: string): this {
    this.content.push(content);
    return this;
  }

  /**
   * Build the final file content
   */
  build(): string {
    const parts: string[] = [];

    // Add top comments
    if (this.topComments.length > 0) {
      parts.push(this.topComments.map(c => `// ${c}`).join('\n'));
      parts.push('');
    }

    // Add attributes
    if (this.attributes.length > 0) {
      parts.push(...this.attributes.map(a => `#![${a}]`));
      parts.push('');
    }

    // Add use statements
    if (this.uses.size > 0) {
      const sortedUses = Array.from(this.uses).sort();
      parts.push(...sortedUses.map(u => `use ${u};`));
      parts.push('');
    }

    // Add content
    parts.push(...this.content);

    return parts.join('\n');
  }
}

/**
 * Builder for package.json files
 */
export class PackageJsonBuilder {
  private pkg: Record<string, unknown> = {};

  constructor(name: string, version = '0.1.0') {
    this.pkg = {
      name,
      version,
      private: true,
    };
  }

  /**
   * Set a field value
   */
  set(key: string, value: unknown): this {
    this.pkg[key] = value;
    return this;
  }

  /**
   * Add a dependency
   */
  addDependency(name: string, version: string): this {
    if (!this.pkg.dependencies) {
      this.pkg.dependencies = {};
    }
    (this.pkg.dependencies as Record<string, string>)[name] = version;
    return this;
  }

  /**
   * Add a dev dependency
   */
  addDevDependency(name: string, version: string): this {
    if (!this.pkg.devDependencies) {
      this.pkg.devDependencies = {};
    }
    (this.pkg.devDependencies as Record<string, string>)[name] = version;
    return this;
  }

  /**
   * Add a script
   */
  addScript(name: string, command: string): this {
    if (!this.pkg.scripts) {
      this.pkg.scripts = {};
    }
    (this.pkg.scripts as Record<string, string>)[name] = command;
    return this;
  }

  /**
   * Build the final JSON string
   */
  build(): string {
    return JSON.stringify(this.pkg, null, 2);
  }

  /**
   * Get the raw object
   */
  toObject(): Record<string, unknown> {
    return { ...this.pkg };
  }
}

