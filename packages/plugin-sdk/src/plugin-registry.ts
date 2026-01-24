import type { NodePlugin, PluginMetadata } from './plugin-interface';

/**
 * Registry for managing plugins
 * Only internal/signed plugins are allowed (no arbitrary user code)
 */
export class PluginRegistry {
  private plugins: Map<string, NodePlugin> = new Map();
  private allowedPluginIds: Set<string> = new Set();

  constructor(allowedPluginIds?: string[]) {
    if (allowedPluginIds) {
      this.allowedPluginIds = new Set(allowedPluginIds);
    }
  }

  /**
   * Register a plugin
   * @throws if plugin ID is not in the allowed list
   */
  register(plugin: NodePlugin): void {
    const { id } = plugin.metadata;

    // Security: Only allow pre-approved plugin IDs
    if (this.allowedPluginIds.size > 0 && !this.allowedPluginIds.has(id)) {
      throw new Error(`Plugin "${id}" is not in the allowed plugins list`);
    }

    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`);
    }

    this.plugins.set(id, plugin);
  }

  /**
   * Get a plugin by ID
   */
  get(id: string): NodePlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get a plugin or throw if not found
   */
  getOrThrow(id: string): NodePlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin "${id}" not found in registry`);
    }
    return plugin;
  }

  /**
   * Check if a plugin is registered
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all registered plugin IDs
   */
  getAllIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all plugin metadata
   */
  getAllMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(p => p.metadata);
  }

  /**
   * Get plugins by category
   */
  getByCategory(category: PluginMetadata['category']): NodePlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.metadata.category === category);
  }

  /**
   * Unregister a plugin (mainly for testing)
   */
  unregister(id: string): boolean {
    return this.plugins.delete(id);
  }

  /**
   * Clear all plugins (mainly for testing)
   */
  clear(): void {
    this.plugins.clear();
  }
}

/**
 * Default registry instance for the application
 */
let defaultRegistry: PluginRegistry | null = null;

/**
 * Get the default plugin registry
 */
export function getDefaultRegistry(): PluginRegistry {
  if (!defaultRegistry) {
    // Default allowed plugins - only our internal plugins
    defaultRegistry = new PluginRegistry([
      'stylus-contract',
      'stylus-zk-contract',
      'x402-paywall-api',
      'erc8004-agent-runtime',
      'repo-quality-gates',
      'frontend-scaffold',
      'sdk-generator',
      // New plugins
      'eip7702-smart-eoa',
      'wallet-auth',
      'rpc-provider',
      'arbitrum-bridge',
      'chain-data',
      'ipfs-storage',
      'chain-abstraction',
      'zk-primitives',
      'telegram-notifications',
      'telegram-commands',
      'telegram-wallet-link',
      'telegram-ai-agent',
      'ostium-trading',
      // Stylus workflow plugins
      'stylus-rust-contract',
      'smartcache-caching',
      'auditware-analyzing',
      // ERC-20/ERC-721 Stylus plugins
      'erc20-stylus',
      'erc721-stylus',
      'erc1155-stylus',
      'maxxit',
      'onchain-activity',
      "aixbt-momentum",
      "aixbt-signals",
      "aixbt-indigo",
      "aixbt-observer",
      "superposition-bridge",
      "superposition-network",
      "superposition-longtail",
      "superposition-super-assets",
      'superposition-thirdweb',
      'superposition-utility-mining',
      'superposition-faucet',
      'superposition-meow-domains',
      // Dune Analytics
      'dune-execute-sql',
      'dune-token-price',
      'dune-wallet-balances',
      'dune-dex-volume',
      'dune-nft-floor',
      'dune-address-labels',
      'dune-transaction-history',
      'dune-gas-price',
      'dune-protocol-tvl',
    ]);
  }
  return defaultRegistry;
}

/**
 * Set a custom default registry (for testing)
 */
export function setDefaultRegistry(registry: PluginRegistry): void {
  defaultRegistry = registry;
}

