// Original plugins
export { StylusContractPlugin } from './stylus-contract';
export { StylusZKContractPlugin } from './stylus-zk-contract';
export { X402PaywallPlugin } from './x402-paywall-api';
export { ERC8004AgentPlugin } from './erc8004-agent-runtime';
export { RepoQualityGatesPlugin } from './repo-quality-gates';

// New Arbitrum-focused plugins
export { EIP7702SmartEOAPlugin } from './eip7702-smart-eoa';
export { WalletAuthPlugin } from './wallet-auth';
export { RPCProviderPlugin } from './rpc-provider';
export { ArbitrumBridgePlugin } from './arbitrum-bridge';
export { ChainDataPlugin } from './chain-data';
export { IPFSStoragePlugin } from './ipfs-storage';
export { ChainAbstractionPlugin } from './chain-abstraction';
export { ZKPrimitivesPlugin } from './zk-primitives';
export { OstiumTradingPlugin } from './ostium-trading';

import { StylusContractPlugin } from './stylus-contract';
import { StylusZKContractPlugin } from './stylus-zk-contract';
import { X402PaywallPlugin } from './x402-paywall-api';
import { ERC8004AgentPlugin } from './erc8004-agent-runtime';
import { RepoQualityGatesPlugin } from './repo-quality-gates';
import { EIP7702SmartEOAPlugin } from './eip7702-smart-eoa';
import { WalletAuthPlugin } from './wallet-auth';
import { RPCProviderPlugin } from './rpc-provider';
import { ArbitrumBridgePlugin } from './arbitrum-bridge';
import { ChainDataPlugin } from './chain-data';
import { IPFSStoragePlugin } from './ipfs-storage';
import { ChainAbstractionPlugin } from './chain-abstraction';
import { ZKPrimitivesPlugin } from './zk-primitives';
import { OstiumTradingPlugin } from './ostium-trading';
import { PluginRegistry, getDefaultRegistry } from '@dapp-forge/plugin-sdk';

/**
 * Register all official plugins with the default registry
 */
export function registerOfficialPlugins(registry?: PluginRegistry): void {
  const targetRegistry = registry ?? getDefaultRegistry();

  // Original plugins
  targetRegistry.register(new StylusContractPlugin());
  targetRegistry.register(new StylusZKContractPlugin());
  targetRegistry.register(new X402PaywallPlugin());
  targetRegistry.register(new ERC8004AgentPlugin());
  targetRegistry.register(new RepoQualityGatesPlugin());

  // New Arbitrum-focused plugins
  targetRegistry.register(new EIP7702SmartEOAPlugin());
  targetRegistry.register(new WalletAuthPlugin());
  targetRegistry.register(new RPCProviderPlugin());
  targetRegistry.register(new ArbitrumBridgePlugin());
  targetRegistry.register(new ChainDataPlugin());
  targetRegistry.register(new IPFSStoragePlugin());
  targetRegistry.register(new ChainAbstractionPlugin());
  targetRegistry.register(new ZKPrimitivesPlugin());
  targetRegistry.register(new OstiumTradingPlugin());
}

/**
 * Get all official plugin instances
 */
export function getOfficialPlugins() {
  return [
    // Original plugins
    new StylusContractPlugin(),
    new StylusZKContractPlugin(),
    new X402PaywallPlugin(),
    new ERC8004AgentPlugin(),
    new RepoQualityGatesPlugin(),
    // New Arbitrum-focused plugins
    new EIP7702SmartEOAPlugin(),
    new WalletAuthPlugin(),
    new RPCProviderPlugin(),
    new ArbitrumBridgePlugin(),
    new ChainDataPlugin(),
    new IPFSStoragePlugin(),
    new ChainAbstractionPlugin(),
    new ZKPrimitivesPlugin(),
    new OstiumTradingPlugin(),
  ];
}
