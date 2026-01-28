'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthSession {
  walletAddress: string | null;
  github: {
    id: string;
    username: string;
    avatar: string;
  } | null;
}

interface AuthState {
  session: AuthSession;
  isWalletConnected: boolean;
  isGitHubConnected: boolean;
  isFullyAuthenticated: boolean;
  showAuthModal: boolean;
  authModalStep: 'wallet' | 'github' | 'complete';
  pendingAction: (() => void) | null;
  isSyncing: boolean;

  // Actions
  setWalletConnected: (address: string | null) => void;
  setGitHubSession: (github: AuthSession['github']) => void;
  openAuthModal: (pendingAction?: () => void) => void;
  closeAuthModal: () => void;
  setAuthModalStep: (step: 'wallet' | 'github' | 'complete') => void;
  executePendingAction: () => void;
  clearSession: () => void;
  syncWithDatabase: (walletAddress: string) => Promise<void>;
  checkDatabaseAuth: (walletAddress: string) => Promise<{ hasWallet: boolean; hasGitHub: boolean }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: {
        walletAddress: null,
        github: null,
      },
      isWalletConnected: false,
      isGitHubConnected: false,
      isFullyAuthenticated: false,
      showAuthModal: false,
      authModalStep: 'wallet',
      pendingAction: null,
      isSyncing: false,

      setWalletConnected: (address) => {
        set((state) => ({
          session: { ...state.session, walletAddress: address },
          isWalletConnected: !!address,
          isFullyAuthenticated: !!address && state.isGitHubConnected,
          authModalStep: address ? 'github' : 'wallet',
        }));
      },

      setGitHubSession: (github) => {
        set((state) => ({
          session: { ...state.session, github },
          isGitHubConnected: !!github,
          isFullyAuthenticated: state.isWalletConnected && !!github,
          authModalStep: github ? 'complete' : state.authModalStep,
        }));
      },

      openAuthModal: async (pendingAction) => {
        const { isWalletConnected, isGitHubConnected, session } = get();
        
        // If wallet is connected, check database to see if GitHub is linked
        if (isWalletConnected && session.walletAddress) {
          const dbAuth = await get().checkDatabaseAuth(session.walletAddress);
          // Don't open modal if wallet is connected AND GitHub is linked in database
          if (dbAuth.hasWallet && dbAuth.hasGitHub) {
            // User is fully authenticated, execute action if provided
            if (pendingAction) {
              pendingAction();
            }
            return;
          }
        }
        
        set({
          showAuthModal: true,
          pendingAction: pendingAction || null,
          authModalStep: !isWalletConnected ? 'wallet' : !isGitHubConnected ? 'github' : 'complete',
        });
      },

      closeAuthModal: () => {
        set({ showAuthModal: false, pendingAction: null });
      },

      setAuthModalStep: (step) => {
        set({ authModalStep: step });
      },

      executePendingAction: () => {
        const { pendingAction, isFullyAuthenticated } = get();
        if (isFullyAuthenticated && pendingAction) {
          pendingAction();
          set({ pendingAction: null, showAuthModal: false });
        }
      },

      clearSession: () => {
        set({
          session: { walletAddress: null, github: null },
          isWalletConnected: false,
          isGitHubConnected: false,
          isFullyAuthenticated: false,
          showAuthModal: false,
          authModalStep: 'wallet',
          pendingAction: null,
        });
      },

      syncWithDatabase: async (walletAddress: string) => {
        set({ isSyncing: true });
        try {
          // Check database for user
          const response = await fetch(`/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            if (user) {
              set((state) => ({
                session: {
                  walletAddress: user.walletAddress,
                  github: user.githubId
                    ? {
                        id: user.githubId,
                        username: user.githubUsername || '',
                        avatar: user.githubAvatar || '',
                      }
                    : null,
                },
                isWalletConnected: !!user.walletAddress,
                isGitHubConnected: !!user.githubId,
                isFullyAuthenticated: !!user.walletAddress && !!user.githubId,
              }));
            }
          }
        } catch (error) {
          console.error('Error syncing with database:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      checkDatabaseAuth: async (walletAddress: string) => {
        try {
          const response = await fetch(`/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            return {
              hasWallet: !!user?.walletAddress,
              hasGitHub: !!user?.githubId,
            };
          }
        } catch (error) {
          console.error('Error checking database auth:', error);
        }
        return { hasWallet: false, hasGitHub: false };
      },
    }),
    {
      name: 'cradle-auth-storage',
      partialize: (state) => ({
        session: state.session,
        isWalletConnected: state.isWalletConnected,
        isGitHubConnected: state.isGitHubConnected,
        isFullyAuthenticated: state.isFullyAuthenticated,
      }),
    }
  )
);
