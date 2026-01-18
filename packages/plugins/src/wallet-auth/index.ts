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
import {
  generateAuthProvider,
  generateConnectButton,
  generateAuthHooks,
  generateProtectedRoute,
  generateWagmiConfig,
} from './templates';

/**
 * Wallet Authentication Plugin
 * Generates wallet connection and authentication flows
 */
export class WalletAuthPlugin extends BasePlugin<z.infer<typeof WalletAuthConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'wallet-auth',
    name: 'Wallet Authentication',
    version: '0.1.0',
    description: 'Wallet connection with WalletConnect, social login, and SIWE',
    category: 'app',
    tags: ['wallet', 'authentication', 'walletconnect', 'siwe', 'web3auth'],
  };

  readonly configSchema = WalletAuthConfig as unknown as z.ZodType<z.infer<typeof WalletAuthConfig>>;

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
      walletConnectEnabled: true,
      siweEnabled: true,
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

    const libDir = 'src/lib/auth';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/auth';
    const providersDir = 'src/providers';

    // Generate wagmi/viem config
    this.addFile(
      output,
      `${libDir}/wagmi-config.ts`,
      generateWagmiConfig(config)
    );

    // Generate auth provider component
    this.addFile(
      output,
      `${providersDir}/AuthProvider.tsx`,
      generateAuthProvider(config)
    );

    // Generate connect button component
    this.addFile(
      output,
      `${componentsDir}/ConnectButton.tsx`,
      generateConnectButton(config)
    );

    // Generate auth hooks
    this.addFile(
      output,
      `${hooksDir}/useAuth.ts`,
      generateAuthHooks(config)
    );

    // Generate protected route component
    if (config.sessionPersistence) {
      this.addFile(
        output,
        `${componentsDir}/ProtectedRoute.tsx`,
        generateProtectedRoute(config)
      );
    }

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'WalletConnect Cloud project ID', {
      required: config.walletConnectEnabled,
    });

    if (config.socialLogins.length > 0) {
      this.addEnvVar(output, 'NEXT_PUBLIC_WEB3AUTH_CLIENT_ID', 'Web3Auth client ID for social logins', {
        required: true,
      });
    }

    if (config.siweEnabled) {
      this.addEnvVar(output, 'NEXTAUTH_SECRET', 'Secret for SIWE session encryption', {
        required: true,
        secret: true,
      });
      this.addEnvVar(output, 'NEXTAUTH_URL', 'Base URL for NextAuth', {
        required: true,
        defaultValue: 'http://localhost:3000',
      });
    }

    // Add scripts
    this.addScript(output, 'auth:setup', 'echo "Configure WalletConnect project ID in .env.local"');

    // Add documentation
    this.addDoc(
      output,
      'docs/auth/wallet-auth.md',
      'Wallet Authentication',
      generateAuthDocs(config)
    );

    context.logger.info('Generated wallet authentication', {
      nodeId: node.id,
      provider: config.provider,
    });

    return output;
  }
}

function generateAuthDocs(config: z.infer<typeof WalletAuthConfig>): string {
  return `# Wallet Authentication

This module provides wallet connection and authentication functionality.

## Provider: ${config.provider}

## Features

- **WalletConnect v2**: ${config.walletConnectEnabled ? 'Enabled' : 'Disabled'}
- **SIWE (Sign-In With Ethereum)**: ${config.siweEnabled ? 'Enabled' : 'Disabled'}
- **Social Logins**: ${config.socialLogins.length > 0 ? config.socialLogins.join(', ') : 'None'}
- **Session Persistence**: ${config.sessionPersistence ? 'Enabled' : 'Disabled'}

## Setup

1. Get a WalletConnect project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Set the environment variables in \`.env.local\`:
   \`\`\`
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ${config.socialLogins.length > 0 ? 'NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_id' : ''}
   ${config.siweEnabled ? 'NEXTAUTH_SECRET=your_secret\n   NEXTAUTH_URL=http://localhost:3000' : ''}
   \`\`\`

## Usage

### Wrap your app with AuthProvider

\`\`\`tsx
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
\`\`\`

### Use the connect button

\`\`\`tsx
import { ConnectButton } from '@/components/auth/ConnectButton';

export default function Header() {
  return (
    <header>
      <ConnectButton />
    </header>
  );
}
\`\`\`

### Use the auth hook

\`\`\`tsx
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { address, isConnected, isAuthenticated } = useAuth();
  
  if (!isConnected) {
    return <p>Please connect your wallet</p>;
  }
  
  return <p>Connected: {address}</p>;
}
\`\`\`

${config.sessionPersistence ? `
### Protected Routes

\`\`\`tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
\`\`\`
` : ''}
`;
}

export { generateAuthProvider, generateConnectButton, generateAuthHooks };

