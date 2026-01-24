/**
 * ERC20 Token Deployment Functions
 */

import { ethers } from 'ethers';
import type { Address } from 'viem';
import { 
  FACTORY_ADDRESSES, 
  RPC_ENDPOINTS, 
  TOKEN_FACTORY_ABI, 
  ERC20_ABI,
  type SupportedNetwork,
} from './constants';
import type { DeployTokenParams, DeployTokenResult } from './types';

/**
 * Deploy an ERC20 token via the deployment API
 * This calls the backend service which handles cargo-stylus deployment
 */
export async function deployERC20TokenViaAPI(
  params: DeployTokenParams & {
    privateKey: string;
    rpcEndpoint: string;
    deploymentApiUrl: string;
  }
): Promise<DeployTokenResult> {
  const { name, symbol, initialSupply, factoryAddress, privateKey, rpcEndpoint, deploymentApiUrl } = params;

  const response = await fetch(`${deploymentApiUrl}/deploy-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      symbol,
      initialSupply,
      factoryAddress,
      privateKey,
      rpcEndpoint,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Deployment failed with status ${response.status}`);
  }

  const result = await response.json();
  
  return {
    tokenAddress: result.tokenAddress as Address,
    txHash: result.txHash || '0x',
    success: result.success,
    deployOutput: result.deployOutput,
    initOutput: result.initOutput,
    registerOutput: result.registerOutput,
  };
}

/**
 * Initialize an already deployed ERC20 token
 */
export async function initializeToken(
  contractAddress: Address,
  name: string,
  symbol: string,
  initialSupply: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const tx = await contract.init(name, symbol, BigInt(initialSupply));
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Register token in factory
 */
export async function registerTokenInFactory(
  tokenAddress: Address,
  name: string,
  symbol: string,
  initialSupply: string,
  factoryAddress: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, wallet);

  const initialSupplyWei = ethers.parseEther(initialSupply);
  const tx = await factory.registerToken(tokenAddress, name, symbol, initialSupplyWei);
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Check if token is already registered in factory
 */
export async function isTokenRegistered(
  tokenAddress: Address,
  factoryAddress: Address,
  rpcEndpoint: string
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, provider);

  try {
    const allTokens = await factory.getAllDeployedTokens();
    return allTokens.some(
      (addr: string) => addr.toLowerCase() === tokenAddress.toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Get factory address for network
 */
export function getFactoryAddress(network: SupportedNetwork): Address {
  return FACTORY_ADDRESSES[network];
}

/**
 * Get RPC endpoint for network
 */
export function getRpcEndpoint(network: SupportedNetwork): string {
  return RPC_ENDPOINTS[network];
}
