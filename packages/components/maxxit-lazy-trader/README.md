# Maxxit Lazy Trader Component

Pre-built component for integrating with Maxxit Lazy Trader via wallet-based Telegram connection.

## Overview

This component provides a 4-step wallet-based setup flow for Lazy Trading:

1. **Generate Agent** - Create an Ostium agent address for your wallet
2. **Link Telegram** - Generate a deep link to connect Telegram
3. **Wait for Connection** - Poll for Telegram connection status
4. **Create Agent** - Configure trading preferences and deploy

## Installation

```bash
pnpm add @cradle/maxxit-lazy-trader
```

## Quick Start

```tsx
import { useLazyTraderSetup } from '@cradle/maxxit-lazy-trader';
import { useAccount } from 'wagmi';

function LazyTraderSetup() {
  const { address } = useAccount();
  
  const setup = useLazyTraderSetup({
    userWallet: address,
    onComplete: (result) => {
      console.log('Agent created:', result.agent);
    },
  });

  // Auto-checks if already set up on mount
  if (setup.isCheckingSetup) {
    return <div>Checking setup status...</div>;
  }

  // Already complete
  if (setup.currentStep === 'complete') {
    return <div>Setup complete! Agent: {setup.agentResult?.agent?.name}</div>;
  }

  return (
    <div>
      {/* Step 1: Generate Agent */}
      <button onClick={setup.generateAgent} disabled={setup.isGeneratingAgent}>
        {setup.isGeneratingAgent ? 'Generating...' : 'Generate Agent'}
      </button>

      {/* Step 2: Link Telegram */}
      {setup.agentAddress && (
        <button onClick={setup.generateLink} disabled={setup.isGeneratingLink}>
          Get Telegram Link
        </button>
      )}

      {/* Step 3: Connect via Telegram */}
      {setup.deepLink && (
        <a href={setup.deepLink} target="_blank" onClick={setup.startPolling}>
          Connect Telegram
        </a>
      )}

      {/* Step 4: Create Agent */}
      {setup.telegramUser && (
        <button onClick={setup.createAgent} disabled={setup.isCreatingAgent}>
          Create Agent
        </button>
      )}
    </div>
  );
}
```

## API Reference

### `useLazyTraderSetup(options)`

Main hook for managing the setup flow.

**Options:**
- `userWallet: string | undefined` - Connected wallet address
- `onComplete?: (response: CreateAgentResponse) => void` - Callback when setup completes

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `currentStep` | `SetupStep` | Current step: `'idle'` \| `'agent'` \| `'telegram-link'` \| `'telegram-connect'` \| `'create-agent'` \| `'complete'` |
| `isCheckingSetup` | `boolean` | True while checking if already set up |
| `agentAddress` | `string \| null` | Generated Ostium agent address |
| `isGeneratingAgent` | `boolean` | Loading state for step 1 |
| `generateAgent` | `() => Promise<void>` | Trigger step 1 |
| `linkCode` | `string \| null` | Generated Telegram link code |
| `deepLink` | `string \| null` | Telegram deep link URL |
| `isGeneratingLink` | `boolean` | Loading state for step 2 |
| `generateLink` | `() => Promise<void>` | Trigger step 2 |
| `telegramUser` | `TelegramUser \| null` | Connected Telegram user info |
| `isPolling` | `boolean` | True while polling for connection |
| `startPolling` | `() => void` | Start polling for Telegram connection |
| `stopPolling` | `() => void` | Stop polling |
| `tradingPreferences` | `TradingPreferences` | Current trading preferences |
| `setTradingPreferences` | `(prefs: TradingPreferences) => void` | Update preferences |
| `isCreatingAgent` | `boolean` | Loading state for step 4 |
| `createAgent` | `() => Promise<void>` | Trigger step 4 |
| `agentResult` | `CreateAgentResponse \| null` | Final agent creation result |
| `error` | `string \| null` | Error message |
| `reset` | `() => void` | Reset all state |

### API Functions

```tsx
import {
  generateOstiumAgent,
  generateTelegramLink,
  checkTelegramStatus,
  createLazyTraderAgent,
  checkSetup,
} from '@cradle/maxxit-lazy-trader';

// Step 1
const agent = await generateOstiumAgent(walletAddress);

// Step 2
const link = await generateTelegramLink(walletAddress);

// Step 3 (poll this)
const status = await checkTelegramStatus(walletAddress, linkCode);

// Step 4
const result = await createLazyTraderAgent(walletAddress, telegramUserId, preferences);

// Check if already set up
const setupStatus = await checkSetup(walletAddress);
```

## Types

```typescript
interface TradingPreferences {
  risk_tolerance: number;        // 0-100
  trade_frequency: number;       // 0-100
  social_sentiment_weight: number; // 0-100
  price_momentum_focus: number;  // 0-100
  market_rank_priority: number;  // 0-100
}

interface TelegramUser {
  id: string;
  telegram_user_id: string;
  telegram_username: string;
}

interface CreateAgentResponse {
  success: boolean;
  agent?: { id: string; name: string; venue: string };
  deployment?: { id: string; status: string };
  ostiumAgentAddress?: string;
}
```

## Configuration

Set the API base URL when using this component:

```tsx
import { useLazyTraderSetup } from '@cradle/maxxit-lazy-trader';

// The component uses '/api/maxxit' by default
// For production, use the Cradle API:
const API_BASE_URL = 'https://cradle-web-eight.vercel.app/api/maxxit';
```

Or configure via environment variable:

```bash
# .env.local
NEXT_PUBLIC_MAXXIT_API_URL=https://cradle-web-eight.vercel.app/api/maxxit
```

## API Endpoints

The following endpoints are available at `https://cradle-web-eight.vercel.app/api/maxxit`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-agent` | POST | Generate Ostium agent |
| `/generate-telegram-link` | POST | Generate Telegram link |
| `/check-telegram-status` | GET | Check Telegram connection |
| `/create-agent` | POST | Create lazy trader agent |
| `/check-setup` | GET | Check if setup complete |

---

Generated with ❤️ by [Cradle](https://cradle.dev)
