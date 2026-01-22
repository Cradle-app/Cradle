/**
 * @cradle/telegram-commands
 * 
 * React hook for Telegram bot management
 */

import { useState, useCallback, useEffect } from 'react';
import type { BotStatus, WebhookInfo, UseTelegramBotOptions, UseTelegramBotReturn } from '../types';

/**
 * React hook for managing Telegram bot status and configuration
 * 
 * @param options - Hook options
 * @returns Bot management functions and state
 * 
 * @example
 * ```tsx
 * function BotManager() {
 *   const { status, verifyToken, isLoading, error } = useTelegramBot();
 *   
 *   const handleVerify = async () => {
 *     const result = await verifyToken('your-bot-token');
 *     console.log('Bot username:', result.username);
 *   };
 *   
 *   return (
 *     <div>
 *       {status?.isRunning && <p>Bot: @{status.username}</p>}
 *       <button onClick={handleVerify} disabled={isLoading}>
 *         Verify Token
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTelegramBot(options?: UseTelegramBotOptions): UseTelegramBotReturn {
    const [status, setStatus] = useState<BotStatus | null>(null);
    const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Verify a bot token by calling the Telegram API
     */
    const verifyToken = useCallback(async (token: string): Promise<BotStatus> => {
        setIsLoading(true);
        setError(null);

        try {
            // Call Telegram API directly to verify token
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || 'Invalid bot token');
            }

            const botStatus: BotStatus = {
                isRunning: true,
                username: data.result.username,
                botId: data.result.id,
                deliveryMethod: 'polling',
            };

            setStatus(botStatus);
            return botStatus;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to verify token');
            setError(error);

            const failedStatus: BotStatus = {
                isRunning: false,
                deliveryMethod: 'polling',
                error: error.message,
            };
            setStatus(failedStatus);
            return failedStatus;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Set webhook URL for bot
     */
    const setWebhook = useCallback(async (url: string): Promise<void> => {
        if (!options?.token) {
            throw new Error('Bot token is required to set webhook');
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${options.token}/setWebhook?url=${encodeURIComponent(url)}`
            );
            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || 'Failed to set webhook');
            }

            // Refresh webhook info
            await refreshWebhookInfo(options.token);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to set webhook');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [options?.token]);

    /**
     * Delete current webhook
     */
    const deleteWebhook = useCallback(async (): Promise<void> => {
        if (!options?.token) {
            throw new Error('Bot token is required to delete webhook');
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${options.token}/deleteWebhook?drop_pending_updates=true`
            );
            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || 'Failed to delete webhook');
            }

            setWebhookInfo({
                url: '',
                isActive: false,
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete webhook');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [options?.token]);

    /**
     * Refresh webhook information
     */
    const refreshWebhookInfo = useCallback(async (token: string): Promise<void> => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
            const data = await response.json();

            if (data.ok) {
                setWebhookInfo({
                    url: data.result.url,
                    isActive: data.result.url !== '',
                    pendingUpdates: data.result.pending_update_count,
                    lastErrorDate: data.result.last_error_date
                        ? new Date(data.result.last_error_date * 1000)
                        : undefined,
                    lastErrorMessage: data.result.last_error_message,
                });
            }
        } catch {
            // Silently fail webhook info refresh
        }
    }, []);

    /**
     * Refresh all status information
     */
    const refresh = useCallback(async (): Promise<void> => {
        if (options?.token) {
            await verifyToken(options.token);
            await refreshWebhookInfo(options.token);
        }
    }, [options?.token, verifyToken, refreshWebhookInfo]);

    // Initial token verification if provided
    useEffect(() => {
        if (options?.token) {
            refresh();
        }
    }, [options?.token]);

    return {
        status,
        webhookInfo,
        isLoading,
        error,
        verifyToken,
        setWebhook,
        deleteWebhook,
        refresh,
    };
}
