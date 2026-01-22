/**
 * Maxxit Lazy Trader API Types
 */

/**
 * Club details response from Maxxit API
 */
export interface ClubDetailsResponse {
  success?: boolean;
  user_wallet?: string;
  agent?: {
    id?: string | number;
    name?: string;
    venue?: string;
    status?: string;
  };
  telegram_user?: {
    id?: string | number;
    telegram_user_id?: string;
    telegram_username?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  deployment?: {
    id?: string | number;
    status?: string;
    enabled_venues?: string[];
  } | null;
  trading_preferences?: {
    risk_tolerance?: string | number;
    trade_frequency?: string | number;
    social_sentiment_weight?: string | number;
    price_momentum_focus?: string | number;
    market_rank_priority?: string | number;
  } | null;
  ostium_agent_address?: string | null;
  error?: string;
  message?: string;
}

/**
 * Send message response from Maxxit API
 */
export interface SendMessageResponse {
  success?: boolean;
  duplicate?: boolean;
  message_id?: string;
  post_id?: string | number;
  error?: string;
  message?: string;
}

/**
 * Options for API calls
 */
export interface MaxxitApiOptions {
  /**
   * Base URL for the Maxxit API
   * @default 'http://localhost:5000'
   */
  baseUrl?: string;
}

/**
 * State for fetch operations
 */
export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * State for send operations
 */
export interface SendState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}
