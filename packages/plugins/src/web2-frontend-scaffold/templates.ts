import { z } from 'zod';
import { Web2FrontendScaffoldConfig } from '@dapp-forge/blueprint-schema';

type Config = z.infer<typeof Web2FrontendScaffoldConfig>;

export function generatePackageJson(config: Config): string {
  const deps: Record<string, string> = {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
  };

  if (config.stateManagement === 'tanstack-query') {
    deps['@tanstack/react-query'] = '^5.50.0';
  } else if (config.stateManagement === 'zustand') {
    deps['zustand'] = '^4.5.0';
  }

  if (config.authProvider === 'nextauth') {
    deps['next-auth'] = '^4.24.0';
  } else if (config.authProvider === 'clerk') {
    deps['@clerk/nextjs'] = '^5.0.0';
  }

  const devDeps: Record<string, string> = {
    typescript: '^5.4.0',
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    '@types/node': '^20.0.0',
  };

  if (config.styling === 'tailwind') {
    devDeps['tailwindcss'] = '^3.4.0';
    devDeps['postcss'] = '^8.4.0';
    devDeps['autoprefixer'] = '^10.4.0';
  }

  return JSON.stringify(
    {
      name: config.appName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

export function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;
}

export function generateTailwindConfig(config: Config): string {
  const src = config.srcDirectory ? './src/' : './';
  return `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    '${src}app/**/*.{js,ts,jsx,tsx,mdx}',
    '${src}components/**/*.{js,ts,jsx,tsx,mdx}',
    '${src}lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  ${config.darkModeSupport ? "darkMode: 'class'," : ''}
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

export function generatePostCSSConfig(): string {
  return `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`;
}

export function generateTSConfig(config: Config): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
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
        paths: { '@/*': [config.srcDirectory ? './src/*' : './*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    null,
    2,
  );
}

export function generateLayout(config: Config): string {
  return `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '${config.appName}',
  description: '${config.appDescription || `${config.appName} - Built with Next.js`}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"${config.darkModeSupport ? ' suppressHydrationWarning' : ''}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;
}

export function generatePage(config: Config): string {
  return `export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          ${config.appName}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          ${config.appDescription || 'Your application is ready. Start building something great.'}
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors font-medium"
          >
            Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
`;
}

export function generateGlobalCSS(config: Config): string {
  if (config.styling === 'tailwind') {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

${config.darkModeSupport ? `@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 10, 10, 10;
  }
}` : ''}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
`;
  }

  return `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
`;
}

export function generateProviders(config: Config): string {
  const imports: string[] = ["'use client';"];
  const wrappers: string[] = [];

  if (config.stateManagement === 'tanstack-query') {
    imports.push(
      "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';",
      "import { useState } from 'react';",
    );
    wrappers.push('QueryClientProvider');
  }

  if (config.authProvider === 'nextauth') {
    imports.push("import { SessionProvider } from 'next-auth/react';");
    wrappers.push('SessionProvider');
  } else if (config.authProvider === 'clerk') {
    imports.push("import { ClerkProvider } from '@clerk/nextjs';");
    wrappers.push('ClerkProvider');
  }

  let body = '{children}';

  if (config.authProvider === 'clerk') {
    body = `<ClerkProvider>${body}</ClerkProvider>`;
  }
  if (config.authProvider === 'nextauth') {
    body = `<SessionProvider>${body}</SessionProvider>`;
  }
  if (config.stateManagement === 'tanstack-query') {
    body = `<QueryClientProvider client={queryClient}>${body}</QueryClientProvider>`;
  }

  const queryClientLine =
    config.stateManagement === 'tanstack-query'
      ? '\n  const [queryClient] = useState(() => new QueryClient());\n'
      : '';

  return `${imports.join('\n')}

export function Providers({ children }: { children: React.ReactNode }) {${queryClientLine}
  return (
    ${body}
  );
}
`;
}

export function generateEnvTypes(config: Config): string {
  const vars: string[] = [];

  if (config.authProvider === 'nextauth') {
    vars.push('NEXTAUTH_SECRET: string;', 'NEXTAUTH_URL: string;');
  } else if (config.authProvider === 'clerk') {
    vars.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;', 'CLERK_SECRET_KEY: string;');
  }

  if (vars.length === 0) return '';

  return `declare namespace NodeJS {
  interface ProcessEnv {
    ${vars.join('\n    ')}
  }
}
`;
}
