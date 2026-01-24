'use client';

import { TrendingUp, Plus, Coins, ArrowRightLeft } from 'lucide-react';
import { useOstiumDependency } from '@/hooks/useOstiumDependency';
import { cn } from '@/lib/utils';

interface Props {
    nodeId: string;
    agentAddress?: string | null;
}

export function OstiumDependencyNotice({ nodeId, agentAddress }: Props) {
    const { hasOstiumTrading, addOstiumTradingBlock } = useOstiumDependency(nodeId);

    if (hasOstiumTrading) return null;

    return (
        <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Complete Your Setup</span>
            </div>

            <p className="text-xs text-forge-muted mb-3">
                Your Lazy Trader agent needs delegation and USDC approval to trade on Ostium.
                Add the <strong>Ostium Trading</strong> block to complete setup.
            </p>

            {agentAddress && (
                <div className="mb-3 p-2 rounded bg-forge-bg/50 border border-forge-border/30">
                    <p className="text-[10px] text-forge-muted mb-1">Agent Address:</p>
                    <p className="text-xs font-mono text-cyan-400 break-all">{agentAddress}</p>
                </div>
            )}

            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-forge-muted">
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Grant 1-Click Trading delegation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forge-muted">
                    <Coins className="w-3 h-3" />
                    <span>Approve USDC spending allowance</span>
                </div>
            </div>

            <button
                onClick={addOstiumTradingBlock}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors',
                    'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30',
                )}
            >
                <Plus className="w-3 h-3" />
                Add Ostium Trading to Canvas
            </button>
        </div>
    );
}
