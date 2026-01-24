/**
 * Maxxit Lazy Trader API Types
 * 4-step wallet-based setup flow
 */

/**
 * Trading preferences for the lazy trader agent
 */
export interface TradingPreferences {
  risk_tolerance: number;
  trade_frequency: number;
  social_sentiment_weight: number;
  price_momentum_focus: number;
  market_rank_priority: number;
}

/**
 * Step 1: Generate Ostium Agent
 */
export interface GenerateAgentResponse {
  agentAddress: string;
  isNew: boolean;
  error?: string;
}

/**
 * Step 2: Generate Telegram Link
 */
export interface GenerateTelegramLinkResponse {
  success: boolean;
  alreadyLinked: boolean;
  linkCode?: string;
  botUsername?: string;
  deepLink?: string;
  expiresIn?: number;
  telegramUser?: TelegramUser;
  error?: string;
}

/**
 * Telegram user info
 */
export interface TelegramUser {
  id: string;
  telegram_user_id: string;
  telegram_username: string;
}

/**
 * Step 3: Check Telegram Status
 */
export interface CheckTelegramStatusResponse {
  success: boolean;
  connected: boolean;
  telegramUser?: TelegramUser;
  error?: string;
}

/**
 * Step 4: Create Agent
 */
export interface CreateAgentResponse {
  success: boolean;
  agent?: {
    id: string;
    name: string;
    venue: string;
  };
  deployment?: {
    id: string;
    status: string;
  };
  ostiumAgentAddress?: string;
  error?: string;
}

/**
 * Check Setup Status - for returning users
 */
export interface CheckSetupResponse {
  success: boolean;
  isSetupComplete: boolean;
  agent?: {
    id: string;
    name: string;
    venue: string;
  };
  deployment?: {
    id: string;
    status: string;
  };
  telegramUser?: TelegramUser;
  ostiumAgentAddress?: string;
  tradingPreferences?: TradingPreferences;
  error?: string;
}

/**
 * Options for API calls
 */
export interface LazyTraderApiOptions {
  /**
   * Base URL for the API
   * @default '/api/lazy-trading'
   */
  baseUrl?: string;
}

/**
 * Setup step status
 */
export type SetupStep = 'idle' | 'agent' | 'telegram-link' | 'telegram-connect' | 'create-agent' | 'complete';

/**
 * State for async operations
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

