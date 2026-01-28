# Ostium One-Click Trading Component

Pre-built component for enabling one-click trading on Ostium DEX.

## Overview

This component provides React hooks and utilities for:

1. **Delegation Setup**: Enable gasless transactions by delegating signature authority
2. **USDC Approval**: Pre-approve USDC spending for the Ostium storage contract
3. **Network Support**: Works on Arbitrum mainnet and Sepolia testnet

## Installation

This package is included in your generated project. No additional installation required.

## Usage

### Basic Usage with Hooks

```tsx
import { useDelegation, useUsdcApproval, CONTRACTS, CHAIN_IDS } from '@cradle/ostium-onect';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

function TradingSetup() {
  const network = 'arbitrum'; // or 'arbitrum-sepolia'
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_IDS[network] });
  const { data: walletClient } = useWalletClient({ chainId: CHAIN_IDS[network] });

  const delegation = useDelegation({
    publicClient: publicClient!,
    walletClient: walletClient ?? undefined,
    network,
    userAddress: address,
    delegateAddress: '0x...', // Your delegate address
  });

  const approval = useUsdcApproval({
    publicClient: publicClient!,
    walletClient: walletClient ?? undefined,
    network,
    userAddress: address,
  });

  return (
    <div>
      <button onClick={() => delegation.enable()}>
        Enable Delegation
      </button>
      <button onClick={() => approval.approve()}>
        Approve USDC
      </button>
    </div>
  );
}
```

### Using Core Functions Directly

```tsx
import { 
  checkDelegationStatus, 
  enableDelegation,
  checkApprovalStatus,
  approveUsdc,
  CONTRACTS 
} from '@cradle/ostium-onect';

// Check if delegation is active
const status = await checkDelegationStatus(publicClient, network, userAddress);

// Enable delegation
const hash = await enableDelegation(walletClient, network, delegateAddress);

// Check USDC approval
const approval = await checkApprovalStatus(publicClient, network, userAddress);

// Approve USDC spending
const approvalHash = await approveUsdc(walletClient, network, '1000000');
```

## Contract Addresses

### Arbitrum Mainnet

| Contract | Address |
|----------|---------|
| Trading | `0x...` (see constants.ts) |
| Storage | `0x...` (see constants.ts) |
| USDC | `0x...` (see constants.ts) |

### Arbitrum Sepolia (Testnet)

| Contract | Address |
|----------|---------|
| Trading | `0x...` (see constants.ts) |
| Storage | `0x...` (see constants.ts) |
| USDC | `0x...` (see constants.ts) |

## API Reference

### Hooks

#### `useDelegation(options)`

Manages delegation status and enabling.

**Options:**
- `publicClient` - Viem public client
- `walletClient` - Viem wallet client (optional)
- `network` - 'arbitrum' | 'arbitrum-sepolia'
- `userAddress` - User's wallet address
- `delegateAddress` - Address to delegate to

**Returns:**
- `status` - Current delegation status
- `isLoading` - Loading state
- `error` - Error message
- `enable()` - Function to enable delegation
- `refetch()` - Function to refresh status

#### `useUsdcApproval(options)`

Manages USDC approval status and approving.

**Options:**
- `publicClient` - Viem public client
- `walletClient` - Viem wallet client (optional)
- `network` - 'arbitrum' | 'arbitrum-sepolia'
- `userAddress` - User's wallet address

**Returns:**
- `status` - Current approval status
- `isLoading` - Loading state
- `error` - Error message
- `approve(amount?)` - Function to approve USDC
- `refetch()` - Function to refresh status

## Files

- `src/index.ts` - Main exports
- `src/delegation.ts` - Delegation logic
- `src/approval.ts` - USDC approval logic
- `src/constants.ts` - Contract addresses and ABIs
- `src/types.ts` - TypeScript types
- `src/hooks/` - React hooks
- `src/example.tsx` - Example usage component

---

Generated with ❤️ by [Cradle](https://cradle-web-eight.vercel.app)
