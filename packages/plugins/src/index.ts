// Original plugins
export { StylusContractPlugin } from './stylus-contract';
export { StylusZKContractPlugin } from './stylus-zk-contract';
export { StylusRustContractPlugin } from './stylus-rust-contract';
export { SmartCacheCachingPlugin } from './smartcache-caching';
export { AuditwareAnalyzingPlugin } from './auditware-analyzing';
export { X402PaywallPlugin } from './x402-paywall-api';
export { ERC8004AgentPlugin } from './erc8004-agent-runtime';
export { OpenClawAgentPlugin } from './openclaw-agent';
export { EigenAIAgentPlugin } from './eigen-ai-agent';
export { RepoQualityGatesPlugin } from './repo-quality-gates';
export { FrontendScaffoldPlugin } from './frontend-scaffold';

// New Arbitrum-focused plugins
export { EIP7702SmartEOAPlugin } from './eip7702-smart-eoa';
export { WalletAuthPlugin } from './wallet-auth';
export { RPCProviderPlugin } from './rpc-provider';
export { QuicknodePlugin } from './quicknode';
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
export { PythOraclePlugin } from './pyth-oracle';
export { ChainlinkPriceFeedPlugin } from './chainlink-price-feed';
export { AaveLendingPlugin } from './aave-lending';
export { CompoundLendingPlugin } from './compound-lending';
export { UniswapSwapPlugin } from './uniswap-swap';
export {
  AIXBTMomentumPlugin,
  AIXBTSignalsPlugin,
  AIXBTIndigoPlugin,
  AIXBTObserverPlugin
} from './aixbt-intelligence';

// Superposition L3 plugins
export { SuperpositionNetworkPlugin } from './superposition-network';
export { SuperpositionBridgePlugin } from './superposition-bridge';
export { SuperpositionLongtailPlugin } from './superposition-longtail';
export { SuperpositionSuperAssetsPlugin } from './superposition-super-assets';
export { SuperpositionThirdwebPlugin } from './superposition-thirdweb';
export { SuperpositionUtilityMiningPlugin } from './superposition-utility-mining';
export { SuperpositionFaucetPlugin } from './superposition-faucet';
export { SuperpositionMeowDomainsPlugin } from './superposition-meow-domains';
// Robinhood Chain plugins
export { RobinhoodNetworkPlugin } from './robinhood-network';
export { RobinhoodDeploymentPlugin } from './robinhood-deployment';
export { RobinhoodContractsPlugin } from './robinhood-contracts';
// ERC-20/ERC-721/ERC-1155 Stylus plugins
export { ERC20StylusPlugin } from './erc20-stylus';
export { ERC721StylusPlugin } from './erc721-stylus';
export { ERC1155StylusPlugin } from './erc1155-stylus';

// Dune Analytics plugins
export {
  DuneExecuteSQLPlugin,
  DuneTokenPricePlugin,
  DuneWalletBalancesPlugin,
  DuneDEXVolumePlugin,
  DuneNFTFloorPlugin,
  DuneAddressLabelsPlugin,
  DuneTransactionHistoryPlugin,
  DuneGasPricePlugin,
  DuneProtocolTVLPlugin,
} from './dune-analytics';

// Logic & Automation (Web2) plugins
export { IfElsePlugin } from './if-else';
export { SwitchCasePlugin } from './switch-case';
export { HttpApiPlugin } from './http-api';
export { EmailSmtpPlugin } from './email-smtp';
export { DelayTimerPlugin } from './delay-timer';
export { VariableStorePlugin } from './variable-store';
export { TransformPlugin } from './transform';
export { LoopIteratorPlugin } from './loop-iterator';
export { Web2FrontendScaffoldPlugin } from './web2-frontend-scaffold';

import { StylusContractPlugin } from './stylus-contract';
import { StylusZKContractPlugin } from './stylus-zk-contract';
import { StylusRustContractPlugin } from './stylus-rust-contract';
import { SmartCacheCachingPlugin } from './smartcache-caching';
import { AuditwareAnalyzingPlugin } from './auditware-analyzing';
import { X402PaywallPlugin } from './x402-paywall-api';
import { ERC8004AgentPlugin } from './erc8004-agent-runtime';
import { OpenClawAgentPlugin } from './openclaw-agent';
import { EigenAIAgentPlugin } from './eigen-ai-agent';
import { RepoQualityGatesPlugin } from './repo-quality-gates';
import { FrontendScaffoldPlugin } from './frontend-scaffold';
import { EIP7702SmartEOAPlugin } from './eip7702-smart-eoa';
import { WalletAuthPlugin } from './wallet-auth';
import { RPCProviderPlugin } from './rpc-provider';
import { QuicknodePlugin } from './quicknode';
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
import { PythOraclePlugin } from './pyth-oracle';
import { ChainlinkPriceFeedPlugin } from './chainlink-price-feed';
import { AaveLendingPlugin } from './aave-lending';
import { CompoundLendingPlugin } from './compound-lending';
import { UniswapSwapPlugin } from './uniswap-swap';
import {
  AIXBTMomentumPlugin,
  AIXBTSignalsPlugin,
  AIXBTIndigoPlugin,
  AIXBTObserverPlugin
} from './aixbt-intelligence';

