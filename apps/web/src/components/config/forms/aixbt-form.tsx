'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Sparkles, TrendingUp, Zap, Search, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    nodeId: string;
    type: string;
    config: Record<string, unknown>;
}

export function AIXBTForm({ nodeId, type, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const Icon = type === 'aixbt-momentum' ? TrendingUp :
        type === 'aixbt-signals' ? Zap :
            type === 'aixbt-indigo' ? Sparkles : Search;

    return (
        <div className="space-y-4">
            <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-accent-cyan" />
                    <span className="text-sm font-medium text-white uppercase">{type.replace('aixbt-', '')}</span>
                </div>
                <p className="text-xs text-forge-muted">
                    Configure {type.replace('-', ' ')} settings for market intelligence.
                </p>
            </div>

            {/* Common Project ID Field */}
            {(type === 'aixbt-momentum' || type === 'aixbt-signals') && (
                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">Project ID</label>
                    <Input
                        type="text"
                        placeholder="e.g. bitcoin, ethereum"
                        value={(config.projectId as string) || ''}
                        onChange={(e) => updateConfig('projectId', e.target.value)}
                        className="text-xs h-8"
                    />
                </div>
            )}

            {/* Momentum specific */}
            {type === 'aixbt-momentum' && (
                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">Interval</label>
                    <Select
                        value={(config.interval as string) || '24h'}
                        onValueChange={(v) => updateConfig('interval', v)}
                    >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">1 Hour</SelectItem>
                            <SelectItem value="4h">4 Hours</SelectItem>
                            <SelectItem value="24h">24 Hours</SelectItem>
                            <SelectItem value="7d">7 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Signals specific */}
            {type === 'aixbt-signals' && (
                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">Min Conviction Score</label>
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={(config.minConvictionScore as number) || 0.7}
                        onChange={(e) => updateConfig('minConvictionScore', parseFloat(e.target.value))}
                        className="text-xs h-8"
                    />
                </div>
            )}

            {/* Indigo specific */}
            {type === 'aixbt-indigo' && (
                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">Model</label>
                    <Select
                        value={(config.model as string) || 'indigo-mini'}
                        onValueChange={(v) => updateConfig('model', v)}
                    >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="indigo-mini">Indigo Mini (Fast)</SelectItem>
                            <SelectItem value="indigo-full">Indigo Full (Deep Research)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
                <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
                <p className="text-[10px] text-forge-muted leading-relaxed">
                    AIXBT Intelligence data is fetched via the AIXBT API. Ensure your API key is configured in the generated code environment.
                </p>
            </div>
        </div>
    );
}
