'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlueprintStore } from '@/store/blueprint';
import { nodeTypeToLabel, nodeTypeToColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { X, Settings2, MousePointerClick, Trash2, Copy, Check, ChevronDown, Sparkles } from 'lucide-react';
import { AuthOverlay } from '@/components/auth/auth-guard';
import { useToast } from '@/components/ui/toaster';

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
import { QuicknodeForm } from './forms/quicknode-form';
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
import { PythOracleForm } from './forms/pyth-oracle-form';
import { ChainlinkPriceFeedForm } from './forms/chainlink-price-feed-form';
import { AaveLendingForm } from './forms/aave-lending-form';
import { CompoundLendingForm } from './forms/compound-lending-form';
import { UniswapSwapForm } from './forms/uniswap-swap-form';
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

// Robinhood Chain forms
import { RobinhoodNetworkForm } from './forms/robinhood-network-form';
import { RobinhoodDeploymentForm } from './forms/robinhood-deployment-form';
import { RobinhoodContractsForm } from './forms/robinhood-contracts-form';


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
import { OpenClawAgentForm } from './forms/openclaw-agent-form';
import { EigenAIAgentForm } from './forms/eigen-ai-agent-form';

// Logic & Automation (Web2) forms
import { IfElseForm } from './forms/if-else-form';
import { SwitchCaseForm } from './forms/switch-case-form';
import { HttpApiForm } from './forms/http-api-form';
import { EmailSmtpForm } from './forms/email-smtp-form';
import { DelayTimerForm } from './forms/delay-timer-form';
import { VariableStoreForm } from './forms/variable-store-form';
import { TransformForm } from './forms/transform-form';
import { LoopIteratorForm } from './forms/loop-iterator-form';
import { Web2FrontendScaffoldForm } from './forms/web2-frontend-scaffold-form';

/**
 * Collapsible AI Prompt section -- shared across ALL node types.
 * Lets users describe their intent for each block in free-text.
 */
function PromptSection({ nodeId, config }: { nodeId: string; config: Record<string, unknown> }) {
  const { updateNodeConfig } = useBlueprintStore();
  const [expanded, setExpanded] = useState(() => Boolean(config.prompt));
  const prompt = (config.prompt as string) ?? '';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeConfig(nodeId, { prompt: e.target.value });
    },
    [nodeId, updateNodeConfig],
  );

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-150',
          'border border-[hsl(var(--color-border-default))]',
          expanded
            ? 'bg-[hsl(var(--color-accent-primary)/0.06)] border-[hsl(var(--color-accent-primary)/0.25)]'
            : 'bg-[hsl(var(--color-bg-elevated))] hover:bg-[hsl(var(--color-bg-hover))]',
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-primary))]">AI Prompt</span>
          {!expanded && prompt && (
            <span className="text-xs text-[hsl(var(--color-text-muted))] truncate max-w-[140px]">
              — {prompt.slice(0, 40)}{prompt.length > 40 ? '…' : ''}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-[hsl(var(--color-text-muted))] transition-transform duration-150',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="mt-2">
          <textarea
            value={prompt}
            onChange={handleChange}
            maxLength={5000}
            rows={4}
            placeholder="Describe what you want for this component — e.g., 'The bridge UI should show a progress stepper with estimated time and support ETH + USDC'"
            className={cn(
              'w-full rounded-lg px-3 py-2.5 text-sm leading-relaxed resize-y',
              'bg-[hsl(var(--color-bg-base))] text-[hsl(var(--color-text-primary))]',
              'border border-[hsl(var(--color-border-default))]',
              'placeholder:text-[hsl(var(--color-text-muted)/0.6)]',
              'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-accent-primary)/0.5)] focus:border-[hsl(var(--color-accent-primary)/0.5)]',
              'transition-colors duration-150',
            )}
          />
          <p className="mt-1 text-[10px] text-[hsl(var(--color-text-muted))]">
            {prompt.length}/5000 — This prompt will be included in your generated skills repo for AI context.
          </p>
        </div>
      )}
    </div>
  );
}

