# @cradle/onchain-activity

Onchain Activity component for fetching wallet transactions from Arbitrum, with category filtering.

## Features

- Fetch ERC-20 token transfers
- Fetch ERC-721 (NFT) transfers
- Fetch ERC-1155 multi-token transfers
- Fetch contract interactions (external calls)
- Configurable transaction limit (5, 10, 15, or 20)
- Support for Arbitrum mainnet and Sepolia testnet

## Installation

```bash
pnpm add @cradle/onchain-activity
```

## Usage

### React Hook

```tsx
import { useOnchainActivity } from '@cradle/onchain-activity';

function WalletActivity() {
  const { data, loading, error, fetchActivity } = useOnchainActivity({
    network: 'arbitrum',
    limit: '10',
    categories: ['erc20', 'erc721'],
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY!,
  });

  const handleSubmit = (address: string) => {
    fetchActivity(address);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.transfers.map((tx) => (
        <li key={tx.hash}>
          {tx.category}: {tx.value} {tx.asset}
        </li>
      ))}
    </ul>
  );
}
```

### Direct API Call

```ts
import { getOnchainActivity } from '@cradle/onchain-activity';

const activity = await getOnchainActivity({
  address: '0x...',
  network: 'arbitrum',
  limit: '10',
  categories: ['erc20', 'erc721', 'erc1155', 'external'],
  apiKey: process.env.ALCHEMY_API_KEY!,
});

console.log(activity.transfers);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `network` | `'arbitrum' \| 'arbitrum-sepolia'` | `'arbitrum'` | Network to fetch from |
| `limit` | `'5' \| '10' \| '15' \| '20'` | `'10'` | Number of transactions |
| `categories` | `TransactionCategory[]` | `['erc20']` | Categories to fetch |
| `apiKey` | `string` | required | Alchemy API key |

## Transaction Categories

| Category | Description |
|----------|-------------|
| `erc20` | ERC-20 token transfers |
| `erc721` | NFT (ERC-721) transfers |
| `erc1155` | Multi-token (ERC-1155) transfers |
| `external` | Contract interactions / native ETH |

## Environment Variables

```env
ALCHEMY_API_KEY=your_alchemy_api_key
```

## License

MIT
