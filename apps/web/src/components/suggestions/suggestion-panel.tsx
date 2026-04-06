'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    CreditCard,
    Bot,
    Layout,
    ShieldCheck,
    Wallet,
    Link,
    Globe,
    Database,
    HardDrive,
    Layers,
    Lock,
    ArrowLeftRight,
    Key,
    Sparkles,
    TrendingUp,
    Zap,
    Coins,
    Search,
    Plus,
    X,
    GitBranch,
    ListTree,
    Mail,
    Timer,
    Variable,
    Shuffle,
    Repeat,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestedPlugins, type SuggestedPlugin } from '@/hooks/use-suggested-plugins';
import { useBlueprintStore } from '@/store/blueprint';
import type { PluginIcon } from '@cradle/plugin-config';

/**
 * Icon mapping for plugin icons
 */
const ICON_MAP: Record<PluginIcon, LucideIcon> = {
    Box,
    CreditCard,
    Bot,
    Layout,
    ShieldCheck,
    Wallet,
    Globe,
    Database,
    Link,
    HardDrive,
    Layers,
    Lock,
    ArrowLeftRight,
    Key,
    Sparkles,
    TrendingUp,
    Zap,
    Coins,
    Search,
    GitBranch,
    ListTree,
    Mail,
    Timer,
    Variable,
    Shuffle,
    Repeat,
};

function getIconComponent(iconName: PluginIcon): LucideIcon {
    return ICON_MAP[iconName] || Box;
}

interface SuggestedPluginCardProps {
    plugin: SuggestedPlugin;
    onAdd: (pluginId: string) => void;
}

function SuggestedPluginCard({ plugin, onAdd }: SuggestedPluginCardProps) {
    const Icon = getIconComponent(plugin.icon);

    const reasonLabel = {
        required: 'Required',
        suggested: 'Recommended',
        compatible: 'Compatible',
    };

    const reasonColor = {
        required: 'text-red-400 bg-red-500/10 border-red-500/30',
        suggested: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30',
        compatible: 'text-green-400 bg-green-500/10 border-green-500/30',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={cn(
                'group relative p-3 rounded-xl cursor-pointer',
                'bg-forge-surface/80 backdrop-blur-sm border border-forge-border/50',
                'hover:border-accent-cyan/50 hover:bg-forge-elevated/80',
                'transition-all duration-200'
            )}
            onClick={() => onAdd(plugin.id)}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        'bg-gradient-to-br transition-all duration-200',
                        `from-${plugin.color}/20 to-${plugin.color}/5`,
                        'group-hover:from-' + plugin.color + '/30 group-hover:to-' + plugin.color + '/10'
                    )}
                >
                    <Icon className={cn('w-5 h-5', `text-${plugin.color}`)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate group-hover:text-accent-cyan transition-colors">
                            {plugin.name}
                        </p>
                        <span
                            className={cn(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                                reasonColor[plugin.reason]
                            )}
                        >
                            {reasonLabel[plugin.reason]}
                        </span>
                    </div>
                    <p className="text-xs text-forge-muted truncate leading-relaxed">
                        {plugin.description}
                    </p>
                </div>

                {/* Add button */}
                <button
                    className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        'bg-accent-cyan/10 text-accent-cyan',
                        'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                        'hover:bg-accent-cyan/20'
                    )}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

interface SuggestionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    anchorPosition?: { x: number; y: number };
}

/**
 * Panel that shows suggested plugins based on current canvas nodes.
 * Triggered by user action (button click or right-click).
 */
export function SuggestionPanel({ isOpen, onClose, anchorPosition }: SuggestionPanelProps) {
    const { suggestions, hasSuggestions } = useSuggestedPlugins();
    const addNode = useBlueprintStore((state) => state.addNode);

    const handleAddPlugin = useCallback(
        (pluginId: string) => {
            // Add the node at a default position or near anchor
            const position = anchorPosition
                ? { x: anchorPosition.x + 50, y: anchorPosition.y + 50 }
                : { x: 400, y: 300 };

            addNode(pluginId, position);
            onClose();
        },
        [addNode, anchorPosition, onClose]
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-[400px] max-h-[500px] overflow-hidden',
                        'bg-forge-surface border border-forge-border rounded-2xl shadow-2xl'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-forge-border/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-accent-cyan/10">
                                <Sparkles className="w-4 h-4 text-accent-cyan" />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Suggested Plugins</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-forge-elevated/50 text-forge-muted hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {hasSuggestions ? (
                            suggestions.map((plugin) => (
                                <SuggestedPluginCard
                                    key={plugin.id}
                                    plugin={plugin}
                                    onAdd={handleAddPlugin}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-forge-muted">
                                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No suggestions available</p>
                                <p className="text-xs mt-1 opacity-70">
                                    Add more plugins to see compatibility recommendations
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Simple button to trigger the suggestion panel
 */
export function ShowSuggestionsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { hasSuggestions, suggestions } = useSuggestedPlugins();

    if (!hasSuggestions) return null;

    return (
        <>
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    'fixed bottom-6 right-6 z-40',
                    'flex items-center gap-2 px-4 py-2.5',
                    'bg-accent-cyan/10 backdrop-blur-md border border-accent-cyan/30',
                    'rounded-full text-accent-cyan text-sm font-medium',
                    'hover:bg-accent-cyan/20 hover:border-accent-cyan/50',
                    'shadow-lg shadow-accent-cyan/10',
                    'transition-all duration-200'
                )}
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="w-4 h-4" />
                <span>Show Suggestions</span>
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-accent-cyan/20">
                    {suggestions.length}
                </span>
            </motion.button>

            <SuggestionPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
