/**
 * @cradle/telegram-commands
 * 
 * Chat flow composer for handling non-command messages
 */

import { Composer, Context } from 'grammy';
import type { MessageHandler } from '../types';

/**
 * Create a chat flow composer for handling regular messages
 * 
 * @param handler - Custom message handler
 * @returns Configured Composer instance
 * 
 * @example
 * ```ts
 * const chatComposer = createChatFlowComposer(async (ctx) => {
 *   await ctx.reply(`You said: ${ctx.message?.text}`);
 * });
 * bot.use(chatComposer);
 * ```
 */
export function createChatFlowComposer(handler?: MessageHandler): Composer<Context> {
    const composer = new Composer<Context>();

    composer.on('message:text', async (ctx) => {
        // Skip commands
        const text = ctx.message.text;
        if (text.startsWith('/')) return;

        if (handler) {
            await handler(ctx);
        } else {
            // Default echo behavior
            await ctx.reply(`You said: ${text}`);
        }
    });

    return composer;
}

/**
 * Create a rate-limited chat flow composer
 * 
 * @param windowMs - Time window in milliseconds
 * @param maxMessages - Maximum messages per window
 * @param handler - Message handler
 * @returns Rate-limited Composer instance
 */
export function createRateLimitedChatComposer(
    windowMs: number,
    maxMessages: number,
    handler?: MessageHandler
): Composer<Context> {
    const userMessageCounts = new Map<number, { count: number; resetAt: number }>();
    const composer = new Composer<Context>();

    composer.on('message:text', async (ctx) => {
        const text = ctx.message.text;
        if (text.startsWith('/')) return;

        const userId = ctx.from?.id;
        if (!userId) return;

        const now = Date.now();
        const userData = userMessageCounts.get(userId);

        if (!userData || now > userData.resetAt) {
            // Reset or initialize counter
            userMessageCounts.set(userId, { count: 1, resetAt: now + windowMs });
        } else if (userData.count >= maxMessages) {
            // Rate limited
            await ctx.reply('⏳ Too many messages. Please slow down.');
            return;
        } else {
            // Increment counter
            userData.count++;
        }

        if (handler) {
            await handler(ctx);
        } else {
            await ctx.reply(`You said: ${text}`);
        }
    });

    return composer;
}

/**
 * Default chat flow composer with echo behavior
 */
export const defaultChatFlowComposer = createChatFlowComposer();
