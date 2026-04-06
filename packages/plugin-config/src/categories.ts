import { CategoryDefinition, PluginCategory } from './types';

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    {
        id: 'contracts',
        name: 'Contracts',
        icon: 'Box',
        color: 'node-contracts',
    },
    {
        id: 'agents',
        name: 'Agents',
        icon: 'Bot',
        color: 'node-agents',
    },
    {
        id: 'superposition',
        name: 'Superposition',
        icon: 'Layers',
        color: 'accent-cyan',
    },
    {
        id: 'robinhood',
        name: 'Robinhood Chain',
        icon: 'Layers',
        color: 'accent-green',
    },
    {
        id: 'analytics',
        name: 'Analytics',
        icon: 'Database',
        color: 'accent-purple',
    },
    {
        id: 'payments',
        name: 'Payments',
        icon: 'CreditCard',
        color: 'accent-green'
    },
    {
        id: 'protocols',
        name: 'Protocols',
        icon: 'Globe',
        color: 'accent-cyan'
    },
    {
        id: 'app',
        name: 'Application',
        icon: 'Layout',
        color: 'accent-blue'
    },
    {
        id: 'quality',
        name: 'Quality Assurance',
        icon: 'ShieldCheck',
        color: 'accent-orange'
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: 'Globe',
        color: 'accent-sky'
    },
    {
        id: 'intelligence',
        name: 'Intelligence',
        icon: 'Sparkles',
        color: 'accent-pink'
    },
    {
        id: 'logic',
        name: 'Logic & Automation',
        icon: 'Zap',
        color: 'accent-amber',
    },
];

export const getCategoryById = (id: PluginCategory): CategoryDefinition | undefined => {
    return CATEGORY_DEFINITIONS.find(category => category.id === id);
};

export const getCategoryIds = (): PluginCategory[] => {
    return CATEGORY_DEFINITIONS.map(category => category.id);
};

export const PROTOCOL_PLUGIN_IDS = [
    'aave',
    'compound',
    'chainlink',
    'pyth',
    'uniswap',
] as const;

