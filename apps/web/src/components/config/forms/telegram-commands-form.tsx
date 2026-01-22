'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function TelegramCommandsForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const commandsList = [
        'start', 'help', 'balance', 'wallet',
        'subscribe', 'unsubscribe', 'settings', 'status'
    ];

    return (
        <div className="space-y-4">
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

            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Delivery Method</label>
                <Select
                    value={(config.deliveryMethod as string) ?? 'webhook'}
                    onValueChange={(v) => updateConfig('deliveryMethod', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="webhook">Webhook (Production)</SelectItem>
                        <SelectItem value="polling">Polling (Local Dev)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm text-white">Rate Limiting</span>
                <Switch
                    checked={(config.rateLimitEnabled as boolean) ?? true}
                    onCheckedChange={(v) => updateConfig('rateLimitEnabled', v)}
                />
            </div>

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

            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Commands</label>
                <div className="space-y-2">
                    {commandsList.map((cmd) => (
                        <div key={cmd} className="flex items-center justify-between">
                            <span className="text-sm text-white capitalize">{cmd}</span>
                            <Switch
                                checked={((config.commands as string[]) ?? ['start', 'help']).includes(cmd)}
                                onCheckedChange={(checked) => {
                                    const current = (config.commands as string[]) ?? ['start', 'help'];
                                    updateConfig('commands', checked ? [...current, cmd] : current.filter((c) => c !== cmd));
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