// Superposition L3 plugins
import { SuperpositionNetworkPlugin } from './superposition-network';
import { SuperpositionBridgePlugin } from './superposition-bridge';
import { SuperpositionLongtailPlugin } from './superposition-longtail';
import { SuperpositionSuperAssetsPlugin } from './superposition-super-assets';
import { SuperpositionThirdwebPlugin } from './superposition-thirdweb';
import { SuperpositionUtilityMiningPlugin } from './superposition-utility-mining';
import { SuperpositionFaucetPlugin } from './superposition-faucet';
import { SuperpositionMeowDomainsPlugin } from './superposition-meow-domains';
import { RobinhoodNetworkPlugin } from './robinhood-network';
import { RobinhoodDeploymentPlugin } from './robinhood-deployment';
import { RobinhoodContractsPlugin } from './robinhood-contracts';

// Dune Analytics plugins
import {
  DuneExecuteSQLPlugin,
  DuneTokenPricePlugin,
  DuneWalletBalancesPlugin,
  DuneDEXVolumePlugin,
  DuneNFTFloorPlugin,
  DuneAddressLabelsPlugin,
  DuneTransactionHistoryPlugin,
  DuneGasPricePlugin,
  DuneProtocolTVLPlugin,
} from './dune-analytics';

// Logic & Automation (Web2) plugins
import { IfElsePlugin } from './if-else';
import { SwitchCasePlugin } from './switch-case';
import { HttpApiPlugin } from './http-api';
import { EmailSmtpPlugin } from './email-smtp';
import { DelayTimerPlugin } from './delay-timer';
import { VariableStorePlugin } from './variable-store';
import { TransformPlugin } from './transform';
import { LoopIteratorPlugin } from './loop-iterator';
import { Web2FrontendScaffoldPlugin } from './web2-frontend-scaffold';

import { PluginRegistry, getDefaultRegistry } from '@dapp-forge/plugin-sdk';

/**
 * Register all official plugins with the default registry
 */
