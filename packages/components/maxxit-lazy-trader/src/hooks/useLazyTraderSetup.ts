/**
 * useLazyTraderSetup Hook
 * Manages the 4-step wallet-based lazy trader setup flow
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
    SetupStep,
    TradingPreferences,
    TelegramUser,
    GenerateAgentResponse,
    GenerateTelegramLinkResponse,
    CreateAgentResponse,
    CheckSetupResponse,
} from '../types';
import {
    generateOstiumAgent,
    generateTelegramLink,
    checkTelegramStatus,
    createLazyTraderAgent,
    checkSetup,
} from '../api';

interface UseLazyTraderSetupOptions {
    userWallet: string | undefined;
    onComplete?: (response: CreateAgentResponse) => void;
}

interface UseLazyTraderSetupReturn {
    currentStep: SetupStep;
    agentAddress: string | null;
    isAgentNew: boolean;
    isGeneratingAgent: boolean;
    generateAgent: () => Promise<void>;
    linkCode: string | null;
    deepLink: string | null;
    botUsername: string | null;
    alreadyLinked: boolean;
    isGeneratingLink: boolean;
    generateLink: () => Promise<void>;
    isPolling: boolean;
    telegramUser: TelegramUser | null;
    startPolling: () => void;
    stopPolling: () => void;
    tradingPreferences: TradingPreferences;
    setTradingPreferences: (prefs: TradingPreferences) => void;
    isCreatingAgent: boolean;
    createAgent: () => Promise<void>;
    agentResult: CreateAgentResponse | null;
    isCheckingSetup: boolean;
    error: string | null;
    clearError: () => void;
    reset: () => void;
}

const DEFAULT_PREFERENCES: TradingPreferences = {
    risk_tolerance: 50,
    trade_frequency: 50,
    social_sentiment_weight: 50,
    price_momentum_focus: 50,
    market_rank_priority: 50,
};

const POLL_INTERVAL_MS = 3000;

export function useLazyTraderSetup(options: UseLazyTraderSetupOptions): UseLazyTraderSetupReturn {
    const { userWallet, onComplete } = options;

    const [currentStep, setCurrentStep] = useState<SetupStep>('idle');
    const [error, setError] = useState<string | null>(null);

    const [agentAddress, setAgentAddress] = useState<string | null>(null);
    const [isAgentNew, setIsAgentNew] = useState(false);
    const [isGeneratingAgent, setIsGeneratingAgent] = useState(false);

    const [linkCode, setLinkCode] = useState<string | null>(null);
    const [deepLink, setDeepLink] = useState<string | null>(null);
    const [botUsername, setBotUsername] = useState<string | null>(null);
    const [alreadyLinked, setAlreadyLinked] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    const [isPolling, setIsPolling] = useState(false);
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [tradingPreferences, setTradingPreferences] = useState<TradingPreferences>(DEFAULT_PREFERENCES);
    const [isCreatingAgent, setIsCreatingAgent] = useState(false);
    const [agentResult, setAgentResult] = useState<CreateAgentResponse | null>(null);

    const [isCheckingSetup, setIsCheckingSetup] = useState(false);
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!userWallet || hasCheckedRef.current) return;

        const doCheck = async () => {
            setIsCheckingSetup(true);
            hasCheckedRef.current = true;

            try {
                const result = await checkSetup(userWallet);

                if (result.isSetupComplete && result.agent && result.telegramUser) {
                    // Setup already complete - populate all state
                    setAgentAddress(result.ostiumAgentAddress || null);
                    setIsAgentNew(false);
                    setAlreadyLinked(true);
                    setTelegramUser(result.telegramUser);
                    if (result.tradingPreferences) {
                        setTradingPreferences(result.tradingPreferences);
                    }
                    setAgentResult({
                        success: true,
                        agent: result.agent,
                        deployment: result.deployment,
                        ostiumAgentAddress: result.ostiumAgentAddress,
                    });
                    setCurrentStep('complete');
                }
            } catch (err) {
                console.error('Setup check failed:', err);
            } finally {
                setIsCheckingSetup(false);
            }
        };

        doCheck();
    }, [userWallet]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const reset = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setCurrentStep('idle');
        setError(null);
        setAgentAddress(null);
        setIsAgentNew(false);
        setLinkCode(null);
        setDeepLink(null);
        setBotUsername(null);
        setAlreadyLinked(false);
        setTelegramUser(null);
        setIsPolling(false);
        setTradingPreferences(DEFAULT_PREFERENCES);
        setAgentResult(null);
    }, []);

    // Step 1: Generate Agent
    const generateAgent = useCallback(async () => {
        if (!userWallet) {
            setError('Wallet not connected');
            return;
        }

        setIsGeneratingAgent(true);
        setError(null);

        try {
            const response = await generateOstiumAgent(userWallet);
            setAgentAddress(response.agentAddress);
            setIsAgentNew(response.isNew);
            setCurrentStep('agent');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate agent');
        } finally {
            setIsGeneratingAgent(false);
        }
    }, [userWallet]);

    // Step 2: Generate Telegram Link
    const generateLink = useCallback(async () => {
        if (!userWallet) {
            setError('Wallet not connected');
            return;
        }

        setIsGeneratingLink(true);
        setError(null);

        try {
            const response = await generateTelegramLink(userWallet);
            setAlreadyLinked(response.alreadyLinked);

            if (response.alreadyLinked && response.telegramUser) {
                setTelegramUser(response.telegramUser);
                setCurrentStep('create-agent');
            } else if (response.linkCode && response.deepLink) {
                setLinkCode(response.linkCode);
                setDeepLink(response.deepLink);
                setBotUsername(response.botUsername || null);
                setCurrentStep('telegram-link');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate telegram link');
        } finally {
            setIsGeneratingLink(false);
        }
    }, [userWallet]);

    // Step 3: Poll for Telegram Connection
    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const startPolling = useCallback(() => {
        if (!userWallet || !linkCode) {
            setError('Missing wallet or link code');
            return;
        }

        setIsPolling(true);
        setCurrentStep('telegram-connect');

        const poll = async () => {
            try {
                const response = await checkTelegramStatus(userWallet, linkCode);

                if (response.connected && response.telegramUser) {
                    stopPolling();
                    setTelegramUser(response.telegramUser);
                    setCurrentStep('create-agent');
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        };

        poll();

        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, [userWallet, linkCode, stopPolling]);

    // Step 4: Create Agent
    const createAgent = useCallback(async () => {
        if (!userWallet || !telegramUser) {
            setError('Missing wallet or telegram user');
            return;
        }

        setIsCreatingAgent(true);
        setError(null);

        try {
            const response = await createLazyTraderAgent(
                userWallet,
                telegramUser.id,
                tradingPreferences
            );

            setAgentResult(response);
            setCurrentStep('complete');
            onComplete?.(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create agent');
        } finally {
            setIsCreatingAgent(false);
        }
    }, [userWallet, telegramUser, tradingPreferences, onComplete]);

    return {
        currentStep,
        agentAddress,
        isAgentNew,
        isGeneratingAgent,
        generateAgent,
        linkCode,
        deepLink,
        botUsername,
        alreadyLinked,
        isGeneratingLink,
        generateLink,
        isPolling,
        telegramUser,
        startPolling,
        stopPolling,
        tradingPreferences,
        setTradingPreferences,
        isCreatingAgent,
        createAgent,
        agentResult,
        isCheckingSetup,
        error,
        clearError,
        reset,
    };
}

export type { UseLazyTraderSetupReturn };
