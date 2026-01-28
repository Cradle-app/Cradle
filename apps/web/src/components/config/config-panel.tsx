'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBlueprintStore } from '@/store/blueprint';
import { nodeTypeToLabel, nodeTypeToColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { X, Settings2, MousePointerClick } from 'lucide-react';
import { AuthOverlay } from '@/components/auth/auth-guard';

// Original forms
import { StylusContractForm } from './forms/stylus-contract-form';
import { StylusZKContractForm } from './forms/stylus-zk-contract-form';
import { X402PaywallForm } from './forms/x402-paywall-form';
import { ERC8004AgentForm } from './forms/erc8004-agent-form';
import { QualityGatesForm } from './forms/quality-gates-form';
import { FrontendScaffoldForm } from './forms/frontend-scaffold-form';

// New Arbitrum-focused forms
import { EIP7702Form } from './forms/eip7702-form';
import { WalletAuthForm } from './forms/wallet-auth-form';
import { RPCProviderForm } from './forms/rpc-provider-form';
import { ArbitrumBridgeForm } from './forms/arbitrum-bridge-form';
import { ChainDataForm } from './forms/chain-data-form';
import { IPFSStorageForm } from './forms/ipfs-storage-form';
import { ChainAbstractionForm } from './forms/chain-abstraction-form';
import { ZKPrimitivesForm } from './forms/zk-primitives-form';
import { TelegramNotificationsForm } from './forms/telegram-notifications-form';
import { TelegramCommandsForm } from './forms/telegram-commands-form';
import { TelegramWalletLinkForm } from './forms/telegram-wallet-link-form';
import { TelegramAIAgentForm } from './forms/telegram-ai-agent-form';
import { OstiumTradingForm } from './forms/ostium-trading-form';
import { OnchainActivityForm } from './forms/onchain-activity-form';
import { AIXBTForm } from './forms/aixbt-form';
import { MaxxitLazyTradingForm } from './forms/maxxit-lazy-trading-form';

// Superposition L3 forms
import { SuperpositionNetworkForm } from './forms/superposition-network-form';
import { SuperpositionBridgeForm } from './forms/superposition-bridge-form';
import { SuperpositionLongtailForm } from './forms/superposition-longtail-form';
import { SuperpositionSuperAssetsForm } from './forms/superposition-super-assets-form';
import { SuperpositionThirdwebForm } from './forms/superposition-thirdweb-form';
import { SuperpositionUtilityMiningForm } from './forms/superposition-utility-mining-form';
import { SuperpositionFaucetForm } from './forms/superposition-faucet-form';
import { SuperpositionMeowDomainsForm } from './forms/superposition-meow-domains-form';


// ERC-20/ERC-721/ERC-1155 Stylus forms
import { ERC20StylusForm } from './forms/erc20-stylus-form';
import { ERC721StylusForm } from './forms/erc721-stylus-form';
import { ERC1155StylusForm } from './forms/erc1155-stylus-form';

// Dune Analytics form
import { DuneAnalyticsForm } from './forms/dune-analytics-form';
// Stylus workflow forms
import { StylusRustContractForm } from './forms/stylus-rust-contract-form';
import { SmartCacheCachingForm } from './forms/smartcache-caching-form';
import { AuditwareAnalyzingForm } from './forms/auditware-analyzing-form';

export function ConfigPanel() {
  const { blueprint, selectedNodeId, selectNode } = useBlueprintStore();

  const selectedNode = selectedNodeId
    ? blueprint.nodes.find(n => n.id === selectedNodeId)
    : null;

  if (!selectedNode) {
    return (
      <aside className="h-full border-l border-forge-border/50 bg-gradient-to-b from-forge-surface/80 to-forge-bg/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-forge-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-forge-elevated/50">
              <Settings2 className="w-4 h-4 text-forge-muted" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-wide">Properties</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mx-auto mb-4">
              <div className="absolute inset-0 bg-accent-purple/10 blur-xl rounded-full" />
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-forge-elevated to-forge-bg border border-forge-border/50 flex items-center justify-center">
                <MousePointerClick className="w-7 h-7 text-forge-muted" />
              </div>
            </div>
            <p className="text-sm font-medium text-forge-text mb-1">
              Select a Component
            </p>
            <p className="text-xs text-forge-muted max-w-[180px] leading-relaxed">
              Click on any component to configure its properties and behavior
            </p>
          </motion.div>
        </div>
      </aside>
    );
  }

  const colorClass = nodeTypeToColor(selectedNode.type);

  return (
    <aside className="h-full border-l border-forge-border/50 bg-gradient-to-b from-forge-surface/80 to-forge-bg/50 flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        className="p-4 border-b border-forge-border/50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              'bg-gradient-to-br',
              `from-${colorClass}/20 to-${colorClass}/5`,
              'border border-' + colorClass + '/20'
            )}>
              <Settings2 className={cn('w-5 h-5', `text-${colorClass}`)} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {nodeTypeToLabel(selectedNode.type)}
              </h2>
              <p className="text-xs text-forge-muted mt-0.5 font-mono">
                {selectedNode.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => selectNode(null)}
            className="p-2 rounded-lg hover:bg-forge-elevated/50 text-forge-muted hover:text-white transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Color indicator bar */}
        <div className={cn(
          'h-1 rounded-full mt-4',
          `bg-gradient-to-r from-${colorClass} to-${colorClass}/30`
        )} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          className="flex-1 overflow-y-auto p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <AuthOverlay message="Connect wallet to configure properties">
            {/* Original nodes */}
            {selectedNode.type === 'stylus-contract' && (
              <StylusContractForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'stylus-zk-contract' && (
              <StylusZKContractForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'x402-paywall-api' && (
              <X402PaywallForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'erc8004-agent-runtime' && (
              <ERC8004AgentForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'repo-quality-gates' && (
              <QualityGatesForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'frontend-scaffold' && (
              <FrontendScaffoldForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}

            {/* New Arbitrum-focused nodes */}
            {selectedNode.type === 'eip7702-smart-eoa' && (
              <EIP7702Form nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'wallet-auth' && (
              <WalletAuthForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'rpc-provider' && (
              <RPCProviderForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'arbitrum-bridge' && (
              <ArbitrumBridgeForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'chain-data' && (
              <ChainDataForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'ipfs-storage' && (
              <IPFSStorageForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'chain-abstraction' && (
              <ChainAbstractionForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'zk-primitives' && (
              <ZKPrimitivesForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}

            {/* Telegram nodes */}
            {selectedNode.type === 'telegram-notifications' && (
              <TelegramNotificationsForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'telegram-commands' && (
              <TelegramCommandsForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'telegram-wallet-link' && (
              <TelegramWalletLinkForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'telegram-ai-agent' && (
              <TelegramAIAgentForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'ostium-trading' && (
              <OstiumTradingForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}

            {/* ERC-20/ERC-721/ERC-1155 Stylus nodes */}
            {selectedNode.type === 'erc20-stylus' && (
              <ERC20StylusForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'erc721-stylus' && (
              <ERC721StylusForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'erc1155-stylus' && (
              <ERC1155StylusForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'onchain-activity' && (
              <OnchainActivityForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'maxxit' && (
              <MaxxitLazyTradingForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}

            {/* Stylus workflow nodes */}
            {selectedNode.type === 'stylus-rust-contract' && (
              <StylusRustContractForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'smartcache-caching' && (
              <SmartCacheCachingForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'auditware-analyzing' && (
              <AuditwareAnalyzingForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}

            {/* AIXBT nodes */}
            {(selectedNode.type === 'aixbt-momentum' ||
              selectedNode.type === 'aixbt-signals' ||
              selectedNode.type === 'aixbt-indigo' ||
              selectedNode.type === 'aixbt-observer') && (
                <AIXBTForm nodeId={selectedNode.id} type={selectedNode.type} config={selectedNode.config} />
              )}

            {/* Superposition L3 nodes */}
            {selectedNode.type === 'superposition-network' && (
              <SuperpositionNetworkForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-bridge' && (
              <SuperpositionBridgeForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-longtail' && (
              <SuperpositionLongtailForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-super-assets' && (
              <SuperpositionSuperAssetsForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-thirdweb' && (
              <SuperpositionThirdwebForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-utility-mining' && (
              <SuperpositionUtilityMiningForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-faucet' && (
              <SuperpositionFaucetForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'superposition-meow-domains' && (
              <SuperpositionMeowDomainsForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}

            {/* Dune Analytics nodes */}
            {(selectedNode.type === 'dune-execute-sql' ||
              selectedNode.type === 'dune-token-price' ||
              selectedNode.type === 'dune-wallet-balances' ||
              selectedNode.type === 'dune-dex-volume' ||
              selectedNode.type === 'dune-nft-floor' ||
              selectedNode.type === 'dune-address-labels' ||
              selectedNode.type === 'dune-transaction-history' ||
              selectedNode.type === 'dune-gas-price' ||
              selectedNode.type === 'dune-protocol-tvl') && (
                <DuneAnalyticsForm nodeId={selectedNode.id} type={selectedNode.type} config={selectedNode.config} />
              )}
          </AuthOverlay>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
