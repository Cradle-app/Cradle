'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bot, Zap, Terminal, Globe, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function TelegramCommandsForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();
    const [webhookUrl, setWebhookUrl] = useState<string>((config.webhookUrl as string) ?? '');

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const commandsList = [
        'start', 'help', 'balance', 'wallet',
        'subscribe', 'unsubscribe', 'settings', 'status'
    ];

    const deliveryMethod = (config.deliveryMethod as string) ?? 'webhook';

    // Get enabled commands
    const enabledCommands = (config.commands as string[]) ?? ['start', 'help'];

    return (
        <div className="space-y-4">
            {/* Status Overview */}
            <div className={cn(
                'p-3 rounded-lg border',
                'border-forge-border/50 bg-forge-bg/50'
            )}>
                <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-accent-cyan" />
                    <span className="text-sm font-medium text-white">Telegram Bot</span>
                </div>
                <p className="text-xs text-forge-muted">
                    Configure your Telegram bot for command handling.
                </p>
            </div>

            {/* Bot Token Info */}
            <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                <label className="text-xs text-forge-muted mb-1.5 block">Bot Token</label>
                <p className="text-xs text-forge-muted">
                    You will provide your bot token as an environment variable in the generated project.
                </p>
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                    <div className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-[10px] text-blue-200 space-y-1">
                            <div>
                                The generated code expects <code className="bg-blue-500/20 px-1 rounded">TELEGRAM_BOT_TOKEN</code>.
                            </div>
                            <div>
                                You can get a token from <a className="text-accent-cyan hover:underline" href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a>.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Webhook URL (configuration only) */}
            {deliveryMethod === 'webhook' && (
                <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                    <label className="text-xs text-forge-muted mb-1.5 block">Webhook URL</label>
                    <Input
                        type="url"
                        placeholder="https://your-domain.com/api/telegram/webhook"
                        value={webhookUrl}
                        onChange={(e) => {
                            const nextUrl = e.target.value;
                            setWebhookUrl(nextUrl);
                            updateConfig('webhookUrl', nextUrl);
                        }}
                        className="text-xs h-8 font-mono flex-1"
                    />
                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        <div className="flex items-start gap-2">
                            <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-200">
                                Webhook URL should point to your deployed Next.js API route at <code className="bg-blue-500/20 px-1 rounded">/api/telegram/webhook</code>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Framework */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Framework</label>
                <Select
                    value={(config.framework as string) ?? 'grammy'}
                    onValueChange={(v) => updateConfig('framework', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grammy">grammY (Modern)</SelectItem>
                        <SelectItem value="telegraf">Telegraf</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Delivery Method */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Delivery Method</label>
                <Select
                    value={deliveryMethod}
                    onValueChange={(v) => updateConfig('deliveryMethod', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="webhook">
                            <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3" />
                                Webhook (Production)
                            </div>
                        </SelectItem>
                        <SelectItem value="polling">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3 h-3" />
                                Polling (Local Dev)
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-forge-muted mt-1">
                    {deliveryMethod === 'webhook'
                        ? 'Webhook mode for production deployments.'
                        : 'Polling mode for local development.'}
                </p>
            </div>

            {/* Rate Limiting */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <span className="text-sm text-white">Rate Limiting</span>
                    <p className="text-[10px] text-forge-muted">Prevent spam and abuse</p>
                </div>
                <Switch
                    checked={(config.rateLimitEnabled as boolean) ?? true}
                    onCheckedChange={(v) => updateConfig('rateLimitEnabled', v)}
                />
            </div>

            {/* Chat Flow */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <span className="text-sm text-white">Standard Chat Flow</span>
                    <p className="text-[10px] text-forge-muted">Handle non-command messages</p>
                </div>
                <Switch
                    checked={(config.chatFlowEnabled as boolean) ?? false}
                    onCheckedChange={(v) => updateConfig('chatFlowEnabled', v)}
                />
            </div>

            {/* Commands */}
            <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                <label className="text-xs text-forge-muted mb-2 block">Enabled Commands</label>
                <div className="grid grid-cols-2 gap-2">
                    {commandsList.map((cmd) => (
                        <div key={cmd} className="flex items-center justify-between p-2 rounded bg-forge-elevated/50">
                            <span className="text-sm text-white">/{cmd}</span>
                            <Switch
                                checked={enabledCommands.includes(cmd)}
                                onCheckedChange={(checked) => {
                                    const current = enabledCommands;
                                    updateConfig('commands', checked
                                        ? [...current, cmd]
                                        : current.filter((c) => c !== cmd)
                                    );
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Box */}
            <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                <div className="flex items-start gap-2">
                    <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
                    <div className="text-[10px] text-forge-muted space-y-1">
                        <p>The generated code will include:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                            <li>grammY bot client with your commands</li>
                            <li>{deliveryMethod === 'webhook' ? 'Next.js API route for webhooks' : 'Polling script for local dev'}</li>
                            <li>React hook for bot management</li>
                            <li>Full TypeScript types</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Setup Complete */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-accent-cyan/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Ready for Code Generation</span>
                </div>
                <p className="text-xs text-forge-muted">
                    Your Telegram bot configuration will be included in the generated project.
                </p>
            </div>
        </div>
    );
}
