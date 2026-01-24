'use client';

import { useLazyTraderSetup, type TradingPreferences } from './index';

interface ExampleLazyTraderSetupProps {
  userWallet: string | undefined;
  onSetupComplete?: () => void;
}

export function ExampleLazyTraderSetup({ userWallet, onSetupComplete }: ExampleLazyTraderSetupProps) {
  const setup = useLazyTraderSetup({
    userWallet,
    onComplete: (result) => {
      console.log('Setup complete!', result);
      onSetupComplete?.();
    },
  });

  if (setup.isCheckingSetup) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <p>Checking setup status...</p>
      </div>
    );
  }

  if (setup.error) {
    return (
      <div style={{ padding: '1rem', color: 'red' }}>
        <p>Error: {setup.error}</p>
        <button onClick={setup.clearError}>Dismiss</button>
      </div>
    );
  }

  const isComplete = setup.agentResult !== null;
  if (isComplete) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>✅ Setup Complete!</h2>
        {setup.agentResult && (
          <div>
            <p><strong>Agent:</strong> {setup.agentResult.agent?.name}</p>
            <p><strong>Status:</strong> {setup.agentResult.deployment?.status}</p>
            <p><strong>Address:</strong> {setup.agentResult.ostiumAgentAddress}</p>
          </div>
        )}
        <button onClick={setup.reset} style={{ marginTop: '1rem' }}>
          Reset Setup
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Lazy Trader Setup</h2>

      <StepCard
        number={1}
        title="Generate Agent"
        description="Create an Ostium agent address for your wallet"
        isComplete={!!setup.agentAddress}
        isLoading={setup.isGeneratingAgent}
      >
        {setup.agentAddress ? (
          <p style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {setup.agentAddress}
          </p>
        ) : (
          <button onClick={setup.generateAgent} disabled={setup.isGeneratingAgent}>
            {setup.isGeneratingAgent ? 'Generating...' : 'Generate Agent'}
          </button>
        )}
      </StepCard>

      <StepCard
        number={2}
        title="Link Telegram"
        description="Connect your Telegram account"
        isComplete={setup.alreadyLinked || !!setup.telegramUser}
        isLoading={setup.isGeneratingLink}
        disabled={!setup.agentAddress}
      >
        {setup.alreadyLinked || setup.telegramUser ? (
          <p>✅ Telegram connected: @{setup.telegramUser?.telegram_username}</p>
        ) : setup.deepLink ? (
          <a
            href={setup.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setup.startPolling()}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: '#0088cc',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Open in Telegram
          </a>
        ) : (
          <button onClick={setup.generateLink} disabled={setup.isGeneratingLink || !setup.agentAddress}>
            {setup.isGeneratingLink ? 'Generating...' : 'Get Telegram Link'}
          </button>
        )}
      </StepCard>

      <StepCard
        number={3}
        title="Telegram Connection"
        description="Waiting for you to connect via Telegram"
        isComplete={!!setup.telegramUser}
        isLoading={setup.isPolling}
        disabled={!setup.linkCode}
      >
        {setup.telegramUser ? (
          <p>✅ Connected as @{setup.telegramUser.telegram_username}</p>
        ) : setup.isPolling ? (
          <p>Waiting for connection...</p>
        ) : (
          <p style={{ color: '#888' }}>Click the Telegram link above to connect</p>
        )}
      </StepCard>

      <StepCard
        number={4}
        title="Configure & Create"
        description="Set your trading preferences and create the agent"
        isComplete={setup.agentResult !== null}
        isLoading={setup.isCreatingAgent}
        disabled={!setup.telegramUser}
      >
        {setup.telegramUser && (
          <div>
            <PreferenceSlider
              label="Risk Tolerance"
              value={setup.tradingPreferences.risk_tolerance}
              onChange={(v) => setup.setTradingPreferences({
                ...setup.tradingPreferences,
                risk_tolerance: v,
              })}
            />
            <PreferenceSlider
              label="Trade Frequency"
              value={setup.tradingPreferences.trade_frequency}
              onChange={(v) => setup.setTradingPreferences({
                ...setup.tradingPreferences,
                trade_frequency: v,
              })}
            />
            <button
              onClick={setup.createAgent}
              disabled={setup.isCreatingAgent}
              style={{ marginTop: '1rem' }}
            >
              {setup.isCreatingAgent ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        )}
      </StepCard>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  isComplete,
  isLoading,
  disabled,
  children,
}: {
  number: number;
  title: string;
  description: string;
  isComplete: boolean;
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        border: '1px solid',
        borderColor: isComplete ? '#22c55e' : disabled ? '#444' : '#666',
        borderRadius: '8px',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isComplete ? '#22c55e' : '#444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
        }}>
          {isComplete ? '✓' : number}
        </span>
        <strong>{title}</strong>
        {isLoading && <span>⏳</span>}
      </div>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>{description}</p>
      {children}
    </div>
  );
}

function PreferenceSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <span>{label}</span>
        <span>{value}</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default ExampleLazyTraderSetup;
