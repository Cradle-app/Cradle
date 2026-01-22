/**
 * @cradle/telegram-commands
 * 
 * Webhook handler for Next.js API routes
 */

import { webhookCallback, Bot, Context } from 'grammy';
import type { TelegramBot, WebhookInfo } from '../types';

/**
 * Create a webhook handler for Next.js App Router
 * 
 * @param bot - Bot instance
 * @returns POST handler function
 * 
 * @example
 * ```ts
 * // app/api/telegram/webhook/route.ts
 * import { createWebhookHandler, createBot } from '@cradle/telegram-commands';
 * 
 * const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
 * export const POST = createWebhookHandler(bot);
 * ```
 */
export function createWebhookHandler(bot: TelegramBot) {
    const handleUpdate = webhookCallback(bot, 'std/http');

    return async (req: Request): Promise<Response> => {
        try {
            return await handleUpdate(req);
        } catch (error) {
            console.error('Webhook error:', error);
            return new Response(
                JSON.stringify({ error: 'Internal server error' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    };
}

/**
 * Create a webhook handler with secret verification
 * 
 * @param bot - Bot instance
 * @param secret - Webhook secret for verification
 * @returns POST handler function
 */
export function createSecureWebhookHandler(bot: TelegramBot, secret: string) {
    const handleUpdate = webhookCallback(bot, 'std/http', {
        secretToken: secret,
    });

    return async (req: Request): Promise<Response> => {
        try {
            // Verify secret token header
            const tokenHeader = req.headers.get('x-telegram-bot-api-secret-token');
            if (tokenHeader !== secret) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            return await handleUpdate(req);
        } catch (error) {
            console.error('Webhook error:', error);
            return new Response(
                JSON.stringify({ error: 'Internal server error' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    };
}

/**
 * Set webhook URL for the bot
 * 
 * @param bot - Bot instance or token
 * @param url - Webhook URL
 * @param options - Webhook options
 */
export async function setWebhook(
    bot: TelegramBot | string,
    url: string,
    options?: {
        secretToken?: string;
        dropPendingUpdates?: boolean;
    }
): Promise<void> {
    const botInstance = typeof bot === 'string' ? new Bot(bot) : bot;

    await botInstance.api.setWebhook(url, {
        secret_token: options?.secretToken,
        drop_pending_updates: options?.dropPendingUpdates ?? true,
    });

    console.log(`✅ Webhook set to: ${url}`);
}

/**
 * Delete webhook and optionally switch to polling
 * 
 * @param bot - Bot instance or token
 * @param dropPendingUpdates - Whether to drop pending updates
 */
export async function deleteWebhook(
    bot: TelegramBot | string,
    dropPendingUpdates = true
): Promise<void> {
    const botInstance = typeof bot === 'string' ? new Bot(bot) : bot;

    await botInstance.api.deleteWebhook({
        drop_pending_updates: dropPendingUpdates,
    });

    console.log('🗑️ Webhook deleted');
}

/**
 * Get current webhook information
 * 
 * @param bot - Bot instance or token
 * @returns Webhook information
 */
export async function getWebhookInfo(bot: TelegramBot | string): Promise<WebhookInfo> {
    const botInstance = typeof bot === 'string' ? new Bot(bot) : bot;

    const info = await botInstance.api.getWebhookInfo();

    return {
        url: info.url ?? '',
        isActive: (info.url ?? '') !== '',
        pendingUpdates: info.pending_update_count,
        lastErrorDate: info.last_error_date ? new Date(info.last_error_date * 1000) : undefined,
        lastErrorMessage: info.last_error_message,
    };
}

/**
 * Generate webhook URL for the current deployment
 * 
 * @param baseUrl - Base URL of the deployment
 * @param path - API route path (default: /api/telegram/webhook)
 * @returns Full webhook URL
 */
export function generateWebhookUrl(baseUrl: string, path = '/api/telegram/webhook'): string {
    const url = new URL(path, baseUrl);
    return url.toString();
}
