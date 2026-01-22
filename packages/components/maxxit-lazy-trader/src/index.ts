/**
 * @cradle/maxxit-lazy-trader
 *
 * Maxxit Lazy Trader API Integration
 * Connect and message your Lazy Trader agent via API
 *
 * @example
 * ```tsx
 * import { useMaxxitLazyTrader } from '@cradle/maxxit-lazy-trader';
 *
 * function LazyTraderDashboard() {
 *   const { details, fetchDetails, sendMessage } = useMaxxitLazyTrader(apiKey);
 *
 *   return (
 *     <div>
 *       <button onClick={fetchDetails}>Fetch Agent Details</button>
 *       <button onClick={() => sendMessage('Buy BTC')}>Send Message</button>
 *     </div>
 *   );
 * }
 * ```
 */

// Types
export type {
  ClubDetailsResponse,
  SendMessageResponse,
  MaxxitApiOptions,
  FetchState,
  SendState,
} from './types';

// API Functions
export {
  fetchClubDetails,
  sendMessageToAgent,
} from './api';

// React Hooks
export {
  useMaxxitLazyTrader,
  type UseMaxxitLazyTraderReturn,
} from './hooks';
