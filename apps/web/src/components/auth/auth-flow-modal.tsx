'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Github,
  Check,
  ArrowRight,
  X,
  Loader2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from './wallet-connect-button';
import { useAuthStore } from '@/store/auth';

interface AuthFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  requireGitHub?: boolean;
}

export function AuthFlowModal({
  open,
  onOpenChange,
  onComplete,
  requireGitHub = true,
}: AuthFlowModalProps) {
  const { address, isConnected } = useAccount();
  const {
    isWalletConnected,
    isGitHubConnected,
    authModalStep,
    setAuthModalStep,
    setGitHubSession,
    session,
    executePendingAction,
  } = useAuthStore();

  const [githubLoading, setGithubLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Check for GitHub session on mount
  useEffect(() => {
    if (open) {
      checkGitHubSession();
    }
  }, [open]);

  // Auto-advance steps and save wallet to database
  useEffect(() => {
    if (isConnected && address && authModalStep === 'wallet') {
      // Save wallet to database immediately
      saveUserToDatabase().then(() => {
        if (requireGitHub) {
          // Advance to GitHub step - user will click button to trigger OAuth
          setAuthModalStep('github');
        } else {
          handleComplete();
        }
      });
    }
  }, [isConnected, address, authModalStep, requireGitHub]);

  useEffect(() => {
    if (isGitHubConnected && authModalStep === 'github') {
      // Save updated user with GitHub info to database
      saveUserToDatabase().then(() => {
        handleComplete();
      });
    }
  }, [isGitHubConnected, authModalStep]);

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
        // If wallet is connected, save to database immediately
        if (address) {
          await saveUserToDatabase();
        }
      }
    } catch (error) {
      console.error('Failed to check GitHub session:', error);
    }
  };

  const saveUserToDatabase = async (): Promise<void> => {
    if (!address) return;

    setSavingUser(true);
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          githubId: session.github?.id || null,
          githubUsername: session.github?.username || null,
          githubAvatar: session.github?.avatar || null,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save user to database');
        throw new Error('Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    } finally {
      setSavingUser(false);
    }
  };

  const handleGitHubConnect = () => {
    setGithubLoading(true);
    // Store current state to resume after redirect
    sessionStorage.setItem('auth_flow_pending', 'true');
    window.location.href = '/api/auth/github';
  };

  const handleComplete = useCallback(() => {
    setAuthModalStep('complete');
    // Final save to ensure everything is synced
    saveUserToDatabase().finally(() => {
      setTimeout(() => {
        onComplete?.();
        executePendingAction();
        onOpenChange(false);
      }, 1500);
    });
  }, [onComplete, executePendingAction, onOpenChange, setAuthModalStep, address, session.github]);

  const handleSkipGitHub = () => {
    handleComplete();
  };

  const steps = [
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Connect your wallet to access Cradle features',
      icon: Wallet,
      completed: isWalletConnected,
    },
    ...(requireGitHub
      ? [
        {
          id: 'github',
          title: 'Connect GitHub',
          description: 'Link your GitHub for code generation and repo creation',
          icon: Github,
          completed: isGitHubConnected,
        },
      ]
      : []),
    {
      id: 'complete',
      title: 'Ready to Build',
      description: 'You\'re all set to start building!',
      icon: Sparkles,
      completed: authModalStep === 'complete',
    },
  ];

  // Lower z-index when on wallet step to allow RainbowKit modal to appear above
  const isWalletStep = authModalStep === 'wallet';

  if (!open) {
    return null;
  }

  const modal = (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity',
          isWalletStep ? 'z-[40] opacity-20' : 'z-30'
        )}
      />
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg',
          isWalletStep ? 'z-[50]' : 'z-50'
        )}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            'relative rounded-2xl overflow-hidden',
            'bg-gradient-to-b from-forge-surface to-forge-bg',
            'border border-forge-border/50',
            'shadow-2xl shadow-black/40'
          )}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-2 rounded-lg text-forge-muted hover:text-white hover:bg-forge-elevated/50 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="p-6 pb-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-accent-cyan" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-sm text-forge-muted">
              Complete the following steps to access all features
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                      step.completed
                        ? 'bg-accent-cyan text-black'
                        : authModalStep === step.id
                          ? 'bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan'
                          : 'bg-forge-elevated text-forge-muted'
                    )}
                  >
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-12 h-0.5 mx-2 transition-colors duration-300',
                        step.completed ? 'bg-accent-cyan' : 'bg-forge-border'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {authModalStep === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-sm text-forge-muted mb-4">
                      Connect your Ethereum wallet to authenticate and access Cradle&apos;s features.
                    </p>
                    <WalletConnectButton variant="full" className="w-full" />
                  </div>
                </motion.div>
              )}

              {authModalStep === 'github' && (
                <motion.div
                  key="github"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-accent-cyan" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Wallet Connected</p>
                        <p className="text-xs text-forge-muted font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Connect GitHub
                    </h3>
                    <p className="text-sm text-forge-muted mb-4">
                      Link your GitHub account to enable code generation and repository creation.
                    </p>

                    {isGitHubConnected && session.github ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                        <img
                          src={session.github.avatar}
                          alt={session.github.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {session.github.username}
                          </p>
                          <p className="text-xs text-forge-muted">Connected</p>
                        </div>
                        <Check className="w-5 h-5 text-accent-cyan ml-auto" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={handleGitHubConnect}
                          disabled={githubLoading}
                          className="w-full gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white"
                        >
                          {githubLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Github className="w-4 h-4" />
                          )}
                          Connect GitHub
                          <ArrowRight className="w-4 h-4 ml-auto" />
                        </Button>

                        <button
                          onClick={handleSkipGitHub}
                          className="w-full text-center text-sm text-forge-muted hover:text-white transition-colors"
                        >
                          Skip for now
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {authModalStep === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-cyan to-accent-lime flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-black" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    You&apos;re All Set!
                  </h3>
                  <p className="text-sm text-forge-muted">
                    Authentication complete. Redirecting...
                  </p>
                  {savingUser && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-forge-muted">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving profile...
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-forge-bg/50 border-t border-forge-border/30">
            <p className="text-xs text-center text-forge-muted">
              By connecting, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}

// Convenience hook for using auth flow
export function useAuthFlow() {
  const {
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    isWalletConnected,
    isFullyAuthenticated
  } = useAuthStore();

  const requireAuth = (action: () => void): boolean => {
    if (!isWalletConnected) {
      openAuthModal(action);
      return false;
    }
    action();
    return true;
  };

  return {
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    requireAuth,
    isWalletConnected,
    isFullyAuthenticated,
  };
}
