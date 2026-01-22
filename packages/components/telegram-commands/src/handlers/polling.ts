/**
 * @cradle/telegram-commands
 * 
 * Polling mode utilities for local development
 */

import type { TelegramBot } from '../types';
import { createBot, startPolling, stopBot } from '../bot-client';

/**
 * Options for starting polling mode
 */
export interface PollingOptions {
    /** Bot token (if not providing bot instance) */
    token?: string;
    /** Callback when bot starts */
    onStart?: () => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Enable graceful shutdown on SIGINT/SIGTERM */
    gracefulShutdown?: boolean;
}

/**
 * Start bot in polling mode with graceful shutdown
 * 
 * @param bot - Bot instance or use token from options
 * @param options - Polling options
 * 
 * @example
 * ```ts
 * // scripts/telegram-bot.ts
 * import { runPollingBot, createBot } from '@cradle/telegram-commands';
 * 
 * const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
 * await runPollingBot(bot, { gracefulShutdown: true });
 * ```
 */
export async function runPollingBot(
    bot: TelegramBot,
    options?: PollingOptions
): Promise<void> {
    const { onStart, onError, gracefulShutdown = true } = options ?? {};

    if (gracefulShutdown) {
        setupGracefulShutdown(bot);
    }

    await startPolling(bot, { onStart, onError });
}

/**
 * Create and run a polling bot from token
 * 
 * @param token - Bot token
 * @param options - Polling options
 */
export async function createAndRunPollingBot(
    token: string,
    options?: PollingOptions
): Promise<TelegramBot> {
    const bot = createBot(token);
    await runPollingBot(bot, options);
    return bot;
}

/**
 * Setup graceful shutdown handlers
 * 
 * @param bot - Bot instance
 */
export function setupGracefulShutdown(bot: TelegramBot): void {
    const shutdown = async (signal: string) => {
        console.log(`\n📴 Received ${signal}, shutting down...`);
        await stopBot(bot);
        process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Create a polling script entry point
 * 
 * This function is designed to be the main entry point for
 * a standalone polling script.
 * 
 * @param setupBot - Function to setup and configure the bot
 * 
 * @example
 * ```ts
 * // scripts/telegram-bot.ts
 * import { createPollingScript, createBot } from '@cradle/telegram-commands';
 * import { commandsComposer } from '../src/lib/telegram/composers';
 * 
 * createPollingScript((bot) => {
 *   bot.use(commandsComposer);
 * });
 * ```
 */
export function createPollingScript(
    setupBot: (bot: TelegramBot) => void | Promise<void>
): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
        process.exit(1);
    }

    const bot = createBot(token);

    Promise.resolve(setupBot(bot))
        .then(() => runPollingBot(bot, {
            onStart: () => console.log('🤖 Bot is running in polling mode!'),
            onError: (error) => console.error('❌ Bot error:', error),
            gracefulShutdown: true,
        }))
        .catch((error) => {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        });
}
