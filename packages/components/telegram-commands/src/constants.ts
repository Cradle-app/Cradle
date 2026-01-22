/**
 * @cradle/telegram-commands
 * 
 * Constants and default configurations for Telegram bot commands
 */

/**
 * Default bot commands that are commonly used
 */
export const DEFAULT_COMMANDS = [
    'start',
    'help',
    'balance',
    'wallet',
    'subscribe',
    'unsubscribe',
    'settings',
    'status',
] as const;

export type DefaultCommand = typeof DEFAULT_COMMANDS[number];

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
    /** Time window in milliseconds */
    windowMs: 60_000, // 1 minute
    /** Maximum number of messages per window */
    maxMessages: 30,
    /** Message to send when rate limited */
    limitMessage: '⏳ Too many requests. Please slow down.',
} as const;

/**
 * Default command responses
 */
export const DEFAULT_RESPONSES: Record<DefaultCommand, string> = {
    start: '👋 Welcome! Use /help to see available commands.',
    help: '📋 Available commands:\n\n/start - Start the bot\n/help - Show this message\n/balance - Check your balance\n/wallet - View wallet info\n/subscribe - Subscribe to alerts\n/unsubscribe - Unsubscribe from alerts\n/settings - Bot settings\n/status - Check bot status',
    balance: '💰 Your current balance: Loading...',
    wallet: '👛 Wallet information:\n\nUse /start to link your wallet first.',
    subscribe: '🔔 You have been subscribed to notifications.',
    unsubscribe: '🔕 You have been unsubscribed from notifications.',
    settings: '⚙️ Bot Settings:\n\n• Notifications: Enabled\n• Language: English',
    status: '✅ Bot is online and running!',
} as const;

/**
 * Supported delivery methods
 */
export const DELIVERY_METHODS = ['webhook', 'polling'] as const;
export type DeliveryMethod = typeof DELIVERY_METHODS[number];

/**
 * Supported bot frameworks
 */
export const BOT_FRAMEWORKS = ['grammy', 'telegraf'] as const;
export type BotFramework = typeof BOT_FRAMEWORKS[number];
