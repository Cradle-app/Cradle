'use client';

import { useState } from 'react';
import { ExternalLink, KeyRound, Loader2, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CLUB_DETAILS_URL = '/api/maxxit/club-details';
const SEND_MESSAGE_URL = '/api/maxxit/send-message';
const MAXXIT_DASHBOARD_URL = 'https://maxxit.ai/dashboard';
const API_KEY_HEADER = 'x-api-key';

const EMPTY_MESSAGE = 'Message is required.';
const EMPTY_API_KEY = 'API key is required.';
const CLUB_DETAILS_ERROR = 'Failed to fetch lazy trader details.';
const SEND_MESSAGE_ERROR = 'Failed to send message.';

interface MaxxitClubDetailsResponse {
  success?: boolean;
  user_wallet?: string;
  agent?: {
    id?: string | number;
    name?: string;
    venue?: string;
    status?: string;
  };
  telegram_user?: {
    telegram_username?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  deployment?: {
    status?: string;
    enabled_venues?: string[];
  } | null;
  trading_preferences?: {
    risk_tolerance?: string | number;
    trade_frequency?: string | number;
  } | null;
  ostium_agent_address?: string | null;
  error?: string;
  message?: string;
}

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const getErrorMessage = (payload: MaxxitClubDetailsResponse | null, fallback: string) => {
  if (!payload) return fallback;
  if (payload.error) return payload.error;
  if (payload.message) return payload.message;
  return fallback;
};

const buildTelegramName = (details: MaxxitClubDetailsResponse): string | undefined => {
  const firstName = details.telegram_user?.first_name ?? '';
  const lastName = details.telegram_user?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || details.telegram_user?.telegram_username || undefined;
};

export function MaxxitLazyTradingForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const updateConfig = (values: Record<string, unknown>) => {
    updateNodeConfig(nodeId, { ...config, ...values });
  };

  const handleFetchDetails = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setDetailsError(EMPTY_API_KEY);
      return;
    }

    setIsFetching(true);
    setDetailsError(null);
    setSendSuccess(null);

    try {
      const response = await fetch(CLUB_DETAILS_URL, {
        method: 'GET',
        headers: {
          [API_KEY_HEADER]: trimmedKey,
        },
      });

      const payload = (await response.json().catch(() => null)) as MaxxitClubDetailsResponse | null;

      if (!response.ok || !payload) {
        setDetailsError(getErrorMessage(payload, CLUB_DETAILS_ERROR));
        return;
      }

      updateConfig({
        agentId: payload.agent?.id ? String(payload.agent.id) : undefined,
        agentName: payload.agent?.name ?? undefined,
        agentStatus: payload.agent?.status ?? undefined,
        venue: payload.agent?.venue ?? undefined,
        userWallet: payload.user_wallet ?? undefined,
        deploymentStatus: payload.deployment?.status ?? undefined,
        enabledVenues: payload.deployment?.enabled_venues ?? undefined,
        telegramUsername: payload.telegram_user?.telegram_username ?? undefined,
        telegramName: buildTelegramName(payload),
      });
    } catch (error) {
      setDetailsError(CLUB_DETAILS_ERROR);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmedKey = apiKey.trim();
    const trimmedMessage = message.trim();

    if (!trimmedKey) {
      setSendError(EMPTY_API_KEY);
      return;
    }

    if (!trimmedMessage) {
      setSendError(EMPTY_MESSAGE);
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const response = await fetch(SEND_MESSAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [API_KEY_HEADER]: trimmedKey,
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const payload = (await response.json().catch(() => null)) as MaxxitClubDetailsResponse | null;

      if (!response.ok) {
        setSendError(getErrorMessage(payload, SEND_MESSAGE_ERROR));
        return;
      }

      setSendSuccess('✅ Message sent successfully! Your signal will be processed shortly.');
      setMessage('');
    } catch (error) {
      setSendError(SEND_MESSAGE_ERROR);
    } finally {
      setIsSending(false);
    }
  };

  const agentName = config.agentName as string | undefined;
  const agentStatus = config.agentStatus as string | undefined;
  const agentVenue = config.venue as string | undefined;
  const userWallet = config.userWallet as string | undefined;
  const deploymentStatus = config.deploymentStatus as string | undefined;
  const enabledVenues = config.enabledVenues as string[] | undefined;
  const telegramUsername = config.telegramUsername as string | undefined;
  const telegramName = config.telegramName as string | undefined;

  const hasDetails = Boolean(agentName || userWallet || agentStatus);

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50 space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-accent-cyan" />
          <p className="text-sm font-medium text-white">Maxxit API Key</p>
        </div>
        <p className="text-xs text-forge-muted">
          Generate an API key from Maxxit, then paste it here to access your Lazy Trader agent.
        </p>
        <a
          href={MAXXIT_DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent-cyan hover:underline"
        >
          Open Maxxit Dashboard
          <ExternalLink className="w-3 h-3" />
        </a>
        <Input
          type="password"
          placeholder="Maxxit API key"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          className="text-xs"
        />
        {detailsError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{detailsError}</span>
          </div>
        )}
        <Button
          size="sm"
          onClick={handleFetchDetails}
          disabled={isFetching}
          className="w-full"
        >
          {isFetching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Fetching details
            </>
          ) : (
            'Fetch Lazy Trader Details'
          )}
        </Button>
      </div>

      <div
        className={cn(
          'p-3 rounded-lg border space-y-2',
          hasDetails ? 'border-green-500/30 bg-green-500/5' : 'border-forge-border/50 bg-forge-bg/50'
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className={cn('w-4 h-4', hasDetails ? 'text-green-400' : 'text-forge-muted')} />
          <p className="text-sm font-medium text-white">Lazy Trader Agent</p>
        </div>
        {hasDetails ? (
          <div className="text-xs text-forge-muted space-y-1">
            <p><span className="text-white">Name:</span> {agentName || 'Unavailable'}</p>
            <p><span className="text-white">Status:</span> {agentStatus || 'Unavailable'}</p>
            <p><span className="text-white">Venue:</span> {agentVenue || 'Unavailable'}</p>
            <p><span className="text-white">Wallet:</span> {userWallet || 'Unavailable'}</p>
            <p><span className="text-white">Deployment:</span> {deploymentStatus || 'Unavailable'}</p>
            {enabledVenues && enabledVenues.length > 0 && (
              <p><span className="text-white">Enabled Venues:</span> {enabledVenues.join(', ')}</p>
            )}
            {(telegramName || telegramUsername) && (
              <p><span className="text-white">Telegram:</span> {telegramName || telegramUsername}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-forge-muted">
            Fetch details to see your Lazy Trader agent status.
          </p>
        )}
      </div>

      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50 space-y-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-accent-cyan" />
          <p className="text-sm font-medium text-white">Send a Message</p>
        </div>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a message for the Lazy Trader agent..."
          className="text-xs min-h-[90px]"
        />
        {sendError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{sendError}</span>
          </div>
        )}
        {sendSuccess && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{sendSuccess}</span>
          </div>
        )}
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={isSending}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Sending message
            </>
          ) : (
            'Send Message'
          )}
        </Button>
      </div>
    </div>
  );
}
