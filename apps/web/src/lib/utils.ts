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
    'stylus-rust-contract': 'Stylus Rust Contract',
    'smartcache-caching': 'SmartCache Caching',
    'auditware-analyzing': 'Auditware Analyzer',
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
    // AIXBT Intelligence
    'aixbt-momentum': 'AIXBT Momentum',
    'aixbt-signals': 'AIXBT Signals',
    'aixbt-indigo': 'AIXBT Indigo',
    'aixbt-observer': 'AIXBT Market Observer',
    // Legacy
    // ERC-20/ERC-721/ERC-1155 Stylus nodes
    'erc20-stylus': 'ERC-20 Stylus Token',
    'erc721-stylus': 'ERC-721 Stylus NFT',
    'erc1155-stylus': 'ERC-1155 Stylus Multi-Token',
    'maxxit': 'Maxxit Lazy Trader',
    // Superposition L3
    'superposition-network': 'Superposition Network',
    'superposition-bridge': 'Superposition Bridge',
    'superposition-longtail': 'Longtail AMM',
    'superposition-super-assets': 'Super Assets',
    'superposition-thirdweb': 'Thirdweb Deploy',
    'superposition-utility-mining': 'Utility Mining',
    'superposition-faucet': 'Testnet Faucet',
    'superposition-meow-domains': 'Meow Domains',
    // Dune Analytics
    'dune-execute-sql': 'Dune Execute SQL',
    'dune-token-price': 'Dune Token Price',
    'dune-wallet-balances': 'Dune Wallet Balances',
    'dune-dex-volume': 'Dune DEX Volume',
    'dune-nft-floor': 'Dune NFT Floor Price',
    'dune-address-labels': 'Dune Address Labels',
    'dune-transaction-history': 'Dune Transaction History',
    'dune-gas-price': 'Dune Gas Price',
    'dune-protocol-tvl': 'Dune Protocol TVL',
  };
  return labels[type] || type;
}

export function nodeTypeToColor(type: string): string {
  const colors: Record<string, string> = {
    // Contracts
    'stylus-contract': 'node-contracts',
    'stylus-zk-contract': 'node-contracts',
    'stylus-rust-contract': 'node-contracts',
    'smartcache-caching': 'node-contracts',
    'auditware-analyzing': 'node-contracts',
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
    // AIXBT Intelligence
    'aixbt-momentum': 'node-intelligence',
    'aixbt-signals': 'node-intelligence',
    'aixbt-indigo': 'node-intelligence',
    'aixbt-observer': 'node-intelligence',
    // Legacy
    'maxxit': 'node-agents',
    // Superposition L3
    'superposition-network': 'accent-cyan',
    'superposition-bridge': 'accent-cyan',
    'superposition-longtail': 'accent-cyan',
    'superposition-super-assets': 'accent-cyan',
    'superposition-thirdweb': 'accent-cyan',
    'superposition-utility-mining': 'accent-cyan',
    'superposition-faucet': 'accent-cyan',
    'superposition-meow-domains': 'accent-cyan',
    // ERC-20/ERC-721/ERC-1155 Stylus nodes
    'erc20-stylus': 'node-contracts',
    'erc721-stylus': 'node-contracts',
    'erc1155-stylus': 'node-contracts',
    // Dune Analytics
    'dune-execute-sql': 'accent-purple',
    'dune-token-price': 'accent-purple',
    'dune-wallet-balances': 'accent-purple',
    'dune-dex-volume': 'accent-purple',
    'dune-nft-floor': 'accent-purple',
    'dune-address-labels': 'accent-purple',
    'dune-transaction-history': 'accent-purple',
    'dune-gas-price': 'accent-purple',
    'dune-protocol-tvl': 'accent-purple',
    // Telegram nodes
  };
  return colors[type] || 'node-contracts';
}

