'use client';

import { useState, useEffect } from 'react';
import { Github, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';

export function GitHubConnect() {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Use Zustand store as single source of truth
  const {
    session,
    isGitHubConnected,
    setGitHubSession,
    disconnectGitHub,
    isSyncing
  } = useAuthStore();

  // Check session on mount and sync with store
  useEffect(() => {
    const checkAndSyncSession = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        // Sync session data with auth store
        if (data.authenticated && data.github) {
          setGitHubSession({
            id: data.github.id,
            username: data.github.username,
            avatar: data.github.avatar,
          });
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only check if not already connected in store
    if (!isGitHubConnected) {
      checkAndSyncSession();
    } else {
      setLoading(false);
    }
  }, [isGitHubConnected, setGitHubSession]);

  const handleConnect = () => {
    window.location.href = '/api/auth/github';
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      // Use the store's disconnectGitHub which only clears session, not database
      await disconnectGitHub();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading || isSyncing) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Use store state to determine connected status
  if (isGitHubConnected && session.github) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-surface rounded-lg border border-forge-border">
          <img
            src={session.github.avatar}
            alt={session.github.username}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-sm text-forge-text">{session.github.username}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-forge-muted hover:text-red-400"
        >
          {disconnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleConnect}
      className="gap-2 border-forge-border hover:border-accent-cyan hover:text-accent-cyan"
    >
      <Github className="w-4 h-4" />
      Connect GitHub
    </Button>
  );
}

// Hook to check GitHub connection status - now uses store
export function useGitHubSession() {
  const { session, isGitHubConnected, isSyncing } = useAuthStore();

  return {
    session: {
      authenticated: isGitHubConnected,
      github: session.github
    },
    loading: isSyncing,
    isConnected: isGitHubConnected
  };
}
