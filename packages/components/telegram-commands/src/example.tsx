/**
 * @cradle/telegram-commands
 * 
 * Example usage component demonstrating the Telegram bot integration
 */

import React, { useState } from 'react';
import { useTelegramBot } from './hooks';
import type { DefaultCommand } from './constants';

interface TelegramBotSetupProps {
    /** Initial bot token */
    initialToken?: string;
    /** Enabled commands */
    commands?: DefaultCommand[];
    /** Webhook URL for production */
    webhookUrl?: string;
    /** Callback when setup is complete */
    onComplete?: (token: string) => void;
}

/**
 * Example component for setting up a Telegram bot
 * 
 * This component demonstrates how to use the useTelegramBot hook
 * for verifying bot tokens and managing webhook configuration.
 */
export function TelegramBotSetup({
    initialToken = '',
    commands = ['start', 'help'],
    webhookUrl,
    onComplete,
}: TelegramBotSetupProps) {
    const [token, setToken] = useState(initialToken);
    const { status, webhookInfo, isLoading, error, verifyToken, setWebhook } = useTelegramBot();

    const handleVerify = async () => {
        if (!token.trim()) return;

        const result = await verifyToken(token);
        if (result.isRunning && onComplete) {
            onComplete(token);
        }
    };

    const handleSetWebhook = async () => {
        if (!webhookUrl) return;
        await setWebhook(webhookUrl);
    };

    return (
        <div style={{ padding: '16px', fontFamily: 'system-ui' }}>
            <h2>🤖 Telegram Bot Setup</h2>

            {/* Token Input */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Bot Token
                </label>
                <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your bot token from @BotFather"
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                    }}
                />
            </div>

            {/* Verify Button */}
            <button
                onClick={handleVerify}
                disabled={isLoading || !token.trim()}
                style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0088cc',
                    color: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !token.trim() ? 0.6 : 1,
                }}
            >
                {isLoading ? 'Verifying...' : 'Verify Token'}
            </button>

            {/* Status Display */}
            {status && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '6px',
                    background: status.isRunning ? '#e8f5e9' : '#ffebee',
                }}>
                    {status.isRunning ? (
                        <>
                            <p style={{ margin: 0, color: '#2e7d32' }}>
                                ✅ Bot verified: @{status.username}
                            </p>
                            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
                                Bot ID: {status.botId}
                            </p>
                        </>
                    ) : (
                        <p style={{ margin: 0, color: '#c62828' }}>
                            ❌ {status.error || 'Failed to verify token'}
                        </p>
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '6px',
                    background: '#ffebee',
                    color: '#c62828',
                }}>
                    {error.message}
                </div>
            )}

            {/* Commands Preview */}
            {status?.isRunning && (
                <div style={{ marginTop: '16px' }}>
                    <h3>📋 Enabled Commands</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {commands.map(cmd => (
                            <li key={cmd}>/{cmd}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Webhook Setup */}
            {status?.isRunning && webhookUrl && (
                <div style={{ marginTop: '16px' }}>
                    <h3>🔗 Webhook Setup</h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                        URL: {webhookUrl}
                    </p>
                    <button
                        onClick={handleSetWebhook}
                        disabled={isLoading}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #0088cc',
                            background: 'white',
                            color: '#0088cc',
                            cursor: 'pointer',
                        }}
                    >
                        Set Webhook
                    </button>
                    {webhookInfo?.isActive && (
                        <p style={{ marginTop: '8px', fontSize: '12px', color: '#2e7d32' }}>
                            ✅ Webhook active
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default TelegramBotSetup;
