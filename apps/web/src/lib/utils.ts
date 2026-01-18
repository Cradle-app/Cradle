import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatWei(wei: string): string {
  try {
    const value = BigInt(wei);
    const eth = Number(value) / 1e18;
    if (eth >= 1) {
      return `${eth.toFixed(4)} ETH`;
    } else if (eth >= 0.001) {
      return `${(eth * 1000).toFixed(2)} mETH`;
    } else {
      return `${wei} wei`;
    }
  } catch {
    return wei;
  }
}

export function nodeTypeToLabel(type: string): string {
  const labels: Record<string, string> = {
    // Original nodes
    'stylus-contract': 'Stylus Contract',
    'stylus-zk-contract': 'Stylus ZK Contract',
    'x402-paywall-api': 'x402 Paywall API',
    'erc8004-agent-runtime': 'ERC-8004 Agent',
    'repo-quality-gates': 'Quality Gates',
    'frontend-scaffold': 'Frontend Scaffold',
    'sdk-generator': 'SDK Generator',
    // New Arbitrum-focused nodes
    'eip7702-smart-eoa': 'EIP-7702 Smart EOA',
    'wallet-auth': 'Wallet Authentication',
    'rpc-provider': 'RPC Provider',
    'arbitrum-bridge': 'Arbitrum Bridge',
    'chain-data': 'Chain Data',
    'ipfs-storage': 'IPFS Storage',
    'chain-abstraction': 'Chain Abstraction',
    'zk-primitives': 'ZK Primitives',
  };
  return labels[type] || type;
}

export function nodeTypeToColor(type: string): string {
  const colors: Record<string, string> = {
    // Original nodes
    'stylus-contract': 'node-contracts',
    'stylus-zk-contract': 'node-contracts',
    'x402-paywall-api': 'node-payments',
    'erc8004-agent-runtime': 'node-agents',
    'repo-quality-gates': 'node-quality',
    'frontend-scaffold': 'node-app',
    'sdk-generator': 'node-app',
    // New Arbitrum-focused nodes
    'eip7702-smart-eoa': 'node-contracts',
    'wallet-auth': 'node-app',
    'rpc-provider': 'node-app',
    'arbitrum-bridge': 'node-app',
    'chain-data': 'node-app',
    'ipfs-storage': 'node-app',
    'chain-abstraction': 'node-app',
    'zk-primitives': 'node-contracts',
  };
  return colors[type] || 'node-contracts';
}

