'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactFlowProvider } from 'reactflow';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/toaster';
import { WagmiProvider, http, useAccount } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useAuthStore } from '@/store/auth';
import { AuthFlowModal } from '@/components/auth/auth-flow-modal';

const wagmiConfig = getDefaultConfig({
  appName: 'Cradle',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'dummy_id',
  chains: [arbitrum, arbitrumSepolia],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});

function GlobalAuthModal() {
  const { showAuthModal, closeAuthModal } = useAuthStore();

  return (
    <AuthFlowModal
      open={showAuthModal}
      onOpenChange={closeAuthModal}
      requireGitHub={true}
    />
  );
}

// Component to sync auth state with database on mount
function AuthSync() {
  const { address, isConnected } = useAccount();
  const { syncWithDatabase, setWalletConnected, setGitHubSession } = useAuthStore();

  // Check for GitHub session on mount and when wallet connects
  useEffect(() => {
    const checkGitHubSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.github) {
          setGitHubSession({
            id: data.github.id,
            username: data.github.username,
            avatar: data.github.avatar,
          });
        }
      } catch (error) {
        console.error('Failed to check GitHub session:', error);
      }
    };

    checkGitHubSession();
  }, [setGitHubSession]);

  useEffect(() => {
    if (isConnected && address) {
      // Update local state first
      setWalletConnected(address);
      // Then sync with database to get GitHub status
      syncWithDatabase(address);
    } else {
      setWalletConnected(null);
    }
  }, [isConnected, address, syncWithDatabase, setWalletConnected]);

  // Check URL params for GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') {
      // GitHub OAuth just completed, check session and save to database
      const checkAndSave = async () => {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          if (data.authenticated && data.github && address) {
            setGitHubSession({
              id: data.github.id,
              username: data.github.username,
              avatar: data.github.avatar,
            });
            // Save to database with wallet address
            await fetch('/api/auth/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: address,
                githubId: data.github.id,
                githubUsername: data.github.username,
                githubAvatar: data.github.avatar,
              }),
            });
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Failed to save GitHub auth:', error);
        }
      };
      checkAndSave();
    }
  }, [address, setGitHubSession]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ReactFlowProvider>
            <ToastProvider>
              <AuthSync />
              {children}
              <GlobalAuthModal />
            </ToastProvider>
          </ReactFlowProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
