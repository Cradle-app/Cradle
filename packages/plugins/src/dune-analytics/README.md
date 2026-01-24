# Dune Analytics Plugins for Cradle

This package provides a comprehensive set of plugins for integrating [Dune Analytics](https://dune.com/) blockchain data queries into your Cradle applications.

## Overview

The Dune Analytics plugins allow you to:
- Execute custom SQL queries on Dune's blockchain data warehouse
- Fetch real-time token prices across multiple blockchains
- Get wallet token balances with USD valuations
- Track DEX trading volumes and statistics
- Monitor NFT collection floor prices
- Resolve human-readable address labels (ENS, known wallets)
- View transaction history for wallets
- Analyze gas prices across networks
- Calculate protocol TVL (Total Value Locked)

## Prerequisites

### Dune API Key

You must obtain a Dune API key to use these plugins. Get your API key from [Dune Analytics](https://dune.com/settings/api).

### Environment Variables

Add the following environment variable to your project:

```env
# .env.local or .env
DUNE_API_KEY=your_dune_api_key_here

# For client-side usage (Next.js)
NEXT_PUBLIC_DUNE_API_KEY=your_dune_api_key_here
```

**⚠️ Security Note:** Never expose your API key in client-side code for production applications. Use server-side API routes or serverless functions to proxy requests.

## Available Plugins

### 1. Execute SQL (`dune-execute-sql`)

Execute custom SQL queries on Dune's blockchain data warehouse.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `performanceMode` | `'medium' \| 'large'` | `'medium'` | Query execution mode. Large provides more resources. |
| `timeout` | `number` | `60000` | Maximum time (ms) to wait for query completion |
| `generateHooks` | `boolean` | `true` | Generate React hooks for query execution |

**Generated Code:**
- `src/lib/dune/dune-client.ts` - Dune API client
- `src/hooks/useDuneQuery.ts` - React hooks for queries

**Usage Example:**
```tsx
import { useDuneLazyQuery } from '@/hooks/useDuneQuery';

function MyComponent() {
  const { data, isLoading, error, execute } = useDuneLazyQuery();
  
  const runQuery = async () => {
    await execute({
      sql: "SELECT * FROM dex.trades WHERE blockchain = 'arbitrum' LIMIT 10",
      performance: "medium"
    });
  };
  
  return (
    <button onClick={runQuery} disabled={isLoading}>
      Run Query
    </button>
  );
}
```

---

### 2. Token Price (`dune-token-price`)

Fetch latest token prices from Dune's `prices.latest` table.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'arbitrum'` | Target blockchain |
| `cacheEnabled` | `boolean` | `true` | Enable response caching |
| `cacheDuration` | `number` | `60000` | Cache TTL in milliseconds |
| `generateUI` | `boolean` | `true` | Generate UI components |

**Generated Code:**
- `src/hooks/useTokenPrice.ts` - Price fetching hooks
- `src/components/dune/TokenPriceCard.tsx` - Price display component

**Usage Example:**
```tsx
import { useTokenPrice } from '@/hooks/useTokenPrice';
import TokenPriceCard from '@/components/dune/TokenPriceCard';

function PriceDisplay() {
  const { data: price, isLoading } = useTokenPrice({
    blockchain: 'arbitrum',
    contractAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' // WETH
  });
  
  return <TokenPriceCard blockchain="arbitrum" contractAddress="0x..." />;
}
```

---

### 3. Wallet Balances (`dune-wallet-balances`)

Fetch wallet token balances with USD valuations.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'arbitrum'` | Target blockchain |
| `minBalanceUsd` | `number` | `1` | Minimum balance in USD to include |
| `includeNFTs` | `boolean` | `false` | Include NFT holdings |
| `generateUI` | `boolean` | `true` | Generate UI components |

**Generated Code:**
- `src/hooks/useWalletBalances.ts` - Balance fetching hooks
- `src/components/dune/WalletBalances.tsx` - Portfolio display component

**Usage Example:**
```tsx
import { usePortfolioValue } from '@/hooks/useWalletBalances';
import WalletBalances from '@/components/dune/WalletBalances';

function Portfolio() {
  const { balances, totalValue, isLoading } = usePortfolioValue({
    address: '0x...',
    blockchain: 'arbitrum',
    minBalanceUsd: 1
  });
  
  return (
    <div>
      <h2>Total Value: ${totalValue.toFixed(2)}</h2>
      <WalletBalances address="0x..." blockchain="arbitrum" />
    </div>
  );
}
```

---

### 4. DEX Volume (`dune-dex-volume`)

Fetch DEX trading volume and statistics from `dex.trades`.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'arbitrum'` | Target blockchain |
| `timeRange` | `'24h' \| '7d' \| '30d'` | `'24h'` | Time range for data |
| `protocol` | `string` | - | Optional protocol filter (e.g., 'uniswap-v3') |
| `generateUI` | `boolean` | `true` | Generate UI components |

**Generated Code:**
- `src/hooks/useDEXVolume.ts` - Volume analytics hooks
- `src/components/dune/DEXVolumeChart.tsx` - Volume chart component

---

### 5. NFT Floor Price (`dune-nft-floor`)

Fetch NFT collection floor prices and statistics from `nft.trades`.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'ethereum'` | Target blockchain |
| `generateUI` | `boolean` | `true` | Generate UI components |
| `cacheDuration` | `number` | `300000` | Cache TTL (5 minutes) |

**Generated Code:**
- `src/hooks/useNFTFloor.ts` - NFT floor price hooks
- `src/components/dune/NFTFloorCard.tsx` - Floor price display component

---

### 6. Address Labels (`dune-address-labels`)

Fetch human-readable labels for blockchain addresses (ENS, known wallets, protocols).

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeENS` | `boolean` | `true` | Include ENS name resolution |
| `includeOwnerInfo` | `boolean` | `true` | Include owner/protocol info |
| `cacheDuration` | `number` | `86400000` | Cache TTL (24 hours) |

**Generated Code:**
- `src/hooks/useAddressLabels.ts` - Label resolution hooks
- `src/components/dune/AddressLabel.tsx` - Address display component

**Usage Example:**
```tsx
import { useAddressDisplay } from '@/hooks/useAddressLabels';
import AddressLabel from '@/components/dune/AddressLabel';

function TransactionRow({ address }: { address: string }) {
  const { displayName } = useAddressDisplay(address);
  
  return (
    <span>
      From: <AddressLabel address={address} />
    </span>
  );
}
```

---

### 7. Transaction History (`dune-transaction-history`)

Fetch transaction history for wallets.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'arbitrum'` | Target blockchain |
| `limit` | `number` | `100` | Maximum transactions to fetch |
| `generateUI` | `boolean` | `true` | Generate UI components |

**Generated Code:**
- `src/hooks/useTransactionHistory.ts` - Transaction fetching hooks
- `src/components/dune/TransactionHistory.tsx` - Transaction list component

---

### 8. Gas Price Analytics (`dune-gas-price`)

Fetch gas price analytics and statistics.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'arbitrum'` | Target blockchain |
| `generateUI` | `boolean` | `true` | Generate UI components |
| `cacheDuration` | `number` | `60000` | Cache TTL (1 minute) |

**Generated Code:**
- `src/hooks/useGasPrice.ts` - Gas price hooks
- `src/components/dune/GasPriceCard.tsx` - Gas tracker component

---

### 9. Protocol TVL (`dune-protocol-tvl`)

Fetch Total Value Locked for DeFi protocols.

**Configuration:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blockchain` | `string` | `'arbitrum'` | Target blockchain |
| `generateUI` | `boolean` | `true` | Generate UI components |
| `cacheDuration` | `number` | `600000` | Cache TTL (10 minutes) |

**Generated Code:**
- `src/hooks/useProtocolTVL.ts` - TVL fetching hooks
- `src/components/dune/ProtocolTVLCard.tsx` - TVL display component

---

## Dune API Reference

### Base URL
```
https://api.dune.com/api/v1
```

### Authentication
All requests require the `X-DUNE-API-KEY` header.

### Key Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sql/execute` | POST | Execute a SQL query |
| `/execution/{id}/status` | GET | Check query execution status |
| `/execution/{id}/results` | GET | Fetch query results |

### Key Data Tables

| Table | Description |
|-------|-------------|
| `prices.latest` | Current token prices |
| `dex.trades` | DEX trading data |
| `nft.trades` | NFT marketplace data |
| `labels.addresses` | Address labels |
| `labels.ens` | ENS name mappings |
| `balances.erc20` | ERC-20 token balances |
| `{blockchain}.transactions` | Raw transaction data |

---

## Asynchronous Query Execution

Dune queries are executed asynchronously. The generated client handles this automatically:

1. Submit query via `POST /sql/execute`
2. Receive `execution_id`
3. Poll `GET /execution/{id}/status` until completion
4. Fetch results via `GET /execution/{id}/results`

The `executeAndWait` method in the generated client handles this entire flow with configurable timeout and polling interval.

---

## Caching

All plugins support built-in caching to minimize API calls:

- Token prices: 1-minute cache
- Wallet balances: 1-minute cache
- Address labels: 24-hour cache (labels rarely change)
- Gas prices: 1-minute cache
- DEX volume: 5-minute cache
- NFT floor: 5-minute cache
- Protocol TVL: 10-minute cache

---

## Error Handling

The generated hooks provide standard React Query error states:

```tsx
const { data, isLoading, error } = useTokenPrice({...});

if (error) {
  console.error('Failed to fetch price:', error.message);
}
```

---

## Best Practices

1. **Use Server-Side Proxying**: For production, create API routes to proxy Dune requests and keep your API key secure.

2. **Implement Rate Limiting**: Dune has rate limits. Use the caching features to minimize requests.

3. **Optimize Queries**: Write efficient SQL queries. Avoid `SELECT *` and use appropriate `LIMIT` clauses.

4. **Handle Loading States**: Always show loading indicators while queries execute.

5. **Use Large Performance Mode Sparingly**: Only use `large` performance mode for complex queries.

---

## Supported Blockchains

- Ethereum (`ethereum`)
- Arbitrum (`arbitrum`)
- Optimism (`optimism`)
- Polygon (`polygon`)
- Base (`base`)

---

## Troubleshooting

### "Query execution timeout"
- Increase the `timeout` configuration
- Simplify your SQL query
- Use `large` performance mode for complex queries

### "Missing DUNE_API_KEY"
- Ensure the environment variable is set
- For Next.js client-side, use `NEXT_PUBLIC_DUNE_API_KEY`

### "Rate limit exceeded"
- Enable caching
- Reduce polling frequency
- Consider upgrading your Dune plan

---

## License

MIT License - See [LICENSE](LICENSE) for details.
