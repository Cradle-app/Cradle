'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Settings,
  Zap,
  ArrowRight,
  Send,
  Coins,
} from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { WalletDependencyNotice } from '@/components/config/wallet-dependency-notice';
import { OstiumDependencyNotice } from '@/components/config/ostium-dependency-notice';
import { useLazyTraderSetup, type TradingPreferences, type SetupStep, type CreateAgentResponse } from '@cradle/maxxit-lazy-trader';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const STEP_LABELS: Record<SetupStep, string> = {
  idle: 'Get Started',
  agent: 'Agent Generated',
  'telegram-link': 'Link Generated',
  'telegram-connect': 'Waiting for Telegram',
  'create-agent': 'Configure Preferences',
  complete: 'Setup Complete',
};

function PreferenceSlider({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-forge-muted">{label}</span>
        <span className="text-xs font-mono text-accent-cyan">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={0}
        max={100}
        step={1}
        className="w-full h-2 bg-forge-border rounded-lg appearance-none cursor-pointer accent-accent-cyan"
      />
      <p className="text-[10px] text-forge-muted/70">{description}</p>
    </div>
  );
}

function SendEthSection({ agentAddress }: { agentAddress: string }) {
  const [ethAmount, setEthAmount] = useState('0.001');
  const { isConnected } = useAccount();

  const { data: hash, isPending, sendTransaction } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSend = () => {
    if (!ethAmount || !agentAddress) return;
    try {
      const value = parseEther(ethAmount);
      sendTransaction({
        to: agentAddress as Address,
        value,
      });
    } catch (err) {
      console.error('Invalid ETH amount:', err);
    }
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
      <div className="flex items-center gap-2 mb-2">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-white">Fund Agent</span>
      </div>
      <p className="text-xs text-forge-muted mb-3">
        Send ETH to your agent address for gas fees.
      </p>

      <div className="flex gap-2">
        <Input
          type="number"
          step="0.001"
          min="0"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          placeholder="0.001"
          className="text-xs h-8 font-mono flex-1"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!isConnected || isPending || isConfirming || !ethAmount}
          className="h-8 px-3 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isConfirming ? (
            'Confirming...'
          ) : (
            <>
              <Send className="w-3 h-3 mr-1" />
              Send
            </>
          )}
        </Button>
      </div>

      {isSuccess && hash && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Sent!</span>
          <a
            href={`https://arbiscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-accent-cyan hover:underline flex items-center gap-0.5"
          >
            View tx <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </div>
  );
}

export function MaxxitLazyTradingForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const { address: userAddress, isConnected } = useAccount();

  const setup = useLazyTraderSetup({
    userWallet: userAddress,
    onComplete: (response: CreateAgentResponse) => {
      updateNodeConfig(nodeId, {
        ...config,
        agentId: response.agent?.id,
        agentName: response.agent?.name,
        agentVenue: response.agent?.venue,
        deploymentId: response.deployment?.id,
        deploymentStatus: response.deployment?.status,
        ostiumAgentAddress: response.ostiumAgentAddress,
        setupComplete: true,
      });
    },
  });

  useEffect(() => {
    if (setup.agentAddress && setup.agentAddress !== config.ostiumAgentAddress) {
      updateNodeConfig(nodeId, { ...config, ostiumAgentAddress: setup.agentAddress });
    }
  }, [setup.agentAddress, config, nodeId, updateNodeConfig]);

  useEffect(() => {
    if (setup.telegramUser && setup.telegramUser.id !== config.telegramUserId) {
      updateNodeConfig(nodeId, {
        ...config,
        telegramUserId: setup.telegramUser.id,
        telegramUsername: setup.telegramUser.telegram_username,
        telegramLinked: true,
      });
    }
  }, [setup.telegramUser, config, nodeId, updateNodeConfig]);

  useEffect(() => {
    const currentStatus = setup.currentStep === 'complete'
      ? 'LINKED'
      : setup.telegramUser
        ? 'CONNECTED'
        : 'NOT_LINKED';

    if (currentStatus !== config.linkedStatus) {
      updateNodeConfig(nodeId, { ...config, linkedStatus: currentStatus });
    }
  }, [setup.currentStep, setup.telegramUser, config, nodeId, updateNodeConfig]);

  const handlePreferenceChange = (key: keyof TradingPreferences, value: number) => {
    setup.setTradingPreferences({ ...setup.tradingPreferences, [key]: value });
  };

  const isComplete = setup.currentStep === 'complete';

  return (
    <div className="space-y-4">
      <WalletDependencyNotice nodeId={nodeId} />

      <div
        className={cn(
          'p-3 rounded-lg border',
          isComplete ? 'border-green-500/30 bg-green-500/5' : 'border-forge-border/50 bg-forge-bg/50'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className={cn('w-4 h-4', isComplete ? 'text-green-400' : 'text-accent-cyan')} />
          <span className="text-sm font-medium text-white">Lazy Trading Setup</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-medium ml-auto',
              isComplete ? 'bg-green-500/20 text-green-400' : 'bg-accent-cyan/20 text-accent-cyan'
            )}
          >
            {STEP_LABELS[setup.currentStep]}
          </span>
        </div>
        <p className="text-xs text-forge-muted">
          {isComplete
            ? 'Your Lazy Trader agent is active. Send trading signals via Telegram.'
            : 'Connect your Telegram account to enable automated trading signals.'}
        </p>
      </div>

      {isComplete && (
        <OstiumDependencyNotice nodeId={nodeId} agentAddress={setup.agentAddress} />
      )}

      {isComplete && setup.agentAddress && (
        <SendEthSection agentAddress={setup.agentAddress} />
      )}

      {setup.error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{setup.error}</span>
            <button
              onClick={setup.clearError}
              className="ml-auto text-[10px] underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'p-3 rounded-lg border transition-all',
          setup.agentAddress
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-forge-border/50 bg-forge-bg/50'
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
              setup.agentAddress
                ? 'border-green-500 bg-green-500/10'
                : 'border-forge-border bg-forge-bg'
            )}
          >
            {setup.agentAddress ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : setup.isGeneratingAgent ? (
              <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
            ) : (
              <span className="text-xs font-bold text-forge-muted">1</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-white">Generate Agent</p>
              {setup.agentAddress ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                  {setup.isAgentNew ? 'New' : 'Existing'}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={setup.generateAgent}
                  disabled={!isConnected || setup.isGeneratingAgent}
                  className="h-6 px-2 text-xs bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30"
                >
                  {setup.isGeneratingAgent ? 'Generating...' : 'Generate'}
                </Button>
              )}
            </div>
            <p className="text-xs text-forge-muted">
              {setup.agentAddress
                ? `Agent: ${setup.agentAddress.slice(0, 8)}...${setup.agentAddress.slice(-6)}`
                : 'Create your Ostium trading agent address.'}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'p-3 rounded-lg border transition-all',
          setup.linkCode || setup.alreadyLinked
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-forge-border/50 bg-forge-bg/50',
          !setup.agentAddress && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
              setup.linkCode || setup.alreadyLinked
                ? 'border-green-500 bg-green-500/10'
                : 'border-forge-border bg-forge-bg'
            )}
          >
            {setup.linkCode || setup.alreadyLinked ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : setup.isGeneratingLink ? (
              <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
            ) : (
              <span className="text-xs font-bold text-forge-muted">2</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-white">Link Telegram</p>
              {setup.alreadyLinked ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                  Already Linked
                </span>
              ) : setup.linkCode ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                  Ready
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={setup.generateLink}
                  disabled={!setup.agentAddress || setup.isGeneratingLink}
                  className="h-6 px-2 text-xs bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30"
                >
                  {setup.isGeneratingLink ? 'Generating...' : 'Get Link'}
                </Button>
              )}
            </div>
            <p className="text-xs text-forge-muted">
              {setup.alreadyLinked
                ? 'Your Telegram is already connected.'
                : setup.linkCode
                  ? 'Click below to connect via Telegram.'
                  : 'Connect your Telegram account.'}
            </p>

            {setup.linkCode && !setup.alreadyLinked && setup.deepLink && (
              <div className="mt-3">
                <a
                  href={setup.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (!setup.isPolling) {
                      setTimeout(() => setup.startPolling(), 500);
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full p-2.5 rounded bg-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/30 text-xs font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open in Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'p-3 rounded-lg border transition-all',
          setup.telegramUser
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-forge-border/50 bg-forge-bg/50',
          !setup.linkCode && !setup.alreadyLinked && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
              setup.telegramUser
                ? 'border-green-500 bg-green-500/10'
                : 'border-forge-border bg-forge-bg'
            )}
          >
            {setup.telegramUser ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : setup.isPolling ? (
              <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
            ) : (
              <span className="text-xs font-bold text-forge-muted">3</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-white">Telegram Connection</p>
              {setup.telegramUser ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                  Connected
                </span>
              ) : setup.isPolling ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={setup.stopPolling}
                  className="h-6 px-2 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={setup.startPolling}
                  disabled={!setup.linkCode && !setup.alreadyLinked}
                  className="h-6 px-2 text-xs bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30"
                >
                  Check Status
                </Button>
              )}
            </div>
            <p className="text-xs text-forge-muted">
              {setup.telegramUser
                ? `Connected as @${setup.telegramUser.telegram_username}`
                : setup.isPolling
                  ? 'Waiting for you to connect via Telegram...'
                  : 'Click "Start" in Telegram after opening the link.'}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'p-3 rounded-lg border transition-all',
          isComplete ? 'border-green-500/30 bg-green-500/5' : 'border-forge-border/50 bg-forge-bg/50',
          !setup.telegramUser && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0',
              isComplete ? 'border-green-500 bg-green-500/10' : 'border-forge-border bg-forge-bg'
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : setup.isCreatingAgent ? (
              <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
            ) : (
              <span className="text-xs font-bold text-forge-muted">4</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-white">Create Agent</p>
              {isComplete ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                  Active
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={setup.createAgent}
                  disabled={!setup.telegramUser || setup.isCreatingAgent}
                  className="h-6 px-2 text-xs bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30"
                >
                  {setup.isCreatingAgent ? 'Creating...' : 'Create'}
                </Button>
              )}
            </div>
            <p className="text-xs text-forge-muted mb-3">
              {isComplete
                ? 'Your trading agent is deployed and ready.'
                : 'Configure trading preferences and deploy your agent.'}
            </p>

            {/* Trading Preferences */}
            {!isComplete && setup.telegramUser && (
              <div className="space-y-4 pt-2 border-t border-forge-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-3.5 h-3.5 text-forge-muted" />
                  <span className="text-xs font-medium text-white">Trading Preferences</span>
                </div>

                <PreferenceSlider
                  label="Risk Tolerance"
                  value={setup.tradingPreferences.risk_tolerance}
                  onChange={(v) => handlePreferenceChange('risk_tolerance', v)}
                  description="Higher = more aggressive trades"
                />

                <PreferenceSlider
                  label="Trade Frequency"
                  value={setup.tradingPreferences.trade_frequency}
                  onChange={(v) => handlePreferenceChange('trade_frequency', v)}
                  description="Higher = more frequent trades"
                />

                <PreferenceSlider
                  label="Social Sentiment Weight"
                  value={setup.tradingPreferences.social_sentiment_weight}
                  onChange={(v) => handlePreferenceChange('social_sentiment_weight', v)}
                  description="Weight of social signals in decisions"
                />

                <PreferenceSlider
                  label="Price Momentum Focus"
                  value={setup.tradingPreferences.price_momentum_focus}
                  onChange={(v) => handlePreferenceChange('price_momentum_focus', v)}
                  description="Focus on trending price movements"
                />

                <PreferenceSlider
                  label="Market Rank Priority"
                  value={setup.tradingPreferences.market_rank_priority}
                  onChange={(v) => handlePreferenceChange('market_rank_priority', v)}
                  description="Prioritize top-ranked markets"
                />
              </div>
            )}

            {isComplete && setup.agentResult && (
              <div className="space-y-2 pt-2 border-t border-forge-border/30">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {setup.agentResult.agent?.name && (
                    <div>
                      <span className="text-forge-muted">Agent:</span>
                      <p className="text-white truncate">{setup.agentResult.agent.name}</p>
                    </div>
                  )}
                  {setup.agentResult.agent?.venue && (
                    <div>
                      <span className="text-forge-muted">Venue:</span>
                      <p className="text-white">{setup.agentResult.agent.venue}</p>
                    </div>
                  )}
                  {setup.agentResult.deployment?.status && (
                    <div>
                      <span className="text-forge-muted">Status:</span>
                      <p className="text-green-400">{setup.agentResult.deployment.status}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isComplete && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-accent-cyan/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Setup Complete</span>
          </div>
          <p className="text-xs text-forge-muted">
            Send trading signals via your connected Telegram account. Your Lazy Trader agent will
            process them accordingly.
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-accent-cyan">
            <ArrowRight className="w-3 h-3" />
            <span>Ready for code generation</span>
          </div>
        </div>
      )}
    </div>
  );
}
