/**
 * @cradle/telegram-commands
 * 
 * Core bot client initialization and management
 */

import { Bot, Context } from 'grammy';
import type { TelegramBotConfig, BotStatus, TelegramBot } from './types';

/**
 * Create a new Telegram bot instance
 * 
 * @param token - Bot token from @BotFather
 * @returns Configured Bot instance
 * 
 * @example
 * ```ts
 * const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
 * bot.command('start', (ctx) => ctx.reply('Hello!'));
 * ```
 */
export function createBot(token: string): TelegramBot {
    if (!token || token.trim() === '') {
        throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    return new Bot<Context>(token);
}

/**
 * Get bot information and verify the token is valid
 * 
 * @param bot - Bot instance or token
 * @returns Bot status with username and ID
 */
export async function getBotInfo(bot: TelegramBot | string): Promise<BotStatus> {
    try {
        const botInstance = typeof bot === 'string' ? createBot(bot) : bot;
        const me = await botInstance.api.getMe();

        return {
            isRunning: true,
            username: me.username,
            botId: me.id,
            deliveryMethod: 'polling', // Default, can be overridden
        };
    } catch (error) {
        return {
            isRunning: false,
            deliveryMethod: 'polling',
            error: error instanceof Error ? error.message : 'Failed to get bot info',
        };
    }
}

/**
 * Verify a bot token is valid
 * 
 * @param token - Bot token to verify
 * @returns True if valid, false otherwise
 */
export async function verifyBotToken(token: string): Promise<boolean> {
    try {
        const bot = createBot(token);
        await bot.api.getMe();
        return true;
    } catch {
        return false;
    }
}

/**
 * Start the bot in polling mode
 * 
 * @param bot - Bot instance
 * @param options - Polling options
 */
export async function startPolling(
    bot: TelegramBot,
    options?: {
        onStart?: () => void;
        onError?: (error: Error) => void;
    }
): Promise<void> {
    try {
        // Delete any existing webhook before starting polling
        await bot.api.deleteWebhook();

        if (options?.onStart) {
            options.onStart();
        }

        await bot.start({
            onStart: () => {
                console.log('🤖 Telegram bot started in polling mode');
            },
        });
    } catch (error) {
        if (options?.onError && error instanceof Error) {
            options.onError(error);
        }
        throw error;
    }
}

/**
 * Stop the bot gracefully
 * 
 * @param bot - Bot instance
 */
export async function stopBot(bot: TelegramBot): Promise<void> {
    await bot.stop();
    console.log('🛑 Telegram bot stopped');
}

/**
 * Initialize bot with configuration
 * 
 * @param config - Bot configuration
 * @returns Configured bot instance
 */
export function initializeBot(config: Partial<TelegramBotConfig>): TelegramBot | null {
    const token = config.token || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.warn('No bot token provided');
        return null;
    }

    return createBot(token);
}
