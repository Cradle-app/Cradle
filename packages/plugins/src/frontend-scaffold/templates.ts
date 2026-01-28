import type { z } from 'zod';
import type { FrontendScaffoldConfig } from '@dapp-forge/blueprint-schema';
import type { ExecutionContext } from '@dapp-forge/plugin-sdk';
import { dedent } from '@dapp-forge/plugin-sdk';

type Config = z.infer<typeof FrontendScaffoldConfig>;

/**
 * Generate package.json for the Next.js app
 */
export function generatePackageJson(config: Config): string {
  const appName = config.appName.toLowerCase().replace(/\s+/g, '-');

  const dependencies: Record<string, string> = {
    'next': '^14.2.0',
    'react': '^18.3.0',
    'react-dom': '^18.3.0',
  };

  const devDependencies: Record<string, string> = {
    '@types/node': '^20.0.0',
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    'typescript': '^5.4.0',
    'eslint': '^8.57.0',
    'eslint-config-next': '^14.2.0',
  };

  // Web3 dependencies
  if (config.web3Provider === 'wagmi-viem') {
    dependencies['wagmi'] = '^2.12.0';
    dependencies['viem'] = '^2.21.0';
    dependencies['@tanstack/react-query'] = '^5.51.0';
  }

  if (config.rainbowKit) {
    dependencies['@rainbow-me/rainbowkit'] = '^2.1.0';
  }

  if (config.siweAuth) {
    dependencies['siwe'] = '^2.3.0';
    dependencies['next-auth'] = '^4.24.0';
  }

  // Styling dependencies
  if (config.styling === 'tailwind') {
    devDependencies['tailwindcss'] = '^3.4.0';
    devDependencies['postcss'] = '^8.4.0';
    devDependencies['autoprefixer'] = '^10.4.0';
  }

  // State management
  if (config.stateManagement === 'zustand') {
    dependencies['zustand'] = '^4.5.0';
  }

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies,
    devDependencies,
  };

  return JSON.stringify(packageJson, null, 2);
}

/**
 * Generate next.config.js
 */
export function generateNextConfig(config: Config): string {
  return dedent(`
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      reactStrictMode: ${config.strictMode},
      ${config.ssrEnabled ? '' : 'ssr: false,'}
      webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
      },
    };

    module.exports = nextConfig;
  `);
}

/**
 * Generate tsconfig.json
 */
