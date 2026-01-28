'use client';

import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';

interface WalletConnectButtonProps {
  variant?: 'default' | 'compact' | 'full';
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

export function WalletConnectButton({
  variant = 'default',
  onConnect,
  onDisconnect,
  className,
}: WalletConnectButtonProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { setWalletConnected } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Sync wallet connection with auth store
  useEffect(() => {
    if (isConnected && address) {
      setWalletConnected(address);
      onConnect?.(address);
    } else {
      setWalletConnected(null);
    }
  }, [isConnected, address, setWalletConnected, onConnect]);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowMenu(false);
    onDisconnect?.();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className={className}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'gap-2 border-forge-border hover:border-accent-cyan hover:text-accent-cyan transition-all duration-200',
                      'bg-gradient-to-r from-forge-surface/80 to-forge-elevated/50',
                      'hover:from-accent-cyan/10 hover:to-accent-cyan/5',
                      isConnecting && 'animate-pulse'
                    )}
                  >
                    <Wallet className="w-4 h-4" />
                    {variant === 'compact' ? 'Connect' : 'Connect Wallet'}
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    Wrong network
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                );
              }

              return (
                <div className="relative">
                  <motion.button
                    onClick={() => setShowMenu(!showMenu)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200',
                      'bg-gradient-to-r from-forge-surface/80 to-forge-elevated/50',
                      'border border-forge-border/50 hover:border-accent-cyan/50',
                      'group'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Chain indicator */}
                    {chain.hasIcon && (
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-forge-bg">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    )}

                    {/* Address */}
                    <span className="text-sm font-medium text-white group-hover:text-accent-cyan transition-colors">
                      {formatAddress(account.address)}
                    </span>

                    {/* Balance (optional) */}
                    {variant === 'full' && account.displayBalance && (
                      <span className="text-xs text-forge-muted px-2 py-0.5 rounded bg-forge-bg/50">
                        {account.displayBalance}
                      </span>
                    )}

                    <ChevronDown className={cn(
                      'w-3 h-3 text-forge-muted transition-transform duration-200',
                      showMenu && 'rotate-180'
                    )} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className={cn(
                          'absolute right-0 top-full mt-2 z-50',
                          'w-56 p-2 rounded-xl',
                          'bg-forge-surface/95 backdrop-blur-xl',
                          'border border-forge-border/50',
                          'shadow-xl shadow-black/20'
                        )}
                      >
                        {/* Account info */}
                        <div className="px-3 py-2 mb-2 rounded-lg bg-forge-bg/50">
                          <p className="text-xs text-forge-muted mb-1">Connected Wallet</p>
                          <p className="text-sm font-mono text-white break-all">
                            {formatAddress(account.address)}
                          </p>
                          {account.displayBalance && (
                            <p className="text-xs text-accent-cyan mt-1">
                              {account.displayBalance}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <button
                          onClick={handleCopy}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-forge-text hover:bg-forge-elevated/50 transition-colors"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-accent-lime" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copied ? 'Copied!' : 'Copy Address'}
                        </button>

                        <button
                          onClick={openChainModal}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-forge-text hover:bg-forge-elevated/50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Switch Network
                        </button>

                        <div className="h-px bg-forge-border/30 my-2" />

                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// Hook to require wallet connection before an action
export function useRequireWallet() {
  const { isWalletConnected, openAuthModal } = useAuthStore();

  const requireWallet = (action: () => void): boolean => {
    if (!isWalletConnected) {
      openAuthModal(action);
      return false;
    }
    action();
    return true;
  };

  return { requireWallet, isWalletConnected };
}
