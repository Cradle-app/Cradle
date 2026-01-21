/**
 * Ostium USDC Approval Logic
 * Functions to approve USDC spending and check current allowance
 */

import {
    type Address,
    type PublicClient,
    type WalletClient,
    formatUnits,
    getContract,
} from 'viem';
import {
    CONTRACTS,
    ERC20_ABI,
    USDC_DECIMALS,
    DEFAULT_APPROVAL_AMOUNT,
    type SupportedNetwork,
} from './constants';
import type { ApprovalStatus, TransactionResult } from './types';

/**
 * Get the USDC contract for a specific network
 */
function getUsdcContract(
    client: PublicClient | WalletClient,
    network: SupportedNetwork
) {
    return getContract({
        address: CONTRACTS[network].usdc,
        abi: ERC20_ABI,
        client,
    });
}

/**
 * Check the current USDC allowance for the Ostium storage contract
 */
export async function checkAllowance(
    client: PublicClient,
    network: SupportedNetwork,
    userAddress: Address
): Promise<ApprovalStatus> {
    const usdcContract = getUsdcContract(client, network);
    const storageAddress = CONTRACTS[network].storage;

    try {
        const allowance = await usdcContract.read.allowance([
            userAddress,
            storageAddress,
        ]);

        // Consider approved if allowance is at least 100 USDC
        const minRequired = 100n * 10n ** BigInt(USDC_DECIMALS);
        const hasApproval = allowance >= minRequired;

        return {
            hasApproval,
            currentAllowance: allowance,
            formattedAllowance: formatUnits(allowance, USDC_DECIMALS),
        };
    } catch (error) {
        console.error('Error checking USDC allowance:', error);
        return {
            hasApproval: false,
            currentAllowance: 0n,
            formattedAllowance: '0',
        };
    }
}

/**
 * Get the user's USDC balance
 */
export async function getUsdcBalance(
    client: PublicClient,
    network: SupportedNetwork,
    userAddress: Address
): Promise<{ balance: bigint; formatted: string }> {
    const usdcContract = getUsdcContract(client, network);

    try {
        const balance = await usdcContract.read.balanceOf([userAddress]);
        return {
            balance,
            formatted: formatUnits(balance, USDC_DECIMALS),
        };
    } catch (error) {
        console.error('Error getting USDC balance:', error);
        return {
            balance: 0n,
            formatted: '0',
        };
    }
}

/**
 * Approve USDC spending for the Ostium storage contract
 */
export async function approveUsdc(
    walletClient: WalletClient,
    publicClient: PublicClient,
    network: SupportedNetwork,
    amount: bigint = DEFAULT_APPROVAL_AMOUNT
): Promise<TransactionResult> {
    const [account] = await walletClient.getAddresses();
    if (!account) {
        throw new Error('No account connected');
    }

    const usdcAddress = CONTRACTS[network].usdc;
    const storageAddress = CONTRACTS[network].storage;

    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [storageAddress, amount],
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
 * Revoke USDC approval (set allowance to 0)
 */
export async function revokeUsdcApproval(
    walletClient: WalletClient,
    publicClient: PublicClient,
    network: SupportedNetwork
): Promise<TransactionResult> {
    return approveUsdc(walletClient, publicClient, network, 0n);
}
