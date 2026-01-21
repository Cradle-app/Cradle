/**
 * Ostium One-Click Trading Constants
 * Contract addresses and ABIs for Arbitrum mainnet and testnet
 */

// Network chain IDs
export const CHAIN_IDS = {
    arbitrum: 42161,
    'arbitrum-sepolia': 421614,
} as const;

export type SupportedNetwork = keyof typeof CHAIN_IDS;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Contract addresses per network
export const CONTRACTS = {
    'arbitrum': {
        trading: '0x567c6A0eBC4e20b3612c82b2D0698Fc80FAb4C0d' as const,
        storage: '0x2b90103cdc42d6B6c3a09C56A87d2c44e8F0a345' as const,
        usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const,
    },
    'arbitrum-sepolia': {
        trading: '0x2A9B9c988393f46a2537B0ff11E98c2C15a95afe' as const,
        storage: '0x0b9F5243B29938668c9Cfbd7557A389EC7Ef88b8' as const,
        usdc: '0xe73B11Fb1e3eeEe8AF2a23079A4410Fe1B370548' as const,
    },
} as const;

// ABIs for contract interactions
export const TRADING_ABI = [
    {
        name: 'setDelegate',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'delegate', type: 'address' }],
        outputs: [],
    },
    {
        name: 'removeDelegate',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'delegations',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'trader', type: 'address' }],
        outputs: [{ name: 'delegate', type: 'address' }],
    },
] as const;

export const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: 'success', type: 'bool' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: 'remaining', type: 'uint256' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
    },
] as const;

// USDC has 6 decimals
export const USDC_DECIMALS = 6;

// Default approval amount (1 million USDC)
export const DEFAULT_APPROVAL_AMOUNT = 1_000_000n * 10n ** BigInt(USDC_DECIMALS);

// Maximum uint256 for unlimited approval
export const MAX_UINT256 = 2n ** 256n - 1n;
