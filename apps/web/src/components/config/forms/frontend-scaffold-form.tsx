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
        <div className="space-y-4">
            {/* Header Section */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-white">Next.js Web3 Scaffold</span>
                </div>
                <p className="text-[10px] text-forge-muted">
                    Generate a production-ready Next.js application with wagmi, RainbowKit, and smart contract integration.
                </p>
            </div>

            {/* App Configuration */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-medium text-white">App Configuration</span>
                </div>

                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">App Name</label>
                    <Input
                        value={appName}
                        onChange={(e) => updateConfig('appName', e.target.value)}
                        placeholder="My DApp"
                    />
                </div>

                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">Description</label>
                    <Textarea
                        value={appDescription}
                        onChange={(e) => updateConfig('appDescription', e.target.value)}
                        placeholder="A Web3 application built with Cradle"
                        className="h-16 resize-none"
                    />
                </div>
            </div>

            {/* Framework Selection */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-medium text-white">Framework</span>
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
                <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-medium text-white">Styling</span>
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

                <div className="flex items-center justify-between">
                    <span className="text-xs text-forge-muted">Dark Mode Support</span>
                    <Switch
                        checked={darkModeSupport}
                        onCheckedChange={(v) => updateConfig('darkModeSupport', v)}
                    />
                </div>
            </div>

            {/* Web3 Configuration */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-medium text-white">Web3 Features</span>
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

                <div className="space-y-2 p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('w-3 h-3', rainbowKit ? 'text-green-400' : 'text-forge-muted')} />
                            <span className="text-xs text-forge-muted">RainbowKit</span>
                        </div>
                        <Switch
                            checked={rainbowKit}
                            onCheckedChange={(v) => updateConfig('rainbowKit', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('w-3 h-3', walletConnect ? 'text-green-400' : 'text-forge-muted')} />
                            <span className="text-xs text-forge-muted">WalletConnect</span>
                        </div>
                        <Switch
                            checked={walletConnect}
                            onCheckedChange={(v) => updateConfig('walletConnect', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('w-3 h-3', siweAuth ? 'text-green-400' : 'text-forge-muted')} />
                            <span className="text-xs text-forge-muted">Sign-In With Ethereum (SIWE)</span>
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
                <div className="flex items-center gap-2 mb-2">
                    <FileCode className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-medium text-white">Smart Contract Integration</span>
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-forge-muted">Include Contracts Support</span>
                        <Switch
                            checked={includeContracts}
                            onCheckedChange={(v) => updateConfig('includeContracts', v)}
                        />
                    </div>

                    {includeContracts && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-forge-muted">Generate Contract Hooks</span>
                            <Switch
                                checked={generateContractHooks}
                                onCheckedChange={(v) => updateConfig('generateContractHooks', v)}
                            />
                        </div>
                    )}
                </div>

                {includeContracts && (
                    <div className="p-2 rounded bg-forge-elevated/50 flex items-start gap-2">
                        <Info className="w-3 h-3 text-accent-cyan mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-forge-muted">
                            Connect Stylus contract nodes to automatically generate type-safe React hooks for contract interaction.
                        </p>
                    </div>
                )}
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-medium text-white">Advanced Settings</span>
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30">
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

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-forge-muted">Server-Side Rendering</span>
                        <Switch
                            checked={ssrEnabled}
                            onCheckedChange={(v) => updateConfig('ssrEnabled', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-forge-muted">TypeScript Strict Mode</span>
                        <Switch
                            checked={strictMode}
                            onCheckedChange={(v) => updateConfig('strictMode', v)}
                        />
                    </div>
                </div>
            </div>

            {/* WalletConnect Setup Notice */}
            {walletConnect && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-medium text-white mb-1">Setup Required</p>
                            <p className="text-[10px] text-forge-muted mb-2">
                                You'll need a WalletConnect Project ID for mobile wallet support.
                            </p>
                            <a
                                href="https://cloud.walletconnect.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Get Project ID
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* What's Generated Preview */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-accent-cyan/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">What You'll Get</span>
                </div>
                <ul className="text-[10px] text-forge-muted space-y-1">
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
