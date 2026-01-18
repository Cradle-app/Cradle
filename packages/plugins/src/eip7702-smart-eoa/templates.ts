import type { z } from 'zod';
import type { EIP7702SmartEOAConfig } from '@dapp-forge/blueprint-schema';
import { dedent } from '@dapp-forge/plugin-sdk';

type Config = z.infer<typeof EIP7702SmartEOAConfig>;

/**
 * Generate delegate contract (Solidity)
 */
export function generateDelegateContract(config: Config): string {
  const features = new Set(config.features);

  return dedent(`
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.24;

    /**
     * @title ${config.delegateName}
     * @notice EIP-7702 delegate contract for smart EOA functionality
     * @dev This contract is designed to be used with EIP-7702 SetCode transactions
     * @custom:generated-by Cradle
     */
    contract ${config.delegateName} {
        /// @notice Thrown when a call fails
        error CallFailed(uint256 index, bytes returnData);
        
        /// @notice Thrown when arrays have mismatched lengths
        error ArrayLengthMismatch();
        
        ${features.has('session-keys') ? `
        /// @notice Session key data
        struct SessionKey {
            uint256 validUntil;
            bytes32 permissions;
            bool active;
        }
        
        /// @notice Mapping of session keys
        mapping(address => SessionKey) public sessionKeys;
        
        /// @notice Emitted when a session key is added
        event SessionKeyAdded(address indexed key, uint256 validUntil, bytes32 permissions);
        
        /// @notice Emitted when a session key is revoked
        event SessionKeyRevoked(address indexed key);
        ` : ''}
        
        /// @notice Emitted when a call is executed
        event Executed(address indexed to, uint256 value, bytes data, bytes result);
        
        ${features.has('batch-calls') ? `
        /// @notice Emitted when a batch is executed
        event BatchExecuted(uint256 indexed count);
        ` : ''}

        /**
         * @notice Execute a single call
         * @param to Target address
         * @param value ETH value to send
         * @param data Calldata
         * @return result The return data from the call
         */
        function execute(
            address to,
            uint256 value,
            bytes calldata data
        ) external payable returns (bytes memory result) {
            bool success;
            (success, result) = to.call{value: value}(data);
            
            if (!success) {
                revert CallFailed(0, result);
            }
            
            emit Executed(to, value, data, result);
        }

        ${features.has('batch-calls') ? `
        /**
         * @notice Execute multiple calls atomically
         * @param targets Array of target addresses
         * @param values Array of ETH values
         * @param calldatas Array of calldata
         * @return results Array of return data
         */
        function executeBatch(
            address[] calldata targets,
            uint256[] calldata values,
            bytes[] calldata calldatas
        ) external payable returns (bytes[] memory results) {
            uint256 length = targets.length;
            
            if (length != values.length || length != calldatas.length) {
                revert ArrayLengthMismatch();
            }
            
            results = new bytes[](length);
            
            for (uint256 i = 0; i < length; i++) {
                bool success;
                (success, results[i]) = targets[i].call{value: values[i]}(calldatas[i]);
                
                if (!success) {
                    revert CallFailed(i, results[i]);
                }
            }
            
            emit BatchExecuted(length);
        }
        ` : ''}

        ${features.has('session-keys') ? `
        /**
         * @notice Add a session key with limited permissions
         * @param key The session key address
         * @param validUntil Timestamp when the key expires
         * @param permissions Bitmap of allowed operations
         */
        function addSessionKey(
            address key,
            uint256 validUntil,
            bytes32 permissions
        ) external {
            require(key != address(0), "Invalid key");
            require(validUntil > block.timestamp, "Invalid expiry");
            
            sessionKeys[key] = SessionKey({
                validUntil: validUntil,
                permissions: permissions,
                active: true
            });
            
            emit SessionKeyAdded(key, validUntil, permissions);
        }
        
        /**
         * @notice Revoke a session key
         * @param key The session key to revoke
         */
        function revokeSessionKey(address key) external {
            sessionKeys[key].active = false;
            emit SessionKeyRevoked(key);
        }
        
        /**
         * @notice Check if a session key is valid
         * @param key The session key to check
         * @return valid Whether the key is currently valid
         */
        function isSessionKeyValid(address key) external view returns (bool valid) {
            SessionKey memory sk = sessionKeys[key];
            return sk.active && sk.validUntil > block.timestamp;
        }
        ` : ''}

        ${features.has('sponsored-tx') ? `
        /**
         * @notice Execute a call with gas sponsored by another account
         * @dev The sponsor must have pre-approved this delegate
         * @param to Target address
         * @param value ETH value to send
         * @param data Calldata
         * @param sponsor Address paying for gas (unused in EIP-7702 context, for interface compatibility)
         * @return result The return data from the call
         */
        function executeSponsored(
            address to,
            uint256 value,
            bytes calldata data,
            address sponsor
        ) external payable returns (bytes memory result) {
            // In EIP-7702 context, sponsorship is handled at the transaction level
            // This function provides a compatible interface
            return this.execute(to, value, data);
        }
        ` : ''}

        /// @notice Allow receiving ETH
        receive() external payable {}
    }
  `);
}

