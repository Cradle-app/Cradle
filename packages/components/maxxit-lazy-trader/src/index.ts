/**
 * @cradle/maxxit-lazy-trader
 *
 * Maxxit Lazy Trader Integration
 * 4-step wallet-based setup flow for Telegram-connected trading
 *
 * @example
 * ```tsx
 * import { useLazyTraderSetup } from '@cradle/maxxit-lazy-trader';
 *
 * function LazyTraderSetup() {
 *   const { address } = useAccount();
 *   const setup = useLazyTraderSetup({ userWallet: address });
 *
 *   return (
 *     <div>
 *       <button onClick={setup.generateAgent}>Step 1: Generate Agent</button>
 *       <button onClick={setup.generateLink}>Step 2: Get Telegram Link</button>
 *       <button onClick={setup.startPolling}>Step 3: Wait for Connection</button>
 *       <button onClick={setup.createAgent}>Step 4: Create Agent</button>
 *     </div>
 *   );
 * }
 * ```
 */

// Types
export type {
  TradingPreferences,
  GenerateAgentResponse,
  GenerateTelegramLinkResponse,
  CheckTelegramStatusResponse,
  CreateAgentResponse,
  CheckSetupResponse,
  TelegramUser,
  LazyTraderApiOptions,
  SetupStep,
  AsyncState,
} from './types';

// API Functions
export {
  generateOstiumAgent,
  generateTelegramLink,
  checkTelegramStatus,
  createLazyTraderAgent,
  checkSetup,
} from './api';

// React Hooks
export {
  useLazyTraderSetup,
  type UseLazyTraderSetupReturn,
} from './hooks';