export function registerOfficialPlugins(registry?: PluginRegistry): void {
  const targetRegistry = registry ?? getDefaultRegistry();

  // Original plugins
  targetRegistry.register(new StylusContractPlugin());
  targetRegistry.register(new StylusZKContractPlugin());
  targetRegistry.register(new StylusRustContractPlugin());
  targetRegistry.register(new SmartCacheCachingPlugin());
  targetRegistry.register(new AuditwareAnalyzingPlugin());
  targetRegistry.register(new X402PaywallPlugin());
  targetRegistry.register(new ERC8004AgentPlugin());
  targetRegistry.register(new OpenClawAgentPlugin());
  targetRegistry.register(new EigenAIAgentPlugin());
  targetRegistry.register(new RepoQualityGatesPlugin());
  targetRegistry.register(new FrontendScaffoldPlugin());

  // New Arbitrum-focused plugins
  targetRegistry.register(new EIP7702SmartEOAPlugin());
  targetRegistry.register(new WalletAuthPlugin());
  targetRegistry.register(new RPCProviderPlugin());
  targetRegistry.register(new QuicknodePlugin());
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
  targetRegistry.register(new PythOraclePlugin());
  targetRegistry.register(new ChainlinkPriceFeedPlugin());
  targetRegistry.register(new AaveLendingPlugin());
  targetRegistry.register(new CompoundLendingPlugin());
  targetRegistry.register(new UniswapSwapPlugin());
  targetRegistry.register(new AIXBTMomentumPlugin());
  targetRegistry.register(new AIXBTSignalsPlugin());
  targetRegistry.register(new AIXBTIndigoPlugin());
  targetRegistry.register(new AIXBTObserverPlugin());

  // Superposition L3 plugins
  targetRegistry.register(new SuperpositionNetworkPlugin());
  targetRegistry.register(new SuperpositionBridgePlugin());
  targetRegistry.register(new SuperpositionLongtailPlugin());
  targetRegistry.register(new SuperpositionSuperAssetsPlugin());
  targetRegistry.register(new SuperpositionThirdwebPlugin());
  targetRegistry.register(new SuperpositionUtilityMiningPlugin());
  targetRegistry.register(new SuperpositionFaucetPlugin());
  targetRegistry.register(new SuperpositionMeowDomainsPlugin());
  targetRegistry.register(new RobinhoodNetworkPlugin());
  targetRegistry.register(new RobinhoodDeploymentPlugin());
  targetRegistry.register(new RobinhoodContractsPlugin());

  // Dune Analytics plugins
  targetRegistry.register(new DuneExecuteSQLPlugin());
  targetRegistry.register(new DuneTokenPricePlugin());
  targetRegistry.register(new DuneWalletBalancesPlugin());
  targetRegistry.register(new DuneDEXVolumePlugin());
  targetRegistry.register(new DuneNFTFloorPlugin());
  targetRegistry.register(new DuneAddressLabelsPlugin());
  targetRegistry.register(new DuneTransactionHistoryPlugin());
  targetRegistry.register(new DuneGasPricePlugin());
  targetRegistry.register(new DuneProtocolTVLPlugin());

  // Logic & Automation (Web2) plugins
  targetRegistry.register(new IfElsePlugin());
  targetRegistry.register(new SwitchCasePlugin());
  targetRegistry.register(new HttpApiPlugin());
  targetRegistry.register(new EmailSmtpPlugin());
  targetRegistry.register(new DelayTimerPlugin());
  targetRegistry.register(new VariableStorePlugin());
  targetRegistry.register(new TransformPlugin());
  targetRegistry.register(new LoopIteratorPlugin());
  targetRegistry.register(new Web2FrontendScaffoldPlugin());
}

/**
 * Get all official plugin instances
 */
export function getOfficialPlugins() {
  return [
    // Original plugins
    new StylusContractPlugin(),
    new StylusZKContractPlugin(),
    new StylusRustContractPlugin(),
    new SmartCacheCachingPlugin(),
    new AuditwareAnalyzingPlugin(),
    new X402PaywallPlugin(),
    new ERC8004AgentPlugin(),
    new OpenClawAgentPlugin(),
    new EigenAIAgentPlugin(),
    new RepoQualityGatesPlugin(),
    new FrontendScaffoldPlugin(),
    // New Arbitrum-focused plugins
    new EIP7702SmartEOAPlugin(),
    new WalletAuthPlugin(),
    new RPCProviderPlugin(),
    new QuicknodePlugin(),
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
    new PythOraclePlugin(),
    new ChainlinkPriceFeedPlugin(),
    new AaveLendingPlugin(),
    new CompoundLendingPlugin(),
    new UniswapSwapPlugin(),
    new AIXBTMomentumPlugin(),
    new AIXBTSignalsPlugin(),
    new AIXBTIndigoPlugin(),
    new AIXBTObserverPlugin(),
    // Superposition L3 plugins
    new SuperpositionNetworkPlugin(),
    new SuperpositionBridgePlugin(),
    new SuperpositionLongtailPlugin(),
    new SuperpositionSuperAssetsPlugin(),
    new SuperpositionThirdwebPlugin(),
    new SuperpositionUtilityMiningPlugin(),
    new SuperpositionFaucetPlugin(),
    new SuperpositionMeowDomainsPlugin(),
    new RobinhoodNetworkPlugin(),
    new RobinhoodDeploymentPlugin(),
    new RobinhoodContractsPlugin(),
    // Dune Analytics plugins
    new DuneExecuteSQLPlugin(),
    new DuneTokenPricePlugin(),
    new DuneWalletBalancesPlugin(),
    new DuneDEXVolumePlugin(),
    new DuneNFTFloorPlugin(),
    new DuneAddressLabelsPlugin(),
    new DuneTransactionHistoryPlugin(),
    new DuneGasPricePlugin(),
    new DuneProtocolTVLPlugin(),
    // Logic & Automation (Web2) plugins
    new IfElsePlugin(),
    new SwitchCasePlugin(),
    new HttpApiPlugin(),
    new EmailSmtpPlugin(),
    new DelayTimerPlugin(),
    new VariableStorePlugin(),
    new TransformPlugin(),
    new LoopIteratorPlugin(),
    new Web2FrontendScaffoldPlugin(),
  ];
}
