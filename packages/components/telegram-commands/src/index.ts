/**
 * @cradle/telegram-commands
 *
 * Telegram Bot Command Handling Integration
 * Provides utilities for webhooks, polling, and React hooks for bot management
 *
 * @example
 * ```tsx
 * import { 
 *   createBot, 
 *   createCommandsComposer, 
 *   createWebhookHandler,
 *   useTelegramBot 
 * } from '@cradle/telegram-commands';
 *
 * // Create bot with commands
 * const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
 * const commands = createCommandsComposer(['start', 'help', 'balance']);
 * bot.use(commands);
 *
 * // Export webhook handler for Next.js
 * export const POST = createWebhookHandler(bot);
 * ```
 */

// Constants
export {
    DEFAULT_COMMANDS,
    DEFAULT_RESPONSES,
    RATE_LIMIT_CONFIG,
    DELIVERY_METHODS,
    BOT_FRAMEWORKS,
    type DefaultCommand,
    type DeliveryMethod,
    type BotFramework,
} from './constants';

// Types
export type {
    TelegramBotConfig,
    BotStatus,
    TelegramBot,
    CommandHandler,
    MessageHandler,
    WebhookInfo,
    AsyncState,
    UseTelegramBotOptions,
    UseTelegramBotReturn,
} from './types';

// Bot Client
export {
    createBot,
    getBotInfo,
    verifyBotToken,
    startPolling,
    stopBot,
    initializeBot,
} from './bot-client';

// Composers
export {
    createCommandsComposer,
    createStartHandler,
    createHelpHandler,
    createStatusHandler,
    defaultCommandsComposer,
    createChatFlowComposer,
    createRateLimitedChatComposer,
    defaultChatFlowComposer,
} from './composers';

// Handlers
export {
    createWebhookHandler,
    createSecureWebhookHandler,
    setWebhook,
    deleteWebhook,
    getWebhookInfo,
    generateWebhookUrl,
    runPollingBot,
    createAndRunPollingBot,
    setupGracefulShutdown,
    createPollingScript,
    type PollingOptions,
} from './handlers';

// React Hooks
export {
    useTelegramBot,
} from './hooks';