/**
 * Generate EIP-7702 helper functions (viem-based)
 */
export function generateEIP7702Helpers(config: Config): string {
  return dedent(`
    // EIP-7702 Helper Functions
    // Generated by Cradle
    
    import {
      type Address,
      type Hash,
      type Hex,
      type TransactionRequest,
      type WalletClient,
      type PublicClient,
      encodeAbiParameters,
      encodeFunctionData,
      keccak256,
      toHex,
      concat,
      pad,
      numberToHex,
    } from 'viem';
    import { arbitrum, arbitrumSepolia } from 'viem/chains';
    
    // EIP-7702 Authorization type
    export interface Authorization {
      chainId: number;
      address: Address; // Delegate contract address
      nonce: bigint;
    }
    
    // Signed authorization
    export interface SignedAuthorization extends Authorization {
      yParity: number;
      r: Hex;
      s: Hex;
    }
    
    // EIP-7702 Transaction type (0x04)
    export interface EIP7702Transaction extends TransactionRequest {
      type: 'eip7702';
      authorizationList: SignedAuthorization[];
    }
    
    // Delegate contract address (set after deployment)
    export const DELEGATE_ADDRESS: Address = '0x0000000000000000000000000000000000000000'; // TODO: Set after deployment
    
    /**
     * Create an EIP-7702 authorization for the delegate contract
     */
    export async function createAuthorization(
      walletClient: WalletClient,
      delegateAddress: Address,
      chainId?: number
    ): Promise<SignedAuthorization> {
      const chain = chainId ?? arbitrum.id;
      const account = walletClient.account;
      
      if (!account) {
        throw new Error('Wallet client must have an account');
      }
      
      // Get current nonce for the account
      const publicClient = walletClient.extend((client) => ({
        getTransactionCount: async (address: Address) => {
          // This would need the actual public client
          return 0n; // Placeholder
        },
      }));
      
      const authorization: Authorization = {
        chainId: chain,
        address: delegateAddress,
        nonce: 0n, // Will be filled by wallet
      };
      
      // Sign the authorization using EIP-7702 signing
      // Note: This requires wallet support for EIP-7702
      const signedAuth = await signAuthorization(walletClient, authorization);
      
      return signedAuth;
    }
    
    /**
     * Sign an EIP-7702 authorization
     */
    async function signAuthorization(
      walletClient: WalletClient,
      authorization: Authorization
    ): Promise<SignedAuthorization> {
      const account = walletClient.account;
      if (!account) {
        throw new Error('Wallet client must have an account');
      }
      
      // Encode the authorization for signing
      // EIP-7702 authorization format: MAGIC || chainId || address || nonce
      const MAGIC = 0x05; // EIP-7702 magic byte
      
      const encodedAuth = concat([
        toHex(MAGIC, { size: 1 }),
        pad(numberToHex(authorization.chainId), { size: 32 }),
        authorization.address,
        pad(numberToHex(Number(authorization.nonce)), { size: 32 }),
      ]);
      
      const authHash = keccak256(encodedAuth);
      
      // Sign the hash
      const signature = await walletClient.signMessage({
        account,
        message: { raw: authHash },
      });
      
      // Parse signature into r, s, v
      const r = signature.slice(0, 66) as Hex;
      const s = ('0x' + signature.slice(66, 130)) as Hex;
      const v = parseInt(signature.slice(130, 132), 16);
      
      return {
        ...authorization,
        yParity: v - 27,
        r,
        s,
      };
    }
    
    /**
     * Create a revocation authorization (delegate to address(0))
     */
    export async function createRevocationAuthorization(
      walletClient: WalletClient,
      chainId?: number
    ): Promise<SignedAuthorization> {
      return createAuthorization(
        walletClient,
        '0x0000000000000000000000000000000000000000',
        chainId
      );
    }
    
    /**
     * Encode a single call for the delegate
     */
    export function encodeExecuteCall(
      to: Address,
      value: bigint,
      data: Hex
    ): Hex {
      return encodeFunctionData({
        abi: [
          {
            name: 'execute',
            type: 'function',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' },
            ],
            outputs: [{ name: 'result', type: 'bytes' }],
          },
        ],
        functionName: 'execute',
        args: [to, value, data],
      });
    }
    
    ${config.features.includes('batch-calls') ? `
    /**
     * Encode a batch of calls for the delegate
     */
    export function encodeExecuteBatchCall(
      calls: Array<{ to: Address; value: bigint; data: Hex }>
    ): Hex {
      return encodeFunctionData({
        abi: [
          {
            name: 'executeBatch',
            type: 'function',
            inputs: [
              { name: 'targets', type: 'address[]' },
              { name: 'values', type: 'uint256[]' },
              { name: 'calldatas', type: 'bytes[]' },
            ],
            outputs: [{ name: 'results', type: 'bytes[]' }],
          },
        ],
        functionName: 'executeBatch',
        args: [
          calls.map((c) => c.to),
          calls.map((c) => c.value),
          calls.map((c) => c.data),
        ],
      });
    }
    ` : ''}
    
    /**
     * Check if an address has an active EIP-7702 delegation
     */
    export async function hasActiveDelegation(
      publicClient: PublicClient,
      address: Address
    ): Promise<boolean> {
      const code = await publicClient.getBytecode({ address });
      
      // EIP-7702 delegated accounts have code starting with 0xef0100
      if (code && code.startsWith('0xef0100')) {
        return true;
      }
      
      return false;
    }
    
    /**
     * Get the delegate address from an EIP-7702 delegated account
     */
    export async function getDelegateAddress(
      publicClient: PublicClient,
      address: Address
    ): Promise<Address | null> {
      const code = await publicClient.getBytecode({ address });
      
      // EIP-7702 delegated accounts have code: 0xef0100 + 20 byte address
      if (code && code.startsWith('0xef0100') && code.length >= 46) {
        return ('0x' + code.slice(8, 48)) as Address;
      }
      
      return null;
    }
  `);
}

