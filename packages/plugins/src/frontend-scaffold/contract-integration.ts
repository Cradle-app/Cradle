import type { z } from 'zod';
import type { FrontendScaffoldConfig } from '@dapp-forge/blueprint-schema';
import type { ExecutionContext, CodegenOutput } from '@dapp-forge/plugin-sdk';
import { dedent } from '@dapp-forge/plugin-sdk';

type Config = z.infer<typeof FrontendScaffoldConfig>;

/**
 * Contract information extracted from connected nodes
 */
interface ContractInfo {
    name: string;
    address?: string;
    abi?: string;
    type: 'erc20' | 'erc721' | 'erc1155' | 'custom';
}

/**
 * Extract connected contract information from the execution context
 */
export function extractConnectedContracts(context: ExecutionContext): ContractInfo[] {
    const contracts: ContractInfo[] = [];

    if (!context.nodeOutputs) {
        return contracts;
    }

    // Loop through all node outputs looking for contract interfaces
    for (const [nodeId, output] of context.nodeOutputs) {
        if (output.interfaces) {
            for (const iface of output.interfaces) {
                if (iface.type === 'abi') {
                    contracts.push({
                        name: iface.name.replace('ABI', ''),
                        abi: iface.content,
                        type: detectContractType(iface.name),
                    });
                }
            }
        }
    }

    return contracts;
}

/**
 * Detect contract type from name
 */
function detectContractType(name: string): ContractInfo['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('erc20') || lowerName.includes('token')) {
        return 'erc20';
    }
    if (lowerName.includes('erc721') || lowerName.includes('nft')) {
        return 'erc721';
    }
    if (lowerName.includes('erc1155')) {
        return 'erc1155';
    }
    return 'custom';
}

/**
 * Generate React hooks for contract interactions
 */
export function generateContractHooks(contracts: ContractInfo[], config: Config): string {
    if (contracts.length === 0) {
        return generateEmptyContractHooks();
    }

    const imports = [
        `'use client';`,
        ``,
        `import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';`,
        `import { type Address } from 'viem';`,
    ];

    const hookDefinitions: string[] = [];
    const abiDefinitions: string[] = [];

    for (const contract of contracts) {
        const contractName = contract.name;
        const hookPrefix = `use${contractName}`;

        // Generate ABI constant
        if (contract.abi) {
            abiDefinitions.push(`
export const ${contractName}ABI = ${contract.abi} as const;
      `);
        }

        // Generate hooks based on contract type
        switch (contract.type) {
            case 'erc20':
                hookDefinitions.push(generateERC20Hooks(contractName, hookPrefix));
                break;
            case 'erc721':
                hookDefinitions.push(generateERC721Hooks(contractName, hookPrefix));
                break;
            case 'erc1155':
                hookDefinitions.push(generateERC1155Hooks(contractName, hookPrefix));
                break;
            default:
                hookDefinitions.push(generateGenericHooks(contractName, hookPrefix));
        }
    }

    return dedent(`
    ${imports.join('\n')}

    // ============================================================================
    // Contract ABIs
    // ============================================================================
    ${abiDefinitions.join('\n')}

    // ============================================================================
    // Contract Hooks
    // ============================================================================
    ${hookDefinitions.join('\n\n')}

    // ============================================================================
    // Utility Types
    // ============================================================================
    export type ContractAddress = Address;
  `);
}

/**
 * Generate empty contract hooks file
 */
function generateEmptyContractHooks(): string {
    return dedent(`
    'use client';

    /**
     * Contract Hooks
     * 
     * This file will be populated with type-safe React hooks when you connect
     * smart contract nodes to the frontend-scaffold node in your Cradle workflow.
     * 
     * Example usage after connecting contracts:
     * 
     * \`\`\`tsx
     * import { useTokenBalance, useTokenTransfer } from '@/hooks/useContracts';
     * 
     * function TokenBalance({ address }) {
     *   const { data: balance } = useTokenBalance(address);
     *   return <div>Balance: {balance}</div>;
     * }
     * \`\`\`
     */

    // No contracts connected - hooks will be generated when you connect contract nodes
    export {};
  `);
}

/**
 * Generate ERC-20 specific hooks
 */
