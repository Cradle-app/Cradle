/**
 * Simple template engine for code generation
 * Supports variable substitution, conditionals, and loops
 * 
 * Syntax:
 * - {{ variable }} - Variable substitution
 * - {{# if condition }}...{{/ if }} - Conditionals
 * - {{# each items as item }}...{{/ each }} - Loops
 * - {{# unless condition }}...{{/ unless }} - Negative conditionals
 */

export interface TemplateContext {
  [key: string]: unknown;
}

/**
 * Render a template with the given context
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  let result = template;

  // Process loops first (they may contain variables)
  result = processLoops(result, context);

  // Process conditionals
  result = processConditionals(result, context);

  // Process unless blocks
  result = processUnless(result, context);

  // Process variable substitution
  result = processVariables(result, context);

  return result;
}

/**
 * Process {{# each items as item }}...{{/ each }} loops
 */
function processLoops(template: string, context: TemplateContext): string {
  const loopRegex = /\{\{#\s*each\s+(\w+)\s+as\s+(\w+)\s*\}\}([\s\S]*?)\{\{\/\s*each\s*\}\}/g;

  return template.replace(loopRegex, (_match, arrayName, itemName, body) => {
    const array = getNestedValue(context, arrayName);
    
    if (!Array.isArray(array)) {
      return '';
    }

    return array.map((item, index) => {
      const itemContext: TemplateContext = {
        ...context,
        [itemName]: item,
        [`${itemName}Index`]: index,
        [`${itemName}First`]: index === 0,
        [`${itemName}Last`]: index === array.length - 1,
      };
      
      // Recursively process the body
      return renderTemplate(body, itemContext);
    }).join('');
  });
}

/**
 * Process {{# if condition }}...{{/ if }} conditionals
 */
function processConditionals(template: string, context: TemplateContext): string {
  // Handle if-else
  const ifElseRegex = /\{\{#\s*if\s+(\S+)\s*\}\}([\s\S]*?)\{\{\s*else\s*\}\}([\s\S]*?)\{\{\/\s*if\s*\}\}/g;
  template = template.replace(ifElseRegex, (_match, condition, ifBody, elseBody) => {
    const value = evaluateCondition(condition, context);
    return value ? renderTemplate(ifBody, context) : renderTemplate(elseBody, context);
  });

  // Handle simple if
  const ifRegex = /\{\{#\s*if\s+(\S+)\s*\}\}([\s\S]*?)\{\{\/\s*if\s*\}\}/g;
  return template.replace(ifRegex, (_match, condition, body) => {
    const value = evaluateCondition(condition, context);
    return value ? renderTemplate(body, context) : '';
  });
}

/**
 * Process {{# unless condition }}...{{/ unless }} blocks
 */
function processUnless(template: string, context: TemplateContext): string {
  const unlessRegex = /\{\{#\s*unless\s+(\S+)\s*\}\}([\s\S]*?)\{\{\/\s*unless\s*\}\}/g;
  
  return template.replace(unlessRegex, (_match, condition, body) => {
    const value = evaluateCondition(condition, context);
    return !value ? renderTemplate(body, context) : '';
  });
}

/**
 * Process {{ variable }} substitutions
 */
function processVariables(template: string, context: TemplateContext): string {
  const varRegex = /\{\{\s*(\S+?)\s*\}\}/g;
  
  return template.replace(varRegex, (_match, varPath) => {
    // Skip if it looks like an unprocessed block
    if (varPath.startsWith('#') || varPath.startsWith('/')) {
      return _match;
    }

    const value = getNestedValue(context, varPath);
    
    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  });
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: TemplateContext, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(condition: string, context: TemplateContext): boolean {
  // Handle negation
  if (condition.startsWith('!')) {
    return !evaluateCondition(condition.slice(1), context);
  }

  // Handle comparison operators
  const comparisonMatch = condition.match(/^(\S+)\s*(===?|!==?|>=?|<=?)\s*(\S+)$/);
  if (comparisonMatch) {
    const [, left, operator, right] = comparisonMatch;
    const leftValue = resolveValue(left, context);
    const rightValue = resolveValue(right, context);

    switch (operator) {
      case '==':
      case '===':
        return leftValue === rightValue;
      case '!=':
      case '!==':
        return leftValue !== rightValue;
      case '>':
        return Number(leftValue) > Number(rightValue);
      case '>=':
        return Number(leftValue) >= Number(rightValue);
      case '<':
        return Number(leftValue) < Number(rightValue);
      case '<=':
        return Number(leftValue) <= Number(rightValue);
    }
  }

  // Simple truthy check
  const value = getNestedValue(context, condition);
  return Boolean(value);
}

/**
 * Resolve a value (could be a literal or a variable reference)
 */
function resolveValue(value: string, context: TemplateContext): unknown {
  // Check if it's a string literal
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Check if it's a number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Check if it's a boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  // Otherwise, it's a variable reference
  return getNestedValue(context, value);
}

/**
 * Dedent a template string (remove leading whitespace based on first line)
 */
export function dedent(template: string): string {
  const lines = template.split('\n');
  
  // Find minimum indentation (ignoring empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length > 0) {
      const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
      minIndent = Math.min(minIndent, indent);
    }
  }

  if (minIndent === Infinity || minIndent === 0) {
    return template;
  }

  // Remove the minimum indentation from each line
  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
    .trim();
}

/**
 * Helper to create indented code blocks
 */
export function indent(code: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return code
    .split('\n')
    .map(line => line.length > 0 ? prefix + line : line)
    .join('\n');
}

