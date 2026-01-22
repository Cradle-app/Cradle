# Telegram Commands Component

Pre-built component for Telegram bot command handling with grammY.

## Overview

This component provides:

1. **Bot Client**: grammY bot instance creation and management
2. **Command Composers**: Pre-built command handlers that can be extended
3. **Webhook Handler**: Ready-to-use handler for Next.js API routes
4. **Polling Utilities**: Scripts for local development
5. **React Hook**: `useTelegramBot` for bot management in UI

## Installation

This package is included in your generated project. No additional installation required.

## Usage

### Basic Bot Setup

```ts
import { createBot, createCommandsComposer } from '@cradle/telegram-commands';

const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);

// Add command handlers
const commands = createCommandsComposer(['start', 'help', 'balance']);
bot.use(commands);
```

### Webhook Handler (Next.js App Router)

```ts
// app/api/telegram/webhook/route.ts
import { createBot, createWebhookHandler, createCommandsComposer } from '@cradle/telegram-commands';

const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
bot.use(createCommandsComposer(['start', 'help']));

export const POST = createWebhookHandler(bot);
```

### Polling Mode (Local Development)

```ts
// scripts/telegram-bot.ts
import { createPollingScript, createCommandsComposer } from '@cradle/telegram-commands';

createPollingScript((bot) => {
  bot.use(createCommandsComposer(['start', 'help', 'balance']));
});
```

Run with: `npx tsx scripts/telegram-bot.ts`

### React Hook for UI

```tsx
import { useTelegramBot } from '@cradle/telegram-commands';

function BotSetup() {
  const { status, verifyToken, isLoading } = useTelegramBot();
  
  const handleVerify = async (token: string) => {
    const result = await verifyToken(token);
    if (result.isRunning) {
      console.log('Bot connected:', result.username);
    }
  };
  
  return (
    <div>
      {status?.isRunning && <p>✅ Connected: @{status.username}</p>}
      <button onClick={() => handleVerify('your-token')} disabled={isLoading}>
        Verify Token
      </button>
    </div>
  );
}
```

## Custom Command Handlers

```ts
import { createCommandsComposer, type CommandHandler } from '@cradle/telegram-commands';

const customBalanceHandler: CommandHandler = async (ctx) => {
  const balance = await fetchUserBalance(ctx.from?.id);
  await ctx.reply(`💰 Your balance: ${balance} ETH`);
};

const commands = createCommandsComposer(['start', 'help', 'balance'], {
  balance: customBalanceHandler,
});
```

## Chat Flow (Non-Command Messages)

```ts
import { createChatFlowComposer } from '@cradle/telegram-commands';

const chatFlow = createChatFlowComposer(async (ctx) => {
  // Process user messages
  const response = await processWithAI(ctx.message?.text);
  await ctx.reply(response);
});

bot.use(chatFlow);
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook verification secret | For webhook mode |

## API Reference

### Bot Client

- `createBot(token)` - Create a new Bot instance
- `verifyBotToken(token)` - Check if token is valid
- `getBotInfo(bot)` - Get bot username and ID
- `startPolling(bot)` - Start polling mode
- `stopBot(bot)` - Stop the bot

### Composers

- `createCommandsComposer(commands, handlers?)` - Create command composer
- `createChatFlowComposer(handler?)` - Create chat flow composer
- `createRateLimitedChatComposer(windowMs, maxMessages, handler?)` - Rate-limited chat

### Handlers

- `createWebhookHandler(bot)` - Create Next.js webhook handler
- `createSecureWebhookHandler(bot, secret)` - With secret verification
- `setWebhook(bot, url)` - Set webhook URL
- `deleteWebhook(bot)` - Delete webhook
- `generateWebhookUrl(baseUrl, path?)` - Generate webhook URL

### Hooks

- `useTelegramBot(options?)` - React hook for bot management

## Files

- `src/index.ts` - Main exports
- `src/bot-client.ts` - Core bot initialization
- `src/constants.ts` - Default commands and configs
- `src/types.ts` - TypeScript types
- `src/composers/` - Command and chat composers
- `src/handlers/` - Webhook and polling handlers
- `src/hooks/` - React hooks
- `src/example.tsx` - Example component

---

Generated with ❤️ by [Cradle](https://cradle.dev)