function generateERC20Hooks(contractName: string, prefix: string): string {
    return dedent(`
    // ${contractName} ERC-20 Hooks
    
    export function ${prefix}Balance(address: Address, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'balanceOf',
        args: [address],
      });
    }

    export function ${prefix}TotalSupply(contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'totalSupply',
      });
    }

    export function ${prefix}Allowance(owner: Address, spender: Address, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'allowance',
        args: [owner, spender],
      });
    }

    export function ${prefix}Transfer(contractAddress: Address) {
      const { writeContract, data: hash, isPending, error } = useWriteContract();
      const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

      const transfer = (to: Address, amount: bigint) => {
        writeContract({
          address: contractAddress,
          abi: ${contractName}ABI,
          functionName: 'transfer',
          args: [to, amount],
        });
      };

      return { transfer, hash, isPending, isConfirming, isSuccess, error };
    }

    export function ${prefix}Approve(contractAddress: Address) {
      const { writeContract, data: hash, isPending, error } = useWriteContract();
      const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

      const approve = (spender: Address, amount: bigint) => {
        writeContract({
          address: contractAddress,
          abi: ${contractName}ABI,
          functionName: 'approve',
          args: [spender, amount],
        });
      };

      return { approve, hash, isPending, isConfirming, isSuccess, error };
    }
  `);
}

/**
 * Generate ERC-721 specific hooks
 */
function generateERC721Hooks(contractName: string, prefix: string): string {
    return dedent(`
    // ${contractName} ERC-721 Hooks
    
    export function ${prefix}OwnerOf(tokenId: bigint, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      });
    }

    export function ${prefix}BalanceOf(address: Address, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'balanceOf',
        args: [address],
      });
    }

    export function ${prefix}TokenUri(tokenId: bigint, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      });
    }

    export function ${prefix}Transfer(contractAddress: Address) {
      const { writeContract, data: hash, isPending, error } = useWriteContract();
      const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

      const transfer = (from: Address, to: Address, tokenId: bigint) => {
        writeContract({
          address: contractAddress,
          abi: ${contractName}ABI,
          functionName: 'safeTransferFrom',
          args: [from, to, tokenId],
        });
      };

      return { transfer, hash, isPending, isConfirming, isSuccess, error };
    }

    export function ${prefix}Approve(contractAddress: Address) {
      const { writeContract, data: hash, isPending, error } = useWriteContract();
      const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

      const approve = (to: Address, tokenId: bigint) => {
        writeContract({
          address: contractAddress,
          abi: ${contractName}ABI,
          functionName: 'approve',
          args: [to, tokenId],
        });
      };

      return { approve, hash, isPending, isConfirming, isSuccess, error };
    }
  `);
}

/**
 * Generate ERC-1155 specific hooks
 */
function generateERC1155Hooks(contractName: string, prefix: string): string {
    return dedent(`
    // ${contractName} ERC-1155 Hooks
    
    export function ${prefix}BalanceOf(address: Address, tokenId: bigint, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'balanceOf',
        args: [address, tokenId],
      });
    }

    export function ${prefix}BalanceOfBatch(addresses: Address[], tokenIds: bigint[], contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'balanceOfBatch',
        args: [addresses, tokenIds],
      });
    }

    export function ${prefix}Uri(tokenId: bigint, contractAddress: Address) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName: 'uri',
        args: [tokenId],
      });
    }

    export function ${prefix}SafeTransferFrom(contractAddress: Address) {
      const { writeContract, data: hash, isPending, error } = useWriteContract();
      const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

      const transfer = (from: Address, to: Address, tokenId: bigint, amount: bigint, data: \`0x\${string}\` = '0x') => {
        writeContract({
          address: contractAddress,
          abi: ${contractName}ABI,
          functionName: 'safeTransferFrom',
          args: [from, to, tokenId, amount, data],
        });
      };

      return { transfer, hash, isPending, isConfirming, isSuccess, error };
    }
  `);
}

/**
 * Generate generic contract hooks
 */
function generateGenericHooks(contractName: string, prefix: string): string {
    return dedent(`
    // ${contractName} Generic Hooks
    
    /**
     * Read from the ${contractName} contract
     * 
     * @example
     * const { data } = ${prefix}Read('functionName', [arg1, arg2], contractAddress);
     */
    export function ${prefix}Read<T = unknown>(
      functionName: string,
      args: unknown[],
      contractAddress: Address
    ) {
      return useReadContract({
        address: contractAddress,
        abi: ${contractName}ABI,
        functionName,
        args,
      }) as { data: T | undefined; isLoading: boolean; error: Error | null };
    }

    /**
     * Write to the ${contractName} contract
     * 
     * @example
     * const { write, isPending, isSuccess } = ${prefix}Write(contractAddress);
     * write('functionName', [arg1, arg2]);
     */
    export function ${prefix}Write(contractAddress: Address) {
      const { writeContract, data: hash, isPending, error } = useWriteContract();
      const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

      const write = (functionName: string, args: unknown[]) => {
        writeContract({
          address: contractAddress,
          abi: ${contractName}ABI,
          functionName,
          args,
        });
      };

      return { write, hash, isPending, isConfirming, isSuccess, error };
    }
  `);
}
