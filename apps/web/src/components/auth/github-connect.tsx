'use client';

import { useState, useEffect } from 'react';
import { Github, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GitHubSession {
  authenticated: boolean;
  github: {
    id: string;
    username: string;
    avatar: string;
  } | null;
}
import { useAuthStore } from '@/store/auth';

export function GitHubConnect() {
  const [session, setSession] = useState<GitHubSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const { setGitHubSession } = useAuthStore();

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setSession(data);

      // Sync with auth store
      if (data.authenticated && data.github) {
        setGitHubSession({
          id: data.github.id,
          username: data.github.username,
          avatar: data.github.avatar,
        });
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setSession({ authenticated: false, github: null });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/github';
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setSession({ authenticated: false, github: null });
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (session?.authenticated && session.github) {
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

// Hook to check GitHub connection status
export function useGitHubSession() {
  const [session, setSession] = useState<GitHubSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        setSession({ authenticated: false, github: null });
        setLoading(false);
      });
  }, []);

  return { session, loading, isConnected: session?.authenticated ?? false };
}

