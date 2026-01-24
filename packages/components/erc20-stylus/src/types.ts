/**
 * ERC20 Stylus Types
 */

import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import type { SupportedNetwork } from './constants';

/**
 * Token deployment parameters
 */
export interface DeployTokenParams {
  name: string;
  symbol: string;
  initialSupply: string;
  factoryAddress?: Address;
}

/**
 * Token deployment result
 */
export interface DeployTokenResult {
  tokenAddress: Address;
  txHash: Hash;
  success: boolean;
  deployOutput?: string;
  initOutput?: string;
  registerOutput?: string;
}

/**
 * Token information
 */
export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  formattedTotalSupply: string;
  owner: Address;
  paused: boolean;
}

/**
 * Balance information
 */
export interface BalanceInfo {
  balance: bigint;
  formatted: string;
}

/**
 * Allowance information
 */
export interface AllowanceInfo {
  allowance: bigint;
  formatted: string;
}

/**
 * Transaction state
 */
export type TransactionState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'confirming'; hash: Hash }
  | { status: 'success'; hash: Hash }
  | { status: 'error'; error: Error };

/**
 * Deployment state
 */
export type DeploymentState =
  | { status: 'idle' }
  | { status: 'deploying' }
  | { status: 'activating' }
  | { status: 'initializing' }
  | { status: 'registering' }
  | { status: 'success'; result: DeployTokenResult }
  | { status: 'error'; error: Error };

/**
 * Async state for data fetching
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Configuration for deployment hook (uses wagmi)
 */
export interface UseERC20DeployOptions {
  network: SupportedNetwork;
  privateKey?: string;
  rpcEndpoint?: string;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  userAddress?: Address;
  deploymentApiUrl?: string;
}

/**
 * Configuration for interactions hook (uses wagmi)
 */
export interface UseERC20InteractionsOptions {
  contractAddress: Address;
  network: SupportedNetwork;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  userAddress?: Address;
}

/**
 * Return type for deployment hook
 */
export interface UseERC20DeployReturn {
  deployToken: (params: DeployTokenParams) => Promise<DeployTokenResult>;
  deploymentState: DeploymentState;
  isDeploying: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Return type for interactions hook
 */
export interface UseERC20InteractionsReturn {
  // Token info
  tokenInfo: AsyncState<TokenInfo>;
  refetchTokenInfo: () => Promise<void>;
  
  // Balance
  balance: AsyncState<BalanceInfo>;
  refetchBalance: () => Promise<void>;
  
  // Allowance
  getAllowance: (spender: Address) => Promise<AllowanceInfo>;
  
  // Transactions (uses wallet popup)
  transfer: (to: Address, amount: string) => Promise<Hash>;
  approve: (spender: Address, amount: string) => Promise<Hash>;
  transferFrom: (from: Address, to: Address, amount: string) => Promise<Hash>;
  mint: (to: Address, amount: string) => Promise<Hash>;
  burn: (amount: string) => Promise<Hash>;
  pause: () => Promise<Hash>;
  unpause: () => Promise<Hash>;
  transferOwnership: (newOwner: Address) => Promise<Hash>;
  
  // Transaction state
  txState: TransactionState;
  isLoading: boolean;
  error: Error | null;
}
