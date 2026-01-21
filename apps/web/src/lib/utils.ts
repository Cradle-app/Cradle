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
    // Contracts
    'stylus-contract': 'Stylus Contract',
    'stylus-zk-contract': 'Stylus ZK Contract',
    'eip7702-smart-eoa': 'EIP-7702 Smart EOA',
    'zk-primitives': 'ZK Primitives',
    // Payments
    'x402-paywall-api': 'x402 Paywall API',
    // Agents
    'erc8004-agent-runtime': 'ERC-8004 Agent',
    'ostium-trading': 'Ostium One-Click Trading',
    'onchain-activity': 'Onchain Activity',
    // App
    'wallet-auth': 'Wallet Authentication',
    'rpc-provider': 'RPC Provider',
    'arbitrum-bridge': 'Arbitrum Bridge',
    'chain-data': 'Chain Data',
    'ipfs-storage': 'IPFS Storage',
    'chain-abstraction': 'Chain Abstraction',
    'frontend-scaffold': 'Frontend Scaffold',
    'sdk-generator': 'SDK Generator',
    // Telegram
    'telegram-notifications': 'Telegram Notifications',
    'telegram-commands': 'Telegram Commands',
    'telegram-ai-agent': 'Telegram AI Agent',
    'telegram-wallet-link': 'Telegram Wallet Link',
    // Quality
    'repo-quality-gates': 'Quality Gates',
    // Legacy
    'maxxit': 'Maxxit Trading Agent',
  };
  return labels[type] || type;
}

export function nodeTypeToColor(type: string): string {
  const colors: Record<string, string> = {
    // Contracts
    'stylus-contract': 'node-contracts',
    'stylus-zk-contract': 'node-contracts',
    'eip7702-smart-eoa': 'node-contracts',
    'zk-primitives': 'node-contracts',
    // Payments
    'x402-paywall-api': 'node-payments',
    // Agents
    'erc8004-agent-runtime': 'node-agents',
    'ostium-trading': 'node-agents',
    'onchain-activity': 'node-agents',
    // App
    'wallet-auth': 'node-app',
    'rpc-provider': 'node-app',
    'arbitrum-bridge': 'node-app',
    'chain-data': 'node-app',
    'ipfs-storage': 'node-app',
    'chain-abstraction': 'node-app',
    'frontend-scaffold': 'node-app',
    'sdk-generator': 'node-app',
    // Telegram
    'telegram-notifications': 'node-telegram',
    'telegram-commands': 'node-telegram',
    'telegram-ai-agent': 'node-telegram',
    'telegram-wallet-link': 'node-telegram',
    // Quality
    'repo-quality-gates': 'node-quality',
    // Legacy
    'maxxit': 'node-agents',
  };
  return colors[type] || 'node-contracts';
}

