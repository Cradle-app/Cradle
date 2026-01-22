# Maxxit Lazy Trader Component

Pre-built component for integrating with Maxxit Lazy Trader agent APIs.

## Overview

This component provides:

1. **API Client**: Fetch Lazy Trader agent details and send messages
2. **React Hooks**: Easy-to-use hooks for managing API state
3. **Next.js API Routes**: Server-side proxies to avoid CORS issues
4. **TypeScript Types**: Full type safety for API responses

## Installation

This package is included in your generated project. No additional installation required.

## Usage

### Basic Usage with Hooks

```tsx
import { useMaxxitLazyTrader } from '@cradle/maxxit-lazy-trader';

function LazyTraderDashboard() {
  const apiKey = 'your-maxxit-api-key';
  
  const {
    details,
    isLoading,
    error,
    fetchDetails,
    sendMessage,
    isSending,
    sendError,
    sendSuccess
  } = useMaxxitLazyTrader(apiKey);

  return (
    <div>
      <button onClick={fetchDetails}>
        Fetch Agent Details
      </button>
      
      {details && (
        <div>
          <p>Agent: {details.agent?.name}</p>
          <p>Status: {details.agent?.status}</p>
          <p>Wallet: {details.user_wallet}</p>
        </div>
      )}
      
      <input
        type="text"
        onChange={(e) => {
          // Store message in state
        }}
      />
      <button onClick={() => sendMessage('Your message here')}>
        Send Message
      </button>
    </div>
  );
}
```

### Using API Functions Directly

```tsx
import { 
  fetchClubDetails, 
  sendMessageToAgent 
} from '@cradle/maxxit-lazy-trader';

// Fetch agent details
const details = await fetchClubDetails('your-api-key');
console.log(details.agent?.name);

// Send a message
const result = await sendMessageToAgent('your-api-key', 'Buy BTC');
console.log(result.success);
```

## Next.js API Routes

For Next.js projects, include the server-side API routes to avoid CORS issues:

```tsx
// app/api/maxxit/club-details/route.ts
import { clubDetailsHandler } from '@cradle/maxxit-lazy-trader/server';
export { clubDetailsHandler as GET };

// app/api/maxxit/send-message/route.ts
import { sendMessageHandler } from '@cradle/maxxit-lazy-trader/server';
export { sendMessageHandler as POST };
```

These routes are automatically included in your generated project.

## API Reference

### Hooks

#### `useMaxxitLazyTrader(apiKey: string)`

Manages Lazy Trader agent state and API calls.

**Parameters:**
- `apiKey` - Your Maxxit API key

**Returns:**
- `details` - Fetched agent details (or null)
- `isLoading` - Loading state for fetch
- `error` - Error message for fetch
- `fetchDetails()` - Function to fetch agent details
- `sendMessage(message: string)` - Function to send a message
- `isSending` - Loading state for send
- `sendError` - Error message for send
- `sendSuccess` - Success message for send

### Functions

#### `fetchClubDetails(apiKey: string): Promise<ClubDetailsResponse>`

Fetches Lazy Trader agent details from Maxxit API.

#### `sendMessageToAgent(apiKey: string, message: string): Promise<SendMessageResponse>`

Sends a message to your Lazy Trader agent.

## Environment Variables

If using the server-side API routes:

```bash
# Optional: Override the Maxxit API base URL
MAXXIT_API_BASE_URL=http://localhost:5000
```

## TypeScript Types

### `ClubDetailsResponse`

```typescript
interface ClubDetailsResponse {
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
}
```

### `SendMessageResponse`

```typescript
interface SendMessageResponse {
  success?: boolean;
  message_id?: string;
  post_id?: string | number;
}
```

## Files

- `src/index.ts` - Main exports
- `src/api.ts` - API client functions
- `src/types.ts` - TypeScript types
- `src/hooks/` - React hooks
- `src/server/` - Next.js API route handlers
- `src/example.tsx` - Example usage component

## Getting Your API Key

1. Visit [maxxit.ai/dashboard](https://maxxit.ai/dashboard)
2. Navigate to API Keys section
3. Generate a new API key
4. Copy and use it in your application

## Support

For issues with the Maxxit API, contact Maxxit support.
For issues with this component, open an issue in the Cradle repository.

---

Generated with ❤️ by [Cradle](https://cradle.dev)
