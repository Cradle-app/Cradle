'use client';

import { AlertTriangle, Plus } from 'lucide-react';
import { useWalletDependency } from '@/hooks/useWalletDependency';
import { cn } from '@/lib/utils';

interface Props {
    nodeId: string;
}

export function WalletDependencyNotice({ nodeId }: Props) {
    const { hasWalletAuth, addWalletAuthBlock } = useWalletDependency(nodeId);

    if (hasWalletAuth) return null;

    return (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">Wallet Connection Required</span>
            </div>
            <p className="text-xs text-forge-muted mb-3">
                This block requires wallet authentication. Add the Wallet Auth block to your canvas to enable wallet connection.
            </p>
            <button
                onClick={addWalletAuthBlock}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors',
                    'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
                )}
            >
                <Plus className="w-3 h-3" />
                Add Wallet Auth to Canvas
            </button>
        </div>
    );
}
