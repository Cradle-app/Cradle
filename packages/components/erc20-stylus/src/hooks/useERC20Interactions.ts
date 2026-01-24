/**
 * React hook for interacting with ERC20 tokens using wagmi
 */

import { useState, useCallback, useEffect } from 'react';
import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { parseUnits, formatUnits } from 'viem';
import { ERC20_ABI, TOKEN_DECIMALS, getRpcEndpoint } from '../constants';
import type { 
  UseERC20InteractionsOptions, 
  UseERC20InteractionsReturn,
  AsyncState,
  TransactionState,
  TokenInfo,
  BalanceInfo,
  AllowanceInfo,
} from '../types';

export function useERC20Interactions(options: UseERC20InteractionsOptions): UseERC20InteractionsReturn {
  const { 
    contractAddress, 
    network,
    publicClient,
    walletClient,
    userAddress,
  } = options;

  const [tokenInfo, setTokenInfo] = useState<AsyncState<TokenInfo>>({ status: 'idle' });
  const [balance, setBalance] = useState<AsyncState<BalanceInfo>>({ status: 'idle' });
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
  const [error, setError] = useState<Error | null>(null);

  // Fetch token info
  const refetchTokenInfo = useCallback(async () => {
    if (!publicClient) return;
    
    setTokenInfo({ status: 'loading' });
    try {
      const [name, symbol, decimals, totalSupply, owner, paused] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'name',
        }) as Promise<string>,
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }) as Promise<string>,
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'owner',
        }) as Promise<Address>,
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'paused',
        }) as Promise<boolean>,
      ]);

      setTokenInfo({
        status: 'success',
        data: {
          address: contractAddress,
          name,
          symbol,
          decimals,
          totalSupply,
          formattedTotalSupply: formatUnits(totalSupply, decimals),
          owner,
          paused,
        },
      });
    } catch (err) {
      setTokenInfo({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [publicClient, contractAddress]);

  // Fetch balance
  const refetchBalance = useCallback(async () => {
    if (!publicClient || !userAddress) {
      setBalance({ status: 'idle' });
      return;
    }
    setBalance({ status: 'loading' });
    try {
      const balanceValue = await publicClient.readContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as bigint;
      
      setBalance({
        status: 'success',
        data: {
          balance: balanceValue,
          formatted: formatUnits(balanceValue, TOKEN_DECIMALS),
        },
      });
    } catch (err) {
      setBalance({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [publicClient, contractAddress, userAddress]);

  // Fetch on mount
  useEffect(() => {
    refetchTokenInfo();
    refetchBalance();
  }, [refetchTokenInfo, refetchBalance]);

  // Get allowance
  const getAllowance = useCallback(async (spender: Address): Promise<AllowanceInfo> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }
    const allowance = await publicClient.readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, spender],
    }) as bigint;
    
    return {
      allowance,
      formatted: formatUnits(allowance, TOKEN_DECIMALS),
    };
  }, [publicClient, contractAddress, userAddress]);

  // Helper to execute a write transaction
  const executeTransaction = useCallback(async (
    functionName: string,
    args: unknown[]
  ): Promise<Hash> => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet client is required for transactions');
    }

    setError(null);
    setTxState({ status: 'pending' });

    try {
      // Use any type assertion for dynamic contract calls
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: functionName as any,
        args: args as any,
        account: walletClient.account,
      } as any);

      const hash = await walletClient.writeContract(request as any);
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

  // Transfer
  const transfer = useCallback(async (to: Address, amount: string): Promise<Hash> => {
    const amountWei = parseUnits(amount, TOKEN_DECIMALS);
    const hash = await executeTransaction('transfer', [to, amountWei]);
    refetchBalance();
    return hash;
  }, [executeTransaction, refetchBalance]);

  // Approve
  const approve = useCallback(async (spender: Address, amount: string): Promise<Hash> => {
    const amountWei = parseUnits(amount, TOKEN_DECIMALS);
    return executeTransaction('approve', [spender, amountWei]);
  }, [executeTransaction]);

  // Transfer from
  const transferFrom = useCallback(async (from: Address, to: Address, amount: string): Promise<Hash> => {
    const amountWei = parseUnits(amount, TOKEN_DECIMALS);
    const hash = await executeTransaction('transferFrom', [from, to, amountWei]);
    refetchBalance();
    return hash;
  }, [executeTransaction, refetchBalance]);

  // Mint
  const mint = useCallback(async (to: Address, amount: string): Promise<Hash> => {
    const amountWei = parseUnits(amount, TOKEN_DECIMALS);
    const hash = await executeTransaction('mint', [to, amountWei]);
    refetchTokenInfo();
    refetchBalance();
    return hash;
  }, [executeTransaction, refetchTokenInfo, refetchBalance]);

  // Burn
  const burn = useCallback(async (amount: string): Promise<Hash> => {
    const amountWei = parseUnits(amount, TOKEN_DECIMALS);
    const hash = await executeTransaction('burn', [amountWei]);
    refetchTokenInfo();
    refetchBalance();
    return hash;
  }, [executeTransaction, refetchTokenInfo, refetchBalance]);

  // Pause
  const pause = useCallback(async (): Promise<Hash> => {
    const hash = await executeTransaction('pause', []);
    refetchTokenInfo();
    return hash;
  }, [executeTransaction, refetchTokenInfo]);

  // Unpause
  const unpause = useCallback(async (): Promise<Hash> => {
    const hash = await executeTransaction('unpause', []);
    refetchTokenInfo();
    return hash;
  }, [executeTransaction, refetchTokenInfo]);

  // Transfer ownership
  const transferOwnership = useCallback(async (newOwner: Address): Promise<Hash> => {
    const hash = await executeTransaction('transferOwnership', [newOwner]);
    refetchTokenInfo();
    return hash;
  }, [executeTransaction, refetchTokenInfo]);

  return {
    tokenInfo,
    refetchTokenInfo,
    balance,
    refetchBalance,
    getAllowance,
    transfer,
    approve,
    transferFrom,
    mint,
    burn,
    pause,
    unpause,
    transferOwnership,
    txState,
    isLoading: txState.status === 'pending' || txState.status === 'confirming',
    error,
  };
}
