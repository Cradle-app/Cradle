'use client';

import { useState, useCallback } from 'react';
import { fetchClubDetails, sendMessageToAgent } from '../api';
import type { ClubDetailsResponse, MaxxitApiOptions } from '../types';

export interface UseMaxxitLazyTraderReturn {
  // Fetch state
  details: ClubDetailsResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Send state
  isSending: boolean;
  sendError: string | null;
  sendSuccess: string | null;
  
  // Actions
  fetchDetails: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearErrors: () => void;
}

/**
 * Hook for managing Maxxit Lazy Trader API interactions
 * 
 * @param apiKey - Maxxit API key
 * @param options - Optional API options
 * 
 * @example
 * ```tsx
 * const { details, fetchDetails, sendMessage } = useMaxxitLazyTrader(apiKey);
 * 
 * // Fetch agent details
 * await fetchDetails();
 * 
 * // Send a message
 * await sendMessage('Buy BTC');
 * ```
 */
export function useMaxxitLazyTrader(
  apiKey: string,
  options?: MaxxitApiOptions
): UseMaxxitLazyTraderReturn {
  const [details, setDetails] = useState<ClubDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSendSuccess(null);

    try {
      const data = await fetchClubDetails(apiKey, options);
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch details');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, options]);

  const sendMessage = useCallback(async (message: string) => {
    if (!apiKey) {
      setSendError('API key is required');
      return;
    }

    if (!message.trim()) {
      setSendError('Message is required');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      await sendMessageToAgent(apiKey, message, options);
      setSendSuccess('✅ Message sent successfully! Your signal will be processed shortly.');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [apiKey, options]);

  const clearErrors = useCallback(() => {
    setError(null);
    setSendError(null);
    setSendSuccess(null);
  }, []);

  return {
    details,
    isLoading,
    error,
    isSending,
    sendError,
    sendSuccess,
    fetchDetails,
    sendMessage,
    clearErrors,
  };
}
