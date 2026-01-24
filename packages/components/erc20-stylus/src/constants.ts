/**
 * ERC20 Stylus Constants
 */

import type { Address } from 'viem';

export const CHAIN_IDS = {
  'arbitrum': 42161,
  'arbitrum-sepolia': 421614,
} as const;

export type SupportedNetwork = keyof typeof CHAIN_IDS;

export const RPC_ENDPOINTS: Record<SupportedNetwork, string> = {
  'arbitrum': 'https://arb1.arbitrum.io/rpc',
  'arbitrum-sepolia': 'https://sepolia-rollup.arbitrum.io/rpc',
};

export const FACTORY_ADDRESSES: Record<SupportedNetwork, Address> = {
  'arbitrum': '0xed088fd93517b0d0c3a3e4d2e2c419fb58570556' as Address,
  'arbitrum-sepolia': '0xed088fd93517b0d0c3a3e4d2e2c419fb58570556' as Address,
};

export const TOKEN_DECIMALS = 18;

/**
 * Get RPC endpoint for network
 */
export function getRpcEndpoint(network: SupportedNetwork): string {
  return RPC_ENDPOINTS[network];
}

// ERC20 Stylus Contract ABI
export const ERC20_ABI = [
  // Initialization
  {
    type: 'function',
    name: 'init',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initial_supply', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // View functions
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  // State-changing functions
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

// Token Factory ABI
export const TOKEN_FACTORY_ABI = [
  // Create new token (deploys a new instance)
  {
    type: 'function',
    name: 'createToken',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  // Register existing token
  {
    type: 'function',
    name: 'registerToken',
    inputs: [
      { name: 'token_address', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initial_supply', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getTotalTokensDeployed',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllDeployedTokens',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTokenInfo',
    inputs: [{ name: 'token_address', type: 'address' }],
    outputs: [
      { name: '', type: 'address' },
      { name: '', type: 'string' },
      { name: '', type: 'string' },
      { name: '', type: 'uint256' },
      { name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TokenCreated',
    inputs: [
      { name: 'tokenAddress', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'initialSupply', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
