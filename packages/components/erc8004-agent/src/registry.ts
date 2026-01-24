import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { REGISTRY_CONTRACTS, type SupportedNetwork } from './constants';
import { REGISTRY_ABI } from './abi';
import type { AgentMetadata, RegistrationStatus, RegistryAgentInfo, TransactionResult } from './types';

// Type for the agent struct returned by the contract
interface ContractAgentData {
    owner: Address;
    name: string;
    version: string;
    capabilities: readonly string[];
    stake: bigint;
    reputation: bigint;
    isActive: boolean;
    registeredAt: bigint;
}

/**
 * Check if an agent is registered for the given owner
 */
export async function checkRegistration(
    publicClient: PublicClient,
    network: SupportedNetwork,
    ownerAddress: Address,
    registryAddress?: Address
): Promise<RegistrationStatus> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];

    if (registry === '0x0000000000000000000000000000000000000000') {
        return { isRegistered: false };
    }

    try {
        const isRegistered = await publicClient.readContract({
            address: registry,
            abi: REGISTRY_ABI,
            functionName: 'isAgentRegistered',
            args: [ownerAddress],
        });

        if (!isRegistered) {
            return { isRegistered: false };
        }

        const agentId = await publicClient.readContract({
            address: registry,
            abi: REGISTRY_ABI,
            functionName: 'getAgentByOwner',
            args: [ownerAddress],
        }) as Hash;

        const agentData = await publicClient.readContract({
            address: registry,
            abi: REGISTRY_ABI,
            functionName: 'getAgent',
            args: [agentId],
        });

        console.log('Raw agent data from contract:', agentData);

        let agentInfo: RegistryAgentInfo;

        if (agentData && typeof agentData === 'object' && 'owner' in agentData) {
            const data = agentData as ContractAgentData;
            agentInfo = {
                agentId,
                owner: data.owner,
                name: data.name,
                version: data.version,
                capabilities: [...data.capabilities],
                stake: data.stake,
                reputation: data.reputation,
                isActive: data.isActive,
                registeredAt: data.registeredAt,
            };
        } else if (Array.isArray(agentData)) {
            agentInfo = {
                agentId,
                owner: agentData[0] as Address,
                name: agentData[1] as string,
                version: agentData[2] as string,
                capabilities: agentData[3] as string[],
                stake: agentData[4] as bigint,
                reputation: agentData[5] as bigint,
                isActive: agentData[6] as boolean,
                registeredAt: agentData[7] as bigint,
            };
        } else {
            console.error('Unexpected agent data format:', agentData);
            return { isRegistered: false };
        }

        console.log('Parsed agent info:', agentInfo);

        return {
            isRegistered: true,
            agentInfo,
        };
    } catch (error) {
        console.error('Error checking registration:', error);
        return { isRegistered: false };
    }
}


/**
 * Register a new agent on the ERC-8004 registry
 */
export async function registerAgent(
    publicClient: PublicClient,
    walletClient: WalletClient,
    network: SupportedNetwork,
    metadata: AgentMetadata,
    stakeAmount?: bigint,
    registryAddress?: Address
): Promise<TransactionResult> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];
    const account = walletClient.account;

    if (!account) {
        throw new Error('Wallet not connected');
    }

    if (registry === '0x0000000000000000000000000000000000000000') {
        throw new Error('Registry contract not deployed on this network');
    }

    const hash = await walletClient.writeContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'registerAgent',
        args: [metadata.name, metadata.version, metadata.capabilities],
        value: stakeAmount ?? 0n,
        chain: null,
        account,
    });

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Extract agent ID from logs
    const registeredEvent = receipt.logs.find(log => {
        try {
            return log.topics[0]?.toLowerCase() === '0x' + 'AgentRegistered'.toLowerCase();
        } catch {
            return false;
        }
    });

    const agentId = registeredEvent?.topics[1] as Hash | undefined;

    return { hash, agentId };
}

/**
 * Update agent capabilities
 */
export async function updateAgentCapabilities(
    publicClient: PublicClient,
    walletClient: WalletClient,
    network: SupportedNetwork,
    agentId: Hash,
    capabilities: string[],
    registryAddress?: Address
): Promise<TransactionResult> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];
    const account = walletClient.account;

    if (!account) {
        throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'updateCapabilities',
        args: [agentId, capabilities],
        chain: null,
        account,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
}

/**
 * Add stake to an agent
 */
export async function addAgentStake(
    publicClient: PublicClient,
    walletClient: WalletClient,
    network: SupportedNetwork,
    agentId: Hash,
    amount: bigint,
    registryAddress?: Address
): Promise<TransactionResult> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];
    const account = walletClient.account;

    if (!account) {
        throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'stake',
        args: [agentId],
        value: amount,
        chain: null,
        account,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
}

/**
 * Withdraw stake from an agent
 */
export async function withdrawAgentStake(
    publicClient: PublicClient,
    walletClient: WalletClient,
    network: SupportedNetwork,
    agentId: Hash,
    amount: bigint,
    registryAddress?: Address
): Promise<TransactionResult> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];
    const account = walletClient.account;

    if (!account) {
        throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'withdraw',
        args: [agentId, amount],
        chain: null,
        account,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
}

/**
 * Deactivate an agent
 */
export async function deactivateAgent(
    publicClient: PublicClient,
    walletClient: WalletClient,
    network: SupportedNetwork,
    agentId: Hash,
    registryAddress?: Address
): Promise<TransactionResult> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];
    const account = walletClient.account;

    if (!account) {
        throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'deactivateAgent',
        args: [agentId],
        chain: null,
        account,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
}

/**
 * Reactivate an agent
 */
export async function reactivateAgent(
    publicClient: PublicClient,
    walletClient: WalletClient,
    network: SupportedNetwork,
    agentId: Hash,
    registryAddress?: Address
): Promise<TransactionResult> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];
    const account = walletClient.account;

    if (!account) {
        throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'reactivateAgent',
        args: [agentId],
        chain: null,
        account,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
}

/**
 * Get stake amount for an agent
 */
export async function getAgentStake(
    publicClient: PublicClient,
    network: SupportedNetwork,
    agentId: Hash,
    registryAddress?: Address
): Promise<bigint> {
    const registry = registryAddress ?? REGISTRY_CONTRACTS[network];

    const agentData = await publicClient.readContract({
        address: registry,
        abi: REGISTRY_ABI,
        functionName: 'getAgent',
        args: [agentId],
    });

    if (agentData && typeof agentData === 'object' && 'stake' in agentData) {
        return (agentData as ContractAgentData).stake;
    } else if (Array.isArray(agentData)) {
        return agentData[4] as bigint;
    }

    return 0n;
}
