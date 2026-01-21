/**
 * Ostium Delegation Logic
 * Functions to enable/disable delegation and check delegation status
 */

import {
    type Address,
    type PublicClient,
    type WalletClient,
    getContract,
} from 'viem';
import { CONTRACTS, TRADING_ABI, ZERO_ADDRESS, type SupportedNetwork } from './constants';
import type { DelegationStatus, TransactionResult } from './types';

/**
 * Get the trading contract for a specific network
 */
function getTradingContract(
    client: PublicClient | WalletClient,
    network: SupportedNetwork
) {
    return getContract({
        address: CONTRACTS[network].trading,
        abi: TRADING_ABI,
        client,
    });
}

/**
 * Check the current delegation status for a user
 */
export async function checkDelegation(
    client: PublicClient,
    network: SupportedNetwork,
    userAddress: Address
): Promise<DelegationStatus> {
    const contract = getTradingContract(client, network);

    try {
        const delegateAddress = await contract.read.delegations([userAddress]);

        const isDelegated = delegateAddress !== ZERO_ADDRESS;

        return {
            isDelegated,
            delegateAddress: isDelegated ? delegateAddress : null,
        };
    } catch (error) {
        console.error('Error checking delegation:', error);
        return {
            isDelegated: false,
            delegateAddress: null,
        };
    }
}

/**
 * Enable delegation to a specific address
 * This allows the delegate to sign transactions on behalf of the user
 */
export async function enableDelegation(
    walletClient: WalletClient,
    publicClient: PublicClient,
    network: SupportedNetwork,
    delegateAddress: Address
): Promise<TransactionResult> {
    const [account] = await walletClient.getAddresses();
    if (!account) {
        throw new Error('No account connected');
    }
    if (delegateAddress === ZERO_ADDRESS) {
        throw new Error('Delegate address is required');
    }

    const tradingAddress = CONTRACTS[network].trading;

    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
        address: tradingAddress,
        abi: TRADING_ABI,
        functionName: 'setDelegate',
        args: [delegateAddress],
        account,
    });

    // Execute the transaction
    const hash = await walletClient.writeContract(request);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
        hash,
        success: receipt.status === 'success',
    };
}

/**
 * Remove/disable delegation
 */
export async function removeDelegation(
    walletClient: WalletClient,
    publicClient: PublicClient,
    network: SupportedNetwork
): Promise<TransactionResult> {
    const [account] = await walletClient.getAddresses();
    if (!account) {
        throw new Error('No account connected');
    }

    const tradingAddress = CONTRACTS[network].trading;

    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
        address: tradingAddress,
        abi: TRADING_ABI,
        functionName: 'removeDelegate',
        args: [],
        account,
    });

    // Execute the transaction
    const hash = await walletClient.writeContract(request);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
        hash,
        success: receipt.status === 'success',
    };
}
