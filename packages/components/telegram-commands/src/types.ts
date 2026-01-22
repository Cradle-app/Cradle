/**
 * @cradle/telegram-commands
 * 
 * TypeScript types for Telegram bot command handling
 */

import type { Bot, Context } from 'grammy';
import type { DefaultCommand, DeliveryMethod, BotFramework } from './constants';

/**
 * Bot configuration options
 */
export interface TelegramBotConfig {
    /** Bot token from @BotFather */
    token: string;
    /** Webhook or polling delivery */
    deliveryMethod: DeliveryMethod;
    /** Enabled commands */
    commands: DefaultCommand[];
    /** Enable rate limiting */
    rateLimitEnabled: boolean;
    /** Enable standard chat flow handling */
    chatFlowEnabled: boolean;
    /** Bot framework to use */
    framework: BotFramework;
    /** Webhook URL (for webhook mode) */
    webhookUrl?: string;
    /** Webhook secret for verification */
    webhookSecret?: string;
}

/**
 * Bot status information
 */
export interface BotStatus {
    /** Whether the bot is running */
    isRunning: boolean;
    /** Bot username */
    username?: string;
    /** Bot ID */
    botId?: number;
    /** Current delivery method */
    deliveryMethod: DeliveryMethod;
    /** Last activity timestamp */
    lastActivity?: Date;
    /** Error message if any */
    error?: string;
}

/**
 * Bot instance with type information
 */
export type TelegramBot = Bot<Context>;

/**
 * Command handler function type
 */
export type CommandHandler = (ctx: Context) => Promise<void> | void;

/**
 * Message handler function type
 */
export type MessageHandler = (ctx: Context) => Promise<void> | void;

/**
 * Webhook verification result
 */
export interface WebhookInfo {
    /** Webhook URL */
    url: string;
    /** Whether webhook is active */
    isActive: boolean;
    /** Pending update count */
    pendingUpdates?: number;
    /** Last error date */
    lastErrorDate?: Date;
    /** Last error message */
    lastErrorMessage?: string;
}

/**
 * Async operation state
 */
export interface AsyncState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook options for useTelegramBot
 */
export interface UseTelegramBotOptions {
    /** Bot token */
    token?: string;
    /** API base URL for verification endpoint */
    apiBaseUrl?: string;
}

/**
 * Return type for useTelegramBot hook
 */
export interface UseTelegramBotReturn {
    /** Current bot status */
    status: BotStatus | null;
    /** Webhook information */
    webhookInfo: WebhookInfo | null;
    /** Loading state */
    isLoading: boolean;
    /** Error if any */
    error: Error | null;
    /** Verify bot token */
    verifyToken: (token: string) => Promise<BotStatus>;
    /** Set webhook URL */
    setWebhook: (url: string) => Promise<void>;
    /** Delete webhook */
    deleteWebhook: () => Promise<void>;
    /** Refresh status */
    refresh: () => Promise<void>;
}
