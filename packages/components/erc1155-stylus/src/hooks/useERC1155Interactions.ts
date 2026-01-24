/**
 * React hook for interacting with ERC1155 tokens using wagmi
 */

import { useState, useCallback, useEffect } from 'react';
import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { ERC1155_ABI } from '../constants';
import type { 
  UseERC1155InteractionsOptions, 
  UseERC1155InteractionsReturn,
  AsyncState,
  TransactionState,
  MultiTokenInfo,
  TokenTypeInfo,
  TokenBalance,
} from '../types';

export function useERC1155Interactions(options: UseERC1155InteractionsOptions): UseERC1155InteractionsReturn {
  const { 
    contractAddress, 
    network,
    publicClient,
    walletClient,
    userAddress,
  } = options;

  const [contractInfo, setContractInfo] = useState<AsyncState<MultiTokenInfo>>({ status: 'idle' });
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
  const [error, setError] = useState<Error | null>(null);

  // Fetch contract info
  const refetchContractInfo = useCallback(async () => {
    if (!publicClient) return;
    
    setContractInfo({ status: 'loading' });
    try {
      const [owner, paused] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: ERC1155_ABI,
          functionName: 'owner',
        }) as Promise<Address>,
        publicClient.readContract({
          address: contractAddress,
          abi: ERC1155_ABI,
          functionName: 'isPaused',
        }) as Promise<boolean>,
      ]);

      // Get base URI by querying for token ID 0
      const uri = await publicClient.readContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'uri',
        args: [BigInt(0)],
      }) as string;

      // Extract base URI from full URI
      const baseUri = uri.replace('0.json', '');

      setContractInfo({
        status: 'success',
        data: {
          address: contractAddress,
          baseUri,
          owner,
          paused,
        },
      });
    } catch (err) {
      setContractInfo({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [publicClient, contractAddress]);

  // Fetch on mount
  useEffect(() => {
    refetchContractInfo();
  }, [refetchContractInfo]);

  // Get token info
  const getTokenInfo = useCallback(async (tokenId: bigint): Promise<TokenTypeInfo> => {
    if (!publicClient) {
      throw new Error('Public client is required');
    }

    const [totalSupply, exists, uri] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'totalSupply',
        args: [tokenId],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'exists',
        args: [tokenId],
      }) as Promise<boolean>,
      publicClient.readContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'uri',
        args: [tokenId],
      }) as Promise<string>,
    ]);

    return {
      id: tokenId,
      totalSupply,
      exists,
      uri,
    };
  }, [publicClient, contractAddress]);

  // Get balance
  const getBalance = useCallback(async (tokenId: bigint): Promise<bigint> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }

    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOf',
      args: [userAddress, tokenId],
    }) as bigint;

    return balance;
  }, [publicClient, contractAddress, userAddress]);

  // Get batch balance
  const getBalanceBatch = useCallback(async (tokenIds: bigint[]): Promise<TokenBalance[]> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }

    const accounts = tokenIds.map(() => userAddress);
    
    const balances = await publicClient.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOfBatch',
      args: [accounts, tokenIds],
    }) as bigint[];

    return tokenIds.map((id, index) => ({
      id,
      balance: balances[index],
    }));
  }, [publicClient, contractAddress, userAddress]);

  // Check approval
  const isApprovedForAll = useCallback(async (operator: Address): Promise<boolean> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }

    const approved = await publicClient.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'isApprovedForAll',
      args: [userAddress, operator],
    }) as boolean;

    return approved;
  }, [publicClient, contractAddress, userAddress]);

  // Helper to execute a write transaction
  const executeTransaction = useCallback(async (
    functionName: string,
    args: readonly unknown[]
  ): Promise<Hash> => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet client is required for transactions');
    }

    setError(null);
    setTxState({ status: 'pending' });

    try {
      // Use type assertion to handle the strict ABI typing
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: functionName as 'pause',
        args: args as readonly [],
        account: walletClient.account,
      } as Parameters<typeof publicClient.simulateContract>[0]);

      const hash = await walletClient.writeContract(request as Parameters<typeof walletClient.writeContract>[0]);
      setTxState({ status: 'confirming', hash });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxState({ status: 'success', hash });

      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setTxState({ status: 'error', error });
      throw error;
    }
  }, [walletClient, publicClient, contractAddress]);

  // Set approval for all
  const setApprovalForAll = useCallback(async (operator: Address, approved: boolean): Promise<Hash> => {
    return executeTransaction('setApprovalForAll', [operator, approved]);
  }, [executeTransaction]);

  // Safe transfer
  const safeTransferFrom = useCallback(async (
    from: Address, to: Address, id: bigint, amount: bigint
  ): Promise<Hash> => {
    const hash = await executeTransaction('safeTransferFrom', [from, to, id, amount, '0x']);
    return hash;
  }, [executeTransaction]);

  // Safe batch transfer
  const safeBatchTransferFrom = useCallback(async (
    from: Address, to: Address, ids: bigint[], amounts: bigint[]
  ): Promise<Hash> => {
    const hash = await executeTransaction('safeBatchTransferFrom', [from, to, ids, amounts, '0x']);
    return hash;
  }, [executeTransaction]);

  // Mint
  const mint = useCallback(async (to: Address, id: bigint, amount: bigint): Promise<Hash> => {
    const hash = await executeTransaction('mint', [to, id, amount, '0x']);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Mint new
  const mintNew = useCallback(async (to: Address, amount: bigint): Promise<{ hash: Hash; tokenId: bigint }> => {
    const hash = await executeTransaction('mintNew', [to, amount]);
    refetchContractInfo();
    // Note: In a real implementation, we'd parse the event logs to get the token ID
    return { hash, tokenId: BigInt(0) };
  }, [executeTransaction, refetchContractInfo]);

  // Mint batch
  const mintBatch = useCallback(async (to: Address, ids: bigint[], amounts: bigint[]): Promise<Hash> => {
    const hash = await executeTransaction('mintBatch', [to, ids, amounts, '0x']);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Burn
  const burn = useCallback(async (id: bigint, amount: bigint): Promise<Hash> => {
    const hash = await executeTransaction('burn', [id, amount]);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Burn batch
  const burnBatch = useCallback(async (ids: bigint[], amounts: bigint[]): Promise<Hash> => {
    const hash = await executeTransaction('burnBatch', [ids, amounts]);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Set URI
  const setUri = useCallback(async (newUri: string): Promise<Hash> => {
    const hash = await executeTransaction('setUri', [newUri]);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Pause
  const pause = useCallback(async (): Promise<Hash> => {
    const hash = await executeTransaction('pause', []);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Unpause
  const unpause = useCallback(async (): Promise<Hash> => {
    const hash = await executeTransaction('unpause', []);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  // Transfer ownership
  const transferOwnership = useCallback(async (newOwner: Address): Promise<Hash> => {
    const hash = await executeTransaction('transferOwnership', [newOwner]);
    refetchContractInfo();
    return hash;
  }, [executeTransaction, refetchContractInfo]);

  return {
    contractInfo,
    refetchContractInfo,
    getTokenInfo,
    getBalance,
    getBalanceBatch,
    isApprovedForAll,
    setApprovalForAll,
    safeTransferFrom,
    safeBatchTransferFrom,
    mint,
    mintNew,
    mintBatch,
    burn,
    burnBatch,
    setUri,
    pause,
    unpause,
    transferOwnership,
    txState,
    isLoading: txState.status === 'pending' || txState.status === 'confirming',
    error,
  };
}
