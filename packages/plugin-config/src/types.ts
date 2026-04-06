/**
 * Plugin Category - the main grouping for plugins in the UI
 */
export type PluginCategory =
    | 'contracts'
    | 'payments'
    | 'agents'
    | 'app'
    | 'quality'
    | 'telegram'
    | 'intelligence'
    | 'superposition'
    | 'robinhood'
    | 'analytics'
    | 'protocols'
    | 'logic';

/**
 * Lucide icon names used in the UI
 */
export type PluginIcon =
    | 'Box'
    | 'CreditCard'
    | 'Bot'
    | 'Layout'
    | 'ShieldCheck'
    | 'Wallet'
    | 'Globe'
    | 'Database'
    | 'HardDrive'
    | 'Layers'
    | 'Lock'
    | 'Link'
    | 'ArrowLeftRight'
    | 'Key'
    | 'Sparkles'
    | 'TrendingUp'
    | 'Zap'
    | 'Coins'
    | 'Search'
    | 'GitBranch'
    | 'ListTree'
    | 'Mail'
    | 'Timer'
    | 'Variable'
    | 'Shuffle'
    | 'Repeat';

/**
 * Plugin compatibility relationships
 */
export interface PluginCompatibility {
    /** Plugins that work well together (shown in suggestions) */
    compatibleWith: string[];
    /** Soft recommendations - optional but useful */
    suggestedWith: string[];
    /** Hard dependencies - must be present for this plugin to work */
    requires: string[];
}

/**
 * Complete plugin UI definition
 * This is the single source of truth for all plugin metadata
 */
export interface PluginDefinition {
    /** Unique plugin identifier (matches plugin id) */
    id: string;
    /** Display name in the UI */
    name: string;
    /** Short description shown in palette */
    description: string;
    /** Lucide icon name */
    icon: PluginIcon;
    /** Optional logo asset filename for plugins with custom branding (e.g. 'Ostium.svg') */
    logoAsset?: string;
    /** CSS color class for theming */
    color: string;
    /** Category for grouping in palette */
    category: PluginCategory;
    /** Searchable tags */
    tags: string[];
    /** Compatibility relationships */
    compatibility: PluginCompatibility;
}

/**
 * Default configuration for a node when dropped on canvas
 */
export interface PluginDefaultConfig {
    [key: string]: unknown;
}

/**
 * Category UI definition for the palette
 */
export interface CategoryDefinition {
    id: PluginCategory;
    name: string;
    icon: PluginIcon;
    color: string;
}

/**
 * Complete plugin registry entry
 */
export interface PluginRegistryEntry extends PluginDefinition {
    /** Default configuration when node is created */
    defaultConfig: PluginDefaultConfig;
}
