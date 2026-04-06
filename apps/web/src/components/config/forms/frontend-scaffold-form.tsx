'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Layout,
    Code2,
    Palette,
    Wallet,
    FileCode,
    Settings2,
    Info,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    formStyles,
    labelStyles,
    cardStyles,
    sectionHeaderStyles,
} from './shared-styles';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function FrontendScaffoldForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    // Extract config values with defaults
    const framework = (config.framework as string) ?? 'nextjs';
    const styling = (config.styling as string) ?? 'tailwind';
    const web3Provider = (config.web3Provider as string) ?? 'wagmi-viem';
    const walletConnect = (config.walletConnect as boolean) ?? true;
    const rainbowKit = (config.rainbowKit as boolean) ?? true;
    const siweAuth = (config.siweAuth as boolean) ?? false;
    const includeContracts = (config.includeContracts as boolean) ?? true;
    const generateContractHooks = (config.generateContractHooks as boolean) ?? true;
    const projectStructure = (config.projectStructure as string) ?? 'app-router';
    const stateManagement = (config.stateManagement as string) ?? 'tanstack-query';
    const ssrEnabled = (config.ssrEnabled as boolean) ?? true;
    const darkModeSupport = (config.darkModeSupport as boolean) ?? true;
    const strictMode = (config.strictMode as boolean) ?? true;
    const appName = (config.appName as string) ?? 'My DApp';
    const appDescription = (config.appDescription as string) ?? '';

    return (
        <div className={formStyles.container}>
            {/* Header Section */}
            <div className={cn(
                'p-3.5 rounded-xl',
                'bg-gradient-to-r from-[hsl(var(--color-accent-secondary)/0.1)] via-[hsl(var(--color-bg-muted)/0.5)] to-transparent',
                'border border-[hsl(var(--color-accent-secondary)/0.2)]'
            )}>
                <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-[hsl(var(--color-accent-secondary))]" />
                    <span className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">Next.js Web3 Scaffold</span>
                </div>
                <p className="text-[11px] text-[hsl(var(--color-text-muted))] leading-relaxed">
                    Generate a production-ready Next.js application with wagmi, RainbowKit, and smart contract integration.
                </p>
            </div>

            {/* App Configuration */}
            <div className="space-y-3">
                <div className={sectionHeaderStyles.wrapper}>
                    <Settings2 className={sectionHeaderStyles.icon} />
                    <span className={sectionHeaderStyles.title}>App Configuration</span>
                </div>

                <div className={formStyles.section}>
                    <label className={labelStyles.base}>App Name</label>
                    <Input
                        value={appName}
                        onChange={(e) => updateConfig('appName', e.target.value)}
                        placeholder="My DApp"
                    />
                </div>

                <div className={formStyles.section}>
                    <label className={labelStyles.base}>Description</label>
                    <Textarea
                        value={appDescription}
                        onChange={(e) => updateConfig('appDescription', e.target.value)}
                        placeholder="An application composed with [N]skills"
                        className="h-16 resize-none"
                    />
                </div>
            </div>

            {/* Framework Selection */}
            <div className="space-y-3">
                <div className={sectionHeaderStyles.wrapper}>
                    <Code2 className={sectionHeaderStyles.icon} />
                    <span className={sectionHeaderStyles.title}>Framework</span>
                </div>

                <Select value={framework} onValueChange={(v) => updateConfig('framework', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="nextjs">Next.js 14 (App Router)</SelectItem>
                        <SelectItem value="vite-react" disabled>
                            Vite + React (Coming Soon)
                        </SelectItem>
                        <SelectItem value="remix" disabled>
                            Remix (Coming Soon)
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select value={projectStructure} onValueChange={(v) => updateConfig('projectStructure', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="app-router">App Router (Recommended)</SelectItem>
                        <SelectItem value="pages-router">Pages Router</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Styling */}
            <div className="space-y-3">
                <div className={sectionHeaderStyles.wrapper}>
                    <Palette className={sectionHeaderStyles.icon} />
                    <span className={sectionHeaderStyles.title}>Styling</span>
                </div>

                <Select value={styling} onValueChange={(v) => updateConfig('styling', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                        <SelectItem value="css-modules">CSS Modules</SelectItem>
                        <SelectItem value="styled-components">Styled Components</SelectItem>
                        <SelectItem value="vanilla">Vanilla CSS</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-[hsl(var(--color-text-muted))]">Dark Mode Support</span>
                    <Switch
                        checked={darkModeSupport}
                        onCheckedChange={(v) => updateConfig('darkModeSupport', v)}
                    />
                </div>
            </div>

            {/* Web3 Configuration */}
            <div className="space-y-3">
                <div className={sectionHeaderStyles.wrapper}>
                    <Wallet className={sectionHeaderStyles.icon} />
                    <span className={sectionHeaderStyles.title}>Web3 Features</span>
                </div>

                <Select value={web3Provider} onValueChange={(v) => updateConfig('web3Provider', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="wagmi-viem">wagmi + viem (Recommended)</SelectItem>
                        <SelectItem value="ethers-v6">ethers.js v6</SelectItem>
                    </SelectContent>
                </Select>

                <div className={cardStyles.base}>
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('w-3 h-3', rainbowKit ? 'text-[hsl(var(--color-success))]' : 'text-[hsl(var(--color-text-disabled))]')} />
                            <span className="text-xs text-[hsl(var(--color-text-muted))]">RainbowKit</span>
                        </div>
                        <Switch
                            checked={rainbowKit}
                            onCheckedChange={(v) => updateConfig('rainbowKit', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('w-3 h-3', walletConnect ? 'text-[hsl(var(--color-success))]' : 'text-[hsl(var(--color-text-disabled))]')} />
                            <span className="text-xs text-[hsl(var(--color-text-muted))]">WalletConnect</span>
                        </div>
                        <Switch
                            checked={walletConnect}
                            onCheckedChange={(v) => updateConfig('walletConnect', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('w-3 h-3', siweAuth ? 'text-[hsl(var(--color-success))]' : 'text-[hsl(var(--color-text-disabled))]')} />
                            <span className="text-xs text-[hsl(var(--color-text-muted))]">Sign-In With Ethereum (SIWE)</span>
                        </div>
                        <Switch
                            checked={siweAuth}
                            onCheckedChange={(v) => updateConfig('siweAuth', v)}
                        />
                    </div>
                </div>
            </div>

            {/* Smart Contracts */}
            <div className="space-y-3">
                <div className={sectionHeaderStyles.wrapper}>
                    <FileCode className={sectionHeaderStyles.icon} />
                    <span className={sectionHeaderStyles.title}>Smart Contract Integration</span>
                </div>

                <div className={cardStyles.base}>
                    <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-[hsl(var(--color-text-muted))]">Include Contracts Support</span>
                        <Switch
                            checked={includeContracts}
                            onCheckedChange={(v) => updateConfig('includeContracts', v)}
                        />
                    </div>

                    {includeContracts && (
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-[hsl(var(--color-text-muted))]">Generate Contract Hooks</span>
                            <Switch
                                checked={generateContractHooks}
                                onCheckedChange={(v) => updateConfig('generateContractHooks', v)}
                            />
                        </div>
                    )}
                </div>

                {includeContracts && (
                    <div className={cardStyles.info}>
                        <div className="flex items-start gap-2">
                            <Info className="w-3 h-3 text-[hsl(var(--color-info))] mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-[hsl(var(--color-info))] leading-relaxed">
                                Connect Stylus contract nodes to automatically generate type-safe React hooks for contract interaction.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
                <div className={sectionHeaderStyles.wrapper}>
                    <Settings2 className={sectionHeaderStyles.icon} />
                    <span className={sectionHeaderStyles.title}>Advanced Settings</span>
                </div>

                <div className={cardStyles.base}>
                    <Select value={stateManagement} onValueChange={(v) => updateConfig('stateManagement', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tanstack-query">TanStack Query (Recommended)</SelectItem>
                            <SelectItem value="zustand">Zustand</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between py-1 mt-2">
                        <span className="text-xs text-[hsl(var(--color-text-muted))]">Server-Side Rendering</span>
                        <Switch
                            checked={ssrEnabled}
                            onCheckedChange={(v) => updateConfig('ssrEnabled', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-[hsl(var(--color-text-muted))]">TypeScript Strict Mode</span>
                        <Switch
                            checked={strictMode}
                            onCheckedChange={(v) => updateConfig('strictMode', v)}
                        />
                    </div>
                </div>
            </div>

            {/* WalletConnect Setup Notice */}
            {walletConnect && (
                <div className={cardStyles.warning}>
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-warning))] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-medium text-[hsl(var(--color-text-primary))] mb-1">Setup Required</p>
                            <p className="text-[10px] text-[hsl(var(--color-text-muted))] mb-2 leading-relaxed">
                                You'll need a WalletConnect Project ID for mobile wallet support.
                            </p>
                            <a
                                href="https://cloud.walletconnect.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Get Project ID
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* What's Generated Preview */}
            <div className={cardStyles.success}>
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--color-success))]" />
                    <span className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">What You'll Get</span>
                </div>
                <ul className="text-[10px] text-[hsl(var(--color-text-muted))] space-y-1 leading-relaxed">
                    <li>• Next.js 14 application with {projectStructure === 'app-router' ? 'App Router' : 'Pages Router'}</li>
                    <li>• {styling === 'tailwind' ? 'Tailwind CSS' : styling} styling{darkModeSupport ? ' with dark mode' : ''}</li>
                    <li>• wagmi + viem Web3 integration</li>
                    {rainbowKit && <li>• RainbowKit wallet connection UI</li>}
                    {siweAuth && <li>• Sign-In With Ethereum authentication</li>}
                    {includeContracts && <li>• Type-safe contract interaction hooks</li>}
                    <li>• {stateManagement === 'tanstack-query' ? 'TanStack Query' : stateManagement} state management</li>
                </ul>
            </div>
        </div>
    );
}