export function generateTsConfig(config: Config): string {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      lib: ['dom', 'dom.iterable', 'ES2020'],
      allowJs: true,
      skipLibCheck: true,
      strict: config.strictMode,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': [config.srcDirectory ? './src/*' : './*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  return JSON.stringify(tsConfig, null, 2);
}

/**
 * Generate app/layout.tsx - Root layout with providers
 */
export function generateAppLayout(config: Config): string {
  const imports = [
    `import type { Metadata } from 'next';`,
    `import { Inter } from 'next/font/google';`,
    `import './globals.css';`,
    `import { Providers } from './providers';`,
  ];

  return dedent(`
    ${imports.join('\n')}

    const inter = Inter({ subsets: ['latin'] });

    export const metadata: Metadata = {
      title: '${config.appName}',
      description: '${config.appDescription || 'A Web3 application built with Cradle'}',
    };

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <html lang="en"${config.darkModeSupport ? ' suppressHydrationWarning' : ''}>
          <body className={inter.className}>
            <Providers>
              {children}
            </Providers>
          </body>
        </html>
      );
    }
  `);
}

/**
 * Generate app/providers.tsx - Web3 providers wrapper
 */
export function generateProviders(config: Config): string {
  const imports: string[] = [
    `'use client';`,
    ``,
    `import { useState } from 'react';`,
  ];

  // Add Web3 imports
  if (config.web3Provider === 'wagmi-viem') {
    imports.push(`import { WagmiProvider } from 'wagmi';`);
    imports.push(`import { QueryClient, QueryClientProvider } from '@tanstack/react-query';`);
    imports.push(`import { wagmiConfig } from '@/lib/wagmi';`);
  }

  if (config.rainbowKit) {
    imports.push(`import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';`);
    imports.push(`import '@rainbow-me/rainbowkit/styles.css';`);
  }

  let providerNesting = '{children}';

  if (config.rainbowKit) {
    providerNesting = `
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme(),
            darkMode: darkTheme(),
          }}
        >
          ${providerNesting}
        </RainbowKitProvider>`;
  }

  if (config.web3Provider === 'wagmi-viem') {
    providerNesting = `
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          ${providerNesting}
        </QueryClientProvider>
      </WagmiProvider>`;
  }

  return dedent(`
    ${imports.join('\n')}

    export function Providers({ children }: { children: React.ReactNode }) {
      const [queryClient] = useState(() => new QueryClient());

      return (
        ${providerNesting}
      );
    }
  `);
}

/**
 * Generate lib/wagmi.ts - wagmi configuration
 */
export function generateWagmiConfig(config: Config, context: ExecutionContext): string {
  const hasSuperposition = context.nodeOutputs?.has('superposition-network');

  return dedent(`
    import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
    ${config.rainbowKit ? `import { getDefaultConfig } from '@rainbow-me/rainbowkit';` : ''}
    import { chains } from './chains';

    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

    ${config.rainbowKit ? `
    export const wagmiConfig = getDefaultConfig({
      appName: process.env.NEXT_PUBLIC_APP_NAME || '${config.appName}',
      projectId,
      chains: chains,
      ssr: ${config.ssrEnabled},
      ${config.ssrEnabled ? `storage: createStorage({
        storage: cookieStorage,
      }),` : ''}
    });
    ` : `
    export const wagmiConfig = createConfig({
      chains: chains,
      transports: Object.fromEntries(
        chains.map((chain) => [chain.id, http()])
      ),
      ${config.ssrEnabled ? `ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),` : ''}
    });
    `}

    declare module 'wagmi' {
      interface Register {
        config: typeof wagmiConfig;
      }
    }
  `);
}

/**
 * Generate lib/chains.ts - Chain definitions
 */
export function generateChainConfig(config: Config, context: ExecutionContext): string {
  const imports = [`import { type Chain } from 'viem';`];

  // Check for Superposition network integration via pathContext.nodeTypes
  const nodeTypes = context.pathContext?.nodeTypes ?? new Set<string>();
  const hasSuperposition = nodeTypes.has('superposition-network') ||
    nodeTypes.has('superposition-faucet') ||
    nodeTypes.has('superposition-thirdweb') ||
    nodeTypes.has('superposition-longtail');

  if (hasSuperposition) {
    // Include Superposition chain definitions with all common chains
    imports.push(`import { mainnet, sepolia, arbitrum, arbitrumSepolia } from 'viem/chains';`);

    return dedent(`
      ${imports.join('\n')}

      // Superposition Mainnet chain configuration
      export const superposition: Chain = {
        id: 55244,
        name: 'Superposition',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [process.env.NEXT_PUBLIC_SUPERPOSITION_RPC_URL || 'https://rpc.superposition.so'],
          },
        },
        blockExplorers: {
          default: {
            name: 'Superposition Explorer',
            url: 'https://explorer.superposition.so',
          },
        },
      };

      // Superposition Testnet chain configuration
      export const superpositionTestnet: Chain = {
        id: 98985,
        name: 'Superposition Testnet',
        nativeCurrency: {
          name: 'SPN',
          symbol: 'SPN',
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: ['https://testnet-rpc.superposition.so'],
          },
        },
        blockExplorers: {
          default: {
            name: 'Superposition Testnet Explorer',
            url: 'https://testnet-explorer.superposition.so',
          },
        },
        testnet: true,
      };

      // Default supported chains
      export const chains = [superposition, superpositionTestnet, arbitrum, arbitrumSepolia, mainnet, sepolia] as const;
    `);
  }

  // Default chain setup
  imports.push(`import { mainnet, sepolia, arbitrum, arbitrumSepolia } from 'viem/chains';`);

  return dedent(`
    ${imports.join('\n')}

    // Default supported chains
    export const chains = [arbitrum, arbitrumSepolia, mainnet, sepolia] as const;
  `);
}

/**
 * Generate app/page.tsx - Home page
 */
export function generateHomePage(config: Config): string {
  return dedent(`
    import { WalletButton } from '@/components/wallet-button';

    export default function Home() {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <div className="max-w-5xl w-full text-center">
            <h1 className="text-4xl font-bold mb-8">
              ${config.appName}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
              ${config.appDescription || 'A Web3 application built with Cradle'}
            </p>
            
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        </main>
      );
    }
  `);
}

/**
 * Generate components/wallet-button.tsx
 */
export function generateWalletButton(config: Config): string {
  if (config.rainbowKit) {
    return dedent(`
      'use client';

      import { ConnectButton } from '@rainbow-me/rainbowkit';

      export function WalletButton() {
        return (
          <ConnectButton 
            showBalance={true}
            chainStatus="icon"
            accountStatus="address"
          />
        );
      }
    `);
  }

  // Custom wallet button without RainbowKit
  return dedent(`
    'use client';

    import { useAccount, useConnect, useDisconnect } from 'wagmi';
    import { useState } from 'react';

    export function WalletButton() {
      const { address, isConnected } = useAccount();
      const { connect, connectors } = useConnect();
      const { disconnect } = useDisconnect();
      const [showConnectors, setShowConnectors] = useState(false);

      if (isConnected && address) {
        return (
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
        );
      }

      return (
        <div className="relative">
          <button
            onClick={() => setShowConnectors(!showConnectors)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Connect Wallet
          </button>
          
          {showConnectors && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectors(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {connector.name}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
  `);
}

/**
 * Generate tailwind.config.js
 */
export function generateTailwindConfig(config: Config): string {
  return dedent(`
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        '${config.srcDirectory ? './src' : '.'}/**/*.{js,ts,jsx,tsx,mdx}',
      ],
      ${config.darkModeSupport ? `darkMode: 'class',` : ''}
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#eef2ff',
              100: '#e0e7ff',
              200: '#c7d2fe',
              300: '#a5b4fc',
              400: '#818cf8',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
              800: '#3730a3',
              900: '#312e81',
              950: '#1e1b4b',
            },
          },
        },
      },
      plugins: [],
    };
  `);
}

/**
 * Generate app/globals.css
 */
export function generateGlobalStyles(config: Config): string {
  if (config.styling === 'tailwind') {
    return dedent(`
      @tailwind base;
      @tailwind components;
      @tailwind utilities;

      :root {
        --foreground-rgb: 0, 0, 0;
        --background-start-rgb: 255, 255, 255;
        --background-end-rgb: 245, 245, 245;
      }

      ${config.darkModeSupport ? `
      @media (prefers-color-scheme: dark) {
        :root {
          --foreground-rgb: 255, 255, 255;
          --background-start-rgb: 0, 0, 0;
          --background-end-rgb: 0, 0, 0;
        }
      }

      .dark {
        --foreground-rgb: 255, 255, 255;
        --background-start-rgb: 0, 0, 0;
        --background-end-rgb: 0, 0, 0;
      }
      ` : ''}

      body {
        color: rgb(var(--foreground-rgb));
        background: linear-gradient(
            to bottom,
            transparent,
            rgb(var(--background-end-rgb))
          )
          rgb(var(--background-start-rgb));
      }
    `);
  }

  // Vanilla CSS
  return dedent(`
    * {
      box-sizing: border-box;
      padding: 0;
      margin: 0;
    }

    html,
    body {
      max-width: 100vw;
      overflow-x: hidden;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }

    a {
      color: inherit;
      text-decoration: none;
    }
  `);
}

/**
 * Generate types/env.d.ts for type-safe environment variables
 */
export function generateEnvTypes(config: Config): string {
  return dedent(`
    declare namespace NodeJS {
      interface ProcessEnv {
        ${config.walletConnect ? `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string;` : ''}
        NEXT_PUBLIC_APP_NAME?: string;
        ${config.includeContracts ? `NEXT_PUBLIC_CONTRACT_ADDRESS?: string;` : ''}
      }
    }
  `);
}
