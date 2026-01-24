import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { WalletAuthConfig } from '@dapp-forge/blueprint-schema';

/**
 * Wallet Authentication Plugin
 *
 * This plugin copies the pre-built @cradle/wallet-auth component to the generated project
 * and configures wallet connection with RainbowKit.
 */
export class WalletAuthPlugin extends BasePlugin<z.infer<typeof WalletAuthConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'wallet-auth',
    name: 'Wallet Authentication',
    version: '0.1.0',
    description: 'Wallet connection with RainbowKit and WalletConnect',
    category: 'app',
    tags: ['wallet', 'authentication', 'rainbowkit', 'walletconnect', 'web3'],
  };

  readonly configSchema = WalletAuthConfig as unknown as z.ZodType<z.infer<typeof WalletAuthConfig>>;

  /**
   * Path to the pre-built component package (relative to project root)
   * The orchestrator will copy this entire directory to the output
   */
  readonly componentPath = 'packages/components/wallet-auth';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/wallet-auth';

  readonly ports: PluginPort[] = [
    {
      id: 'auth-out',
      name: 'Auth Context',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof WalletAuthConfig>> {
    return {
      provider: 'rainbowkit',
      appName: 'My DApp',
      siweEnabled: false,
      socialLogins: [],
      sessionPersistence: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Environment variables - WalletConnect is always required for rainbowkit
    const walletConnectRequired = config.provider === 'rainbowkit';
    this.addEnvVar(output, 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'WalletConnect Cloud project ID', {
      required: walletConnectRequired,
    });

    this.addEnvVar(output, 'NEXT_PUBLIC_APP_NAME', 'Application name for wallet dialogs', {
      required: false,
      defaultValue: config.appName || 'My DApp',
    });

    // Add setup script
    this.addScript(output, 'wallet:setup', 'echo "Get your WalletConnect Project ID from https://dashboard.reown.com"', 'Instructions for wallet setup');

    context.logger.info(`Generated wallet authentication: ${config.provider}`, {
      nodeId: node.id,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}
