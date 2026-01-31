import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Cradle - Web3 Foundation Builder',
  description: 'Build your Web3 project foundation visually. Define architecture, generate clean structured code, then fine-tune with AI.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-forge-bg text-white selection:bg-accent-cyan/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

