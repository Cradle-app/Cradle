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
export { TelegramNotificationsPlugin } from './telegram-notifications';
export { TelegramCommandsPlugin } from './telegram-commands';
export { TelegramWalletLinkPlugin } from './telegram-wallet-link';
export { TelegramAIAgentPlugin } from './telegram-ai-agent';
export { OstiumTradingPlugin } from './ostium-trading';
export { MaxxitLazyTradingPlugin } from './maxxit';
export { OnchainActivityPlugin } from './onchain-activity';
export {
  AIXBTMomentumPlugin,
  AIXBTSignalsPlugin,
  AIXBTIndigoPlugin,
  AIXBTObserverPlugin
} from './aixbt-intelligence';

// ERC-20/ERC-721/ERC-1155 Stylus plugins
export { ERC20StylusPlugin } from './erc20-stylus';
export { ERC721StylusPlugin } from './erc721-stylus';
export { ERC1155StylusPlugin } from './erc1155-stylus';

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
import { TelegramNotificationsPlugin } from './telegram-notifications';
import { TelegramCommandsPlugin } from './telegram-commands';
import { TelegramWalletLinkPlugin } from './telegram-wallet-link';
import { TelegramAIAgentPlugin } from './telegram-ai-agent';
import { OstiumTradingPlugin } from './ostium-trading';
import { ERC20StylusPlugin } from './erc20-stylus';
import { ERC721StylusPlugin } from './erc721-stylus';
import { ERC1155StylusPlugin } from './erc1155-stylus';
import { MaxxitLazyTradingPlugin } from './maxxit';
import { OnchainActivityPlugin } from './onchain-activity';
import {
  AIXBTMomentumPlugin,
  AIXBTSignalsPlugin,
  AIXBTIndigoPlugin,
  AIXBTObserverPlugin
} from './aixbt-intelligence';
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
  targetRegistry.register(new TelegramNotificationsPlugin());
  targetRegistry.register(new TelegramCommandsPlugin());
  targetRegistry.register(new TelegramWalletLinkPlugin());
  targetRegistry.register(new TelegramAIAgentPlugin());
  targetRegistry.register(new OstiumTradingPlugin());

  // ERC-20/ERC-721/ERC-1155 Stylus plugins
  targetRegistry.register(new ERC20StylusPlugin());
  targetRegistry.register(new ERC721StylusPlugin());
  targetRegistry.register(new ERC1155StylusPlugin());
  targetRegistry.register(new MaxxitLazyTradingPlugin());
  targetRegistry.register(new OnchainActivityPlugin());
  targetRegistry.register(new AIXBTMomentumPlugin());
  targetRegistry.register(new AIXBTSignalsPlugin());
  targetRegistry.register(new AIXBTIndigoPlugin());
  targetRegistry.register(new AIXBTObserverPlugin());
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
    new TelegramNotificationsPlugin(),
    new TelegramCommandsPlugin(),
    new TelegramWalletLinkPlugin(),
    new TelegramAIAgentPlugin(),
    new OstiumTradingPlugin(),
    // ERC-20/ERC-721/ERC-1155 Stylus plugins
    new ERC20StylusPlugin(),
    new ERC721StylusPlugin(),
    new ERC1155StylusPlugin(),
    new MaxxitLazyTradingPlugin(),
    new OnchainActivityPlugin(),
    new AIXBTMomentumPlugin(),
    new AIXBTSignalsPlugin(),
    new AIXBTIndigoPlugin(),
    new AIXBTObserverPlugin(),
  ];
}
