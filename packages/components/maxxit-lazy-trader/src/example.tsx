'use client';

/**
 * Example: Maxxit Lazy Trader Integration
 * 
 * This example shows how to use the useMaxxitLazyTrader hook
 * to fetch agent details and send messages.
 * 
 * Prerequisites:
 * - Get your API key from https://maxxit.ai/dashboard
 * - Set up Next.js API routes (see README)
 */

import { useState } from 'react';
import { useMaxxitLazyTrader } from './hooks';

/**
 * Example component showing how to integrate Maxxit Lazy Trader.
 * 
 * Usage:
 * 1. Get your API key from maxxit.ai/dashboard
 * 2. Import and use this component
 * 
 * @example
 * ```tsx
 * import { MaxxitLazyTraderExample } from '@cradle/maxxit-lazy-trader/example';
 * 
 * function App() {
 *   return <MaxxitLazyTraderExample />;
 * }
 * ```
 */
export function MaxxitLazyTraderExample() {
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');

  const {
    details,
    isLoading,
    error,
    fetchDetails,
    sendMessage,
    isSending,
    sendError,
    sendSuccess,
  } = useMaxxitLazyTrader(apiKey);

  const handleFetchDetails = async () => {
    await fetchDetails();
  };

  const handleSendMessage = async () => {
    await sendMessage(message);
    if (!sendError) {
      setMessage(''); // Clear on success
    }
  };

  return (
    <div className="maxxit-lazy-trader">
      <h2>Maxxit Lazy Trader Integration</h2>

      {/* API Key Input */}
      <section>
        <h3>Step 1: Enter API Key</h3>
        <p>
          Get your API key from{' '}
          <a href="https://maxxit.ai/dashboard" target="_blank" rel="noopener noreferrer">
            maxxit.ai/dashboard
          </a>
        </p>
        <input
          type="password"
          placeholder="Enter your Maxxit API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </section>

      {/* Fetch Details */}
      <section>
        <h3>Step 2: Fetch Agent Details</h3>
        <button onClick={handleFetchDetails} disabled={isLoading || !apiKey}>
          {isLoading ? 'Fetching...' : 'Fetch Lazy Trader Details'}
        </button>
        {error && <p className="error">{error}</p>}
        {details && (
          <div className="details">
            <p><strong>Agent Name:</strong> {details.agent?.name || 'N/A'}</p>
            <p><strong>Status:</strong> {details.agent?.status || 'N/A'}</p>
            <p><strong>Venue:</strong> {details.agent?.venue || 'N/A'}</p>
            <p><strong>Wallet:</strong> {details.user_wallet || 'N/A'}</p>
            {details.deployment && (
              <p><strong>Deployment:</strong> {details.deployment.status || 'N/A'}</p>
            )}
            {details.telegram_user && (
              <p>
                <strong>Telegram:</strong>{' '}
                {details.telegram_user.first_name} {details.telegram_user.last_name} (
                @{details.telegram_user.telegram_username})
              </p>
            )}
          </div>
        )}
      </section>

      {/* Send Message */}
      <section>
        <h3>Step 3: Send Message to Agent</h3>
        <textarea
          placeholder="Enter your message (e.g., 'Buy BTC')"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <button onClick={handleSendMessage} disabled={isSending || !apiKey || !message.trim()}>
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
        {sendError && <p className="error">{sendError}</p>}
        {sendSuccess && <p className="success">{sendSuccess}</p>}
      </section>

      {/* Info */}
      <section>
        <h3>How It Works</h3>
        <ol>
          <li>Enter your Maxxit API key from the dashboard</li>
          <li>Fetch your Lazy Trader agent details to verify connection</li>
          <li>Send messages to your agent for trading signals</li>
        </ol>
        <p>
          The component uses Next.js API routes to proxy requests and avoid CORS issues.
        </p>
      </section>
    </div>
  );
}
