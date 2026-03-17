import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@/styles/globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: '[N]skills - Web3 Skills Composer',
  description: 'Compose N skills for your Web3 project visually. Define architecture, generate a skills repo, then let Claude Code scaffold the full project.',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://www.nskills.xyz'),
  openGraph: {
    title: '[N]skills - Web3 Skills Composer',
    description: 'Compose N skills for your Web3 project visually. Define architecture, generate a skills repo, then let Claude Code scaffold the full project.',
    url: 'https://www.nskills.xyz',
    siteName: '[N]skills',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '[N]skills - Web3 Skills Composer',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '[N]skills - Web3 Skills Composer',
    description: 'Compose N skills for your Web3 project visually. Define architecture, generate a skills repo, then let Claude Code scaffold the full project.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
