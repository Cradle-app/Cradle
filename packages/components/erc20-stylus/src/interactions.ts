/**
 * ERC20 Token Interaction Functions
 */

import { ethers } from 'ethers';
import type { Address, Hash } from 'viem';
import { ERC20_ABI, TOKEN_DECIMALS } from './constants';
import type { TokenInfo, BalanceInfo, AllowanceInfo } from './types';

/**
 * Get token information
 */
export async function getTokenInfo(
  contractAddress: Address,
  rpcEndpoint: string
): Promise<TokenInfo> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupply, owner, paused] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
    contract.totalSupply(),
    contract.owner(),
    contract.paused(),
  ]);

  return {
    address: contractAddress,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: BigInt(totalSupply),
    formattedTotalSupply: ethers.formatUnits(totalSupply, decimals),
    owner: owner as Address,
    paused,
  };
}

/**
 * Get balance of an address
 */
export async function getBalance(
  contractAddress: Address,
  accountAddress: Address,
  rpcEndpoint: string
): Promise<BalanceInfo> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

  const balance = await contract.balanceOf(accountAddress);
  
  return {
    balance: BigInt(balance),
    formatted: ethers.formatUnits(balance, TOKEN_DECIMALS),
  };
}

/**
 * Get allowance
 */
export async function getAllowance(
  contractAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address,
  rpcEndpoint: string
): Promise<AllowanceInfo> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

  const allowance = await contract.allowance(ownerAddress, spenderAddress);
  
  return {
    allowance: BigInt(allowance),
    formatted: ethers.formatUnits(allowance, TOKEN_DECIMALS),
  };
}

/**
 * Transfer tokens
 */
export async function transfer(
  contractAddress: Address,
  to: Address,
  amount: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.transfer(to, amountWei);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Approve spender
 */
export async function approve(
  contractAddress: Address,
  spender: Address,
  amount: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.approve(spender, amountWei);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Transfer from another account
 */
export async function transferFrom(
  contractAddress: Address,
  from: Address,
  to: Address,
  amount: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.transferFrom(from, to, amountWei);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Mint new tokens (owner only)
 */
export async function mint(
  contractAddress: Address,
  to: Address,
  amount: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.mint(to, amountWei);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Burn tokens
 */
export async function burn(
  contractAddress: Address,
  amount: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.burn(amountWei);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Pause token transfers (owner only)
 */
export async function pause(
  contractAddress: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const tx = await contract.pause();
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Unpause token transfers (owner only)
 */
export async function unpause(
  contractAddress: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const tx = await contract.unpause();
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Transfer ownership (owner only)
 */
export async function transferOwnership(
  contractAddress: Address,
  newOwner: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const tx = await contract.transferOwnership(newOwner);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}