/**
 * Generate React hooks for EIP-7702 authorization
 */
export function generateAuthorizationHooks(config: Config): string {
  return dedent(`
    // EIP-7702 React Hooks
    // Generated by Cradle
    
    'use client';
    
    import { useState, useCallback, useEffect } from 'react';
    import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
    import type { Address, Hex } from 'viem';
    import {
      createAuthorization,
      createRevocationAuthorization,
      encodeExecuteCall,
      ${config.features.includes('batch-calls') ? 'encodeExecuteBatchCall,' : ''}
      hasActiveDelegation,
      getDelegateAddress,
      DELEGATE_ADDRESS,
      type SignedAuthorization,
    } from '@/lib/eip7702/eip7702-helpers';
    
    export interface UseEIP7702Return {
      // State
      isAuthorized: boolean;
      isLoading: boolean;
      error: Error | null;
      delegateAddress: Address | null;
      
      // Actions
      authorize: () => Promise<SignedAuthorization>;
      revoke: () => Promise<SignedAuthorization>;
      execute: (params: ExecuteParams) => Promise<Hex>;
      ${config.features.includes('batch-calls') ? 'executeBatch: (calls: ExecuteParams[]) => Promise<Hex>;' : ''}
      
      // Utils
      checkAuthorization: () => Promise<boolean>;
    }
    
    export interface ExecuteParams {
      to: Address;
      value?: bigint;
      data: Hex;
    }
    
    /**
     * Hook for EIP-7702 smart EOA functionality
     */
    export function useEIP7702(): UseEIP7702Return {
      const { address, isConnected } = useAccount();
      const { data: walletClient } = useWalletClient();
      const publicClient = usePublicClient();
      
      const [isAuthorized, setIsAuthorized] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<Error | null>(null);
      const [delegateAddress, setDelegateAddress] = useState<Address | null>(null);
      
      // Check if the account has an active delegation
      const checkAuthorization = useCallback(async () => {
        if (!address || !publicClient) return false;
        
        try {
          const hasActive = await hasActiveDelegation(publicClient, address);
          setIsAuthorized(hasActive);
          
          if (hasActive) {
            const delegate = await getDelegateAddress(publicClient, address);
            setDelegateAddress(delegate);
          } else {
            setDelegateAddress(null);
          }
          
          return hasActive;
        } catch (err) {
          console.error('Failed to check authorization:', err);
          return false;
        }
      }, [address, publicClient]);
      
      // Check authorization on mount and account change
      useEffect(() => {
        if (isConnected && address) {
          checkAuthorization();
        }
      }, [isConnected, address, checkAuthorization]);
      
      // Create and sign an authorization
      const authorize = useCallback(async () => {
        if (!walletClient) {
          throw new Error('Wallet not connected');
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
          const signedAuth = await createAuthorization(
            walletClient,
            DELEGATE_ADDRESS
          );
          
          // After authorization is used in a transaction, check status
          await checkAuthorization();
          
          return signedAuth;
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Authorization failed');
          setError(error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      }, [walletClient, checkAuthorization]);
      
      // Revoke delegation
      const revoke = useCallback(async () => {
        if (!walletClient) {
          throw new Error('Wallet not connected');
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
          const signedAuth = await createRevocationAuthorization(walletClient);
          
          setIsAuthorized(false);
          setDelegateAddress(null);
          
          return signedAuth;
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Revocation failed');
          setError(error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      }, [walletClient]);
      
      // Execute a single call through the delegate
      const execute = useCallback(async (params: ExecuteParams) => {
        if (!walletClient || !address) {
          throw new Error('Wallet not connected');
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
          const calldata = encodeExecuteCall(
            params.to,
            params.value ?? 0n,
            params.data
          );
          
          // If not authorized, include authorization in transaction
          let authorizationList: SignedAuthorization[] = [];
          if (!isAuthorized) {
            const auth = await createAuthorization(walletClient, DELEGATE_ADDRESS);
            authorizationList = [auth];
          }
          
          // Send EIP-7702 transaction
          const hash = await walletClient.sendTransaction({
            to: address, // Send to self (EOA with delegated code)
            data: calldata,
            // authorizationList would be included here
            // Note: Requires wallet support for EIP-7702
          });
          
          return hash;
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Execution failed');
          setError(error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      }, [walletClient, address, isAuthorized]);
      
      ${config.features.includes('batch-calls') ? `
      // Execute batch calls through the delegate
      const executeBatch = useCallback(async (calls: ExecuteParams[]) => {
        if (!walletClient || !address) {
          throw new Error('Wallet not connected');
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
          const calldata = encodeExecuteBatchCall(
            calls.map((c) => ({
              to: c.to,
              value: c.value ?? 0n,
              data: c.data,
            }))
          );
          
          // If not authorized, include authorization in transaction
          let authorizationList: SignedAuthorization[] = [];
          if (!isAuthorized) {
            const auth = await createAuthorization(walletClient, DELEGATE_ADDRESS);
            authorizationList = [auth];
          }
          
          // Send EIP-7702 transaction
          const hash = await walletClient.sendTransaction({
            to: address,
            data: calldata,
          });
          
          return hash;
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Batch execution failed');
          setError(error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      }, [walletClient, address, isAuthorized]);
      ` : ''}
      
      return {
        isAuthorized,
        isLoading,
        error,
        delegateAddress,
        authorize,
        revoke,
        execute,
        ${config.features.includes('batch-calls') ? 'executeBatch,' : ''}
        checkAuthorization,
      };
    }
    
    /**
     * Hook for monitoring EIP-7702 authorization status
     */
    export function useEIP7702Status(address?: Address) {
      const publicClient = usePublicClient();
      const [status, setStatus] = useState<{
        isAuthorized: boolean;
        delegateAddress: Address | null;
        isLoading: boolean;
      }>({
        isAuthorized: false,
        delegateAddress: null,
        isLoading: true,
      });
      
      useEffect(() => {
        if (!address || !publicClient) {
          setStatus((s) => ({ ...s, isLoading: false }));
          return;
        }
        
        const checkStatus = async () => {
          try {
            const hasActive = await hasActiveDelegation(publicClient, address);
            const delegate = hasActive
              ? await getDelegateAddress(publicClient, address)
              : null;
            
            setStatus({
              isAuthorized: hasActive,
              delegateAddress: delegate,
              isLoading: false,
            });
          } catch {
            setStatus((s) => ({ ...s, isLoading: false }));
          }
        };
        
        checkStatus();
      }, [address, publicClient]);
      
      return status;
    }
  `);
}

/**
 * Generate delegation management UI component
 */
export function generateDelegationUI(config: Config): string {
  return dedent(`
    // EIP-7702 Delegation Manager Component
    // Generated by Cradle
    
    'use client';
    
    import { useState } from 'react';
    import { useAccount } from 'wagmi';
    import { useEIP7702 } from '@/hooks/useEIP7702';
    import { DELEGATE_ADDRESS } from '@/lib/eip7702/eip7702-helpers';
    ${config.securityWarnings ? "import { validateDelegateContract, formatSecurityWarning } from '@/lib/eip7702/security';" : ''}
    
    interface DelegationManagerProps {
      className?: string;
    }
    
    export function DelegationManager({ className }: DelegationManagerProps) {
      const { address, isConnected } = useAccount();
      const {
        isAuthorized,
        isLoading,
        error,
        delegateAddress,
        authorize,
        revoke,
      } = useEIP7702();
      
      const [showWarning, setShowWarning] = useState(false);
      const [pendingAction, setPendingAction] = useState<'authorize' | 'revoke' | null>(null);
      
      const handleAuthorize = async () => {
        ${config.securityWarnings ? `
        // Show security warning before authorization
        setShowWarning(true);
        setPendingAction('authorize');
        ` : `
        try {
          await authorize();
        } catch (err) {
          console.error('Authorization failed:', err);
        }
        `}
      };
      
      const handleRevoke = async () => {
        try {
          await revoke();
        } catch (err) {
          console.error('Revocation failed:', err);
        }
      };
      
      const confirmAction = async () => {
        setShowWarning(false);
        
        if (pendingAction === 'authorize') {
          try {
            await authorize();
          } catch (err) {
            console.error('Authorization failed:', err);
          }
        }
        
        setPendingAction(null);
      };
      
      if (!isConnected) {
        return (
          <div className={className}>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <p className="text-zinc-400">Connect your wallet to manage EIP-7702 delegation</p>
            </div>
          </div>
        );
      }
      
      return (
        <div className={className}>
          <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800 space-y-4">
            <h2 className="text-xl font-semibold text-white">EIP-7702 Smart EOA</h2>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              <div
                className={\`w-3 h-3 rounded-full \${
                  isAuthorized ? 'bg-emerald-500' : 'bg-zinc-600'
                }\`}
              />
              <span className="text-sm text-zinc-300">
                {isAuthorized ? 'Delegation Active' : 'No Active Delegation'}
              </span>
            </div>
            
            {/* Delegate Address */}
            {delegateAddress && (
              <div className="p-3 bg-zinc-800/50 rounded-md">
                <p className="text-xs text-zinc-500 mb-1">Delegate Contract</p>
                <code className="text-sm text-emerald-400 font-mono">
                  {delegateAddress}
                </code>
              </div>
            )}
            
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
                <p className="text-sm text-red-400">{error.message}</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              {!isAuthorized ? (
                <button
                  onClick={handleAuthorize}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 
                           text-white rounded-md font-medium transition-colors"
                >
                  {isLoading ? 'Authorizing...' : 'Enable Smart EOA'}
                </button>
              ) : (
                <button
                  onClick={handleRevoke}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 
                           text-white rounded-md font-medium transition-colors"
                >
                  {isLoading ? 'Revoking...' : 'Revoke Delegation'}
                </button>
              )}
            </div>
            
            ${config.securityWarnings ? `
            {/* Security Warning Modal */}
            {showWarning && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md mx-4">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">Security Warning</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm text-zinc-300">
                    <p>You are about to authorize your EOA to delegate to a smart contract. This means:</p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-400">
                      <li>Your account will temporarily have smart contract capabilities</li>
                      <li>The delegate contract will be able to execute calls on your behalf</li>
                      <li>Always verify the delegate contract address before signing</li>
                    </ul>
                    
                    <div className="p-3 bg-zinc-800 rounded-md mt-4">
                      <p className="text-xs text-zinc-500 mb-1">Delegate Contract</p>
                      <code className="text-xs text-emerald-400 font-mono break-all">
                        {DELEGATE_ADDRESS}
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowWarning(false)}
                      className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 
                               text-white rounded-md font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAction}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 
                               text-white rounded-md font-medium transition-colors"
                    >
                      I Understand, Proceed
                    </button>
                  </div>
                </div>
              </div>
            )}
            ` : ''}
            
            {/* Features */}
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Enabled Features</p>
              <div className="flex flex-wrap gap-2">
                ${config.features.map(f => `
                <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md">
                  ${f}
                </span>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    export default DelegationManager;
  `);
}

/**
 * Generate security utilities
 */
export function generateSecurityUtils(config: Config): string {
  return dedent(`
    // EIP-7702 Security Utilities
    // Generated by Cradle
    
    import type { Address, PublicClient } from 'viem';
    
    export interface SecurityCheck {
      passed: boolean;
      warning?: string;
      severity: 'info' | 'warning' | 'critical';
    }
    
    export interface DelegateValidation {
      isValid: boolean;
      checks: SecurityCheck[];
      overallRisk: 'low' | 'medium' | 'high' | 'critical';
    }
    
    // Known safe delegate contracts (whitelist)
    export const KNOWN_SAFE_DELEGATES: Address[] = [
      // Add verified delegate contracts here
    ];
    
    // Known malicious delegate contracts (blacklist)
    export const KNOWN_MALICIOUS_DELEGATES: Address[] = [
      // Add known malicious contracts here
    ];
    
    /**
     * Validate a delegate contract before authorization
     */
    export async function validateDelegateContract(
      publicClient: PublicClient,
      delegateAddress: Address
    ): Promise<DelegateValidation> {
      const checks: SecurityCheck[] = [];
      
      // Check 1: Not zero address
      if (delegateAddress === '0x0000000000000000000000000000000000000000') {
        checks.push({
          passed: true,
          warning: 'Revoking delegation (address(0))',
          severity: 'info',
        });
        return { isValid: true, checks, overallRisk: 'low' };
      }
      
      // Check 2: Blacklist check
      if (KNOWN_MALICIOUS_DELEGATES.includes(delegateAddress)) {
        checks.push({
          passed: false,
          warning: 'This address is on the known malicious contracts list!',
          severity: 'critical',
        });
        return { isValid: false, checks, overallRisk: 'critical' };
      }
      
      // Check 3: Whitelist check
      const isWhitelisted = KNOWN_SAFE_DELEGATES.includes(delegateAddress);
      checks.push({
        passed: isWhitelisted,
        warning: isWhitelisted
          ? 'Contract is on the verified safe list'
          : 'Contract is not on the verified safe list - proceed with caution',
        severity: isWhitelisted ? 'info' : 'warning',
      });
      
      // Check 4: Contract has code
      try {
        const code = await publicClient.getBytecode({ address: delegateAddress });
        const hasCode = code && code !== '0x';
        
        checks.push({
          passed: hasCode,
          warning: hasCode
            ? 'Contract has deployed code'
            : 'Address has no code - this may be an EOA or undeployed contract',
          severity: hasCode ? 'info' : 'warning',
        });
      } catch {
        checks.push({
          passed: false,
          warning: 'Could not verify contract code',
          severity: 'warning',
        });
      }
      
      // Check 5: Contract is verified (placeholder - would need etherscan API)
      checks.push({
        passed: false,
        warning: 'Contract verification status unknown - verify manually on block explorer',
        severity: 'warning',
      });
      
      // Calculate overall risk
      const criticalFailures = checks.filter(c => !c.passed && c.severity === 'critical').length;
      const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;
      
      let overallRisk: DelegateValidation['overallRisk'] = 'low';
      if (criticalFailures > 0) {
        overallRisk = 'critical';
      } else if (warnings > 2) {
        overallRisk = 'high';
      } else if (warnings > 0) {
        overallRisk = 'medium';
      }
      
      return {
        isValid: criticalFailures === 0,
        checks,
        overallRisk,
      };
    }
    
    /**
     * Format a security warning message
     */
    export function formatSecurityWarning(validation: DelegateValidation): string {
      const lines: string[] = [];
      
      lines.push(\`Overall Risk: \${validation.overallRisk.toUpperCase()}\`);
      lines.push('');
      
      for (const check of validation.checks) {
        const icon = check.passed ? '✓' : '✗';
        const severityIcon = {
          info: 'ℹ️',
          warning: '⚠️',
          critical: '🚨',
        }[check.severity];
        
        lines.push(\`\${icon} \${severityIcon} \${check.warning}\`);
      }
      
      return lines.join('\\n');
    }
    
    /**
     * Check if a transaction looks like a phishing attempt
     */
    export function detectPhishingAttempt(
      delegateAddress: Address,
      targetAddress: Address,
      value: bigint
    ): { isPhishing: boolean; reason?: string } {
      // Check for common phishing patterns
      
      // Pattern 1: Delegate to EOA (not a contract)
      // This would need async check, placeholder for now
      
      // Pattern 2: High value transfer to unknown address
      if (value > BigInt(1e18)) {
        return {
          isPhishing: false,
          reason: 'High value transaction - please verify carefully',
        };
      }
      
      // Pattern 3: Target is the delegate itself (self-call exploitation)
      if (targetAddress === delegateAddress) {
        return {
          isPhishing: true,
          reason: 'Suspicious: Transaction targets the delegate contract itself',
        };
      }
      
      return { isPhishing: false };
    }
  `);
}