export function ConfigPanel() {
  const { blueprint, selectedNodeId, selectNode, removeNode } = useBlueprintStore();
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const selectedNode = selectedNodeId
    ? blueprint.nodes.find(n => n.id === selectedNodeId)
    : null;

  if (!selectedNode) {
    return (
      <aside
        data-tour="config"
        className="h-full border-l border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-subtle))] flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-[hsl(var(--color-border-default))]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[hsl(var(--color-bg-elevated))]">
              <Settings2 className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
            </div>
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text-primary))] tracking-wide">Properties</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="relative mx-auto mb-4">
              <div className="absolute inset-0 bg-[hsl(var(--color-accent-secondary)/0.08)] blur-xl rounded-full" />
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--color-bg-elevated))] to-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))] flex items-center justify-center">
                <MousePointerClick className="w-7 h-7 text-[hsl(var(--color-text-muted))]" />
              </div>
            </div>
            <p className="text-sm font-medium text-[hsl(var(--color-text-primary))] mb-1">
              Select a Component
            </p>
            <p className="text-xs text-[hsl(var(--color-text-muted))] max-w-[180px] leading-relaxed">
              Click on any component to configure its properties and behavior
            </p>
          </motion.div>
        </div>
      </aside>
    );
  }

  const colorClass = nodeTypeToColor(selectedNode.type);

  return (
    <aside
      data-tour="config"
      className="h-full border-l border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-subtle))] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <motion.div
        className="p-4 border-b border-[hsl(var(--color-border-default))]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              'bg-[hsl(var(--color-accent-primary)/0.1)]',
              'border border-[hsl(var(--color-accent-primary)/0.2)]'
            )}>
              <Settings2 className="w-5 h-5 text-[hsl(var(--color-accent-primary))]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">
                {nodeTypeToLabel(selectedNode.type)}
              </h2>
              <p className="text-xs text-[hsl(var(--color-text-muted))] mt-0.5 font-mono">
                {selectedNode.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify(selectedNode.config, null, 2));
                setCopied(true);
                toast.success('Config copied', 'Node configuration copied to clipboard');
                setTimeout(() => setCopied(false), 2000);
              }}
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                "text-[hsl(var(--color-text-muted))]",
                "hover:bg-[hsl(var(--color-bg-hover))] hover:text-[hsl(var(--color-text-primary))]"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Copy config as JSON"
            >
              {copied ? <Check className="w-4 h-4 text-[hsl(var(--color-success))]" /> : <Copy className="w-4 h-4" />}
            </motion.button>
            <motion.button
              onClick={() => {
                removeNode(selectedNode.id);
                selectNode(null);
              }}
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                "text-[hsl(var(--color-text-muted))]",
                "hover:bg-[hsl(var(--color-error)/0.15)] hover:text-[hsl(var(--color-error))]"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Delete node"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => selectNode(null)}
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                "text-[hsl(var(--color-text-muted))]",
                "hover:bg-[hsl(var(--color-bg-hover))] hover:text-[hsl(var(--color-text-primary))]"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Color indicator bar - subtle */}
        <div className="h-0.5 rounded-full mt-4 bg-gradient-to-r from-[hsl(var(--color-accent-primary))] via-[hsl(var(--color-accent-primary)/0.5)] to-transparent" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          className="flex-1 overflow-y-auto p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          <AuthOverlay message="Connect wallet to configure properties">
            {/* AI Prompt - shared across all node types */}
            <PromptSection nodeId={selectedNode.id} config={selectedNode.config} />

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
            {(selectedNode.type as string) === 'quicknode' && (
              <QuicknodeForm nodeId={selectedNode.id} config={selectedNode.config} />
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
            {selectedNode.type === 'openclaw-agent' && (
              <OpenClawAgentForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string ) === 'eigen-ai-agent' && (
              <EigenAIAgentForm nodeId={selectedNode.id} config={selectedNode.config} />
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
            {(selectedNode.type as string) === 'pyth-oracle' && (
              <PythOracleForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string) === 'chainlink-price-feed' && (
              <ChainlinkPriceFeedForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string) === 'aave-lending' && (
              <AaveLendingForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string) === 'compound-lending' && (
              <CompoundLendingForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string) === 'uniswap-swap' && (
              <UniswapSwapForm nodeId={selectedNode.id} config={selectedNode.config} />
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

            {/* Robinhood Chain nodes */}
            {(selectedNode.type as string) === 'robinhood-network' && (
              <RobinhoodNetworkForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string) === 'robinhood-deployment' && (
              <RobinhoodDeploymentForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {(selectedNode.type as string) === 'robinhood-contracts' && (
              <RobinhoodContractsForm nodeId={selectedNode.id} config={selectedNode.config} />
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

            {/* Logic & Automation (Web2) nodes */}
            {selectedNode.type === 'if-else' && (
              <IfElseForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'switch-case' && (
              <SwitchCaseForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'http-api' && (
              <HttpApiForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'email-smtp' && (
              <EmailSmtpForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'delay-timer' && (
              <DelayTimerForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'variable-store' && (
              <VariableStoreForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'transform' && (
              <TransformForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'loop-iterator' && (
              <LoopIteratorForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
            {selectedNode.type === 'web2-frontend-scaffold' && (
              <Web2FrontendScaffoldForm nodeId={selectedNode.id} config={selectedNode.config} />
            )}
          </AuthOverlay>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
