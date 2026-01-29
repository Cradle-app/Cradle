/**
 * @cradle/erc20-stylus
 *
 * ERC-20 Token interaction utilities for Arbitrum Stylus
 *
 * @example
 * ```tsx
 * import { useERC20Interactions, CHAIN_IDS } from '@cradle/erc20-stylus';
 *
 * function TokenPanel() {
 *   const token = useERC20Interactions({
 *     contractAddress: '0x...',
 *     network: 'arbitrum-sepolia',
 *   });
 *
 *   return (
 *     <div>
 *       <p>Name: {token.tokenInfo.data?.name}</p>
 *       <p>Balance: {token.balance.data?.formatted}</p>
 *     </div>
 *   );
 * }
 * ```
 */

// Constants
export {
  CHAIN_IDS,
  RPC_ENDPOINTS,
  FACTORY_ADDRESSES,
  TOKEN_DECIMALS,
  ERC20_ABI,
  TOKEN_FACTORY_ABI,
  type SupportedNetwork,
} from './constants';

// Types
export type {
  TokenInfo,
  BalanceInfo,
  AllowanceInfo,
  TransactionState,
  AsyncState,
  UseERC20InteractionsOptions,
  UseERC20InteractionsReturn,
} from './types';

// Interaction functions
export {
  getTokenInfo,
  getBalance,
  getAllowance,
  transfer,
  approve,
  transferFrom,
  mint,
  burn,
  pause,
  unpause,
  transferOwnership,
} from './interactions';

// React Hooks
export {
  useERC20Interactions,
} from './hooks';

// Interaction Panel Component
export { ERC20InteractionPanel } from './ERC20InteractionPanel';

// Utilities
export { cn } from './cn';
