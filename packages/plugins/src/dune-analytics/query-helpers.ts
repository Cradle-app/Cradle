export type DuneAnalyticsNodeType =
  | 'dune-execute-sql'
  | 'dune-token-price'
  | 'dune-wallet-balances'
  | 'dune-dex-volume'
  | 'dune-nft-floor'
  | 'dune-address-labels'
  | 'dune-transaction-history'
  | 'dune-gas-price'
  | 'dune-protocol-tvl';

export type DunePerformance = 'medium' | 'large';

export type DuneQueryBuildResult = {
  sql: string;
  performance?: DunePerformance;
};

function sqlLiteral(value: string): string {
  // Basic escaping for string literals in SQL (Dune uses Trino under the hood).
  return value.replace(/'/g, "''");
}

function normalizeAddress(addr: string): string {
  return addr.trim();
}

function normalizeChain(chain: string): string {
  return chain.trim();
}

function toVarbinaryLiteral(address: string): string {
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    // Let upstream validation handle bad formats; this is a safety net.
    return `0x${trimmed.replace(/^0x/i, '')}`;
  }
  return `0x${trimmed.slice(2).toLowerCase()}`;
}

export function buildDuneSql(
  type: DuneAnalyticsNodeType,
  config: Record<string, unknown>
): DuneQueryBuildResult {
  switch (type) {
    case 'dune-execute-sql': {
      const sql = String(config.sql ?? '').trim();
      const performance = (config.performanceMode as DunePerformance | undefined) ?? 'medium';
      return { sql, performance };
    }

    case 'dune-token-price': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'arbitrum'));
      const contractAddress = normalizeAddress(String(config.contractAddress ?? ''));
      const contractLiteral = toVarbinaryLiteral(contractAddress);
      const sql = `
        SELECT
          blockchain,
          contract_address,
          symbol,
          price,
          decimals,
          timestamp
        FROM prices.latest
        WHERE blockchain = '${sqlLiteral(blockchain)}'
          AND contract_address = ${contractLiteral}
      `;
      return { sql };
    }

    case 'dune-wallet-balances': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'arbitrum'));
      const address = normalizeAddress(String(config.address ?? ''));
      const addressLiteral = toVarbinaryLiteral(address);
      const minBalanceUsd = Number(config.minBalanceUsd ?? 1);
      const sql = `
        SELECT
          t.contract_address,
          m.symbol,
          SUM(
            CASE
              WHEN t."to" = ${addressLiteral} THEN t.amount
              WHEN t."from" = ${addressLiteral} THEN -t.amount
              ELSE 0
            END
          ) / POWER(10, COALESCE(m.decimals, 18)) AS balance,
          (
            SUM(
              CASE
                WHEN t."to" = ${addressLiteral} THEN t.amount
                WHEN t."from" = ${addressLiteral} THEN -t.amount
                ELSE 0
              END
            ) / POWER(10, COALESCE(m.decimals, 18))
          ) * COALESCE(p.price, 0) AS value_usd
        FROM tokens.transfers t
        LEFT JOIN tokens.erc20 m
          ON t.contract_address = m.contract_address
         AND t.blockchain = m.blockchain
        LEFT JOIN prices.latest p
          ON t.contract_address = p.contract_address
         AND t.blockchain = p.blockchain
        WHERE t.blockchain = '${sqlLiteral(blockchain)}'
          AND (t."to" = ${addressLiteral} OR t."from" = ${addressLiteral})
        GROUP BY t.contract_address, m.symbol, m.decimals, p.price
        HAVING (
          (
            SUM(
              CASE
                WHEN t."to" = ${addressLiteral} THEN t.amount
                WHEN t."from" = ${addressLiteral} THEN -t.amount
                ELSE 0
              END
            ) / POWER(10, COALESCE(m.decimals, 18))
          ) * COALESCE(p.price, 0)
        ) >= ${Number.isFinite(minBalanceUsd) ? minBalanceUsd : 1}
        ORDER BY value_usd DESC
      `;
      return { sql };
    }

    case 'dune-dex-volume': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'arbitrum'));
      const timeRange = String(config.timeRange ?? '24h');
      const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
      const protocol = String(config.protocol ?? '').trim();
      const protocolFilter = protocol ? `AND project = '${sqlLiteral(protocol)}'` : '';
      const sql = `
        SELECT
          DATE(block_time) as date,
          SUM(amount_usd) as volume_usd,
          COUNT(*) as trade_count
        FROM dex.trades
        WHERE blockchain = '${sqlLiteral(blockchain)}'
          AND block_time >= NOW() - INTERVAL '${days}' DAY
          ${protocolFilter}
        GROUP BY DATE(block_time)
        ORDER BY date
      `;
      return { sql };
    }

    case 'dune-nft-floor': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'ethereum'));
      const collectionAddress = normalizeAddress(String(config.collectionAddress ?? ''));
      const collectionLiteral = toVarbinaryLiteral(collectionAddress);
      const sql = `
        SELECT
          nft_contract_address as collection_address,
          MIN(amount_raw / 1e18) as floor_price_eth,
          MIN(amount_usd) as floor_price_usd,
          SUM(CASE WHEN block_time >= NOW() - INTERVAL '24' HOUR THEN amount_usd ELSE 0 END) as volume_24h,
          COUNT(CASE WHEN block_time >= NOW() - INTERVAL '24' HOUR THEN 1 END) as sales_count_24h,
          MAX(block_time) as timestamp
        FROM nft.trades
        WHERE nft_contract_address = ${collectionLiteral}
          AND blockchain = '${sqlLiteral(blockchain)}'
          AND block_time >= NOW() - INTERVAL '7' DAY
        GROUP BY nft_contract_address
      `;
      return { sql };
    }

    case 'dune-address-labels': {
      const address = normalizeAddress(String(config.address ?? ''));
      const addressLiteral = toVarbinaryLiteral(address);
      const sql = `
        SELECT
          a.address,
          e.name as ens_name,
          ARRAY_AGG(DISTINCT a.name) as labels,
          MAX(a.category) as category,
          MAX(o.custody_owner) as owner
        FROM labels.addresses a
        LEFT JOIN labels.ens e ON a.address = e.address
        LEFT JOIN labels.owner_addresses o ON a.address = o.address
        WHERE a.address = ${addressLiteral}
        GROUP BY a.address, e.name
      `;
      return { sql };
    }

    case 'dune-transaction-history': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'arbitrum'));
      const address = normalizeAddress(String(config.address ?? ''));
      const addressLiteral = toVarbinaryLiteral(address);
      const limit = Number(config.limit ?? 100);
      const sql = `
        SELECT
          hash,
          block_number,
          block_time as timestamp,
          "from" as sender,
          "to" as receiver,
          CAST(value AS DOUBLE) / 1e18 as value,
          gas_used,
          CASE
            WHEN "from" = ${addressLiteral} AND "to" = ${addressLiteral} THEN 'self'
            WHEN "from" = ${addressLiteral} THEN 'sent'
            ELSE 'received'
          END as direction
        FROM ${sqlLiteral(blockchain)}.transactions
        WHERE ("from" = ${addressLiteral} OR "to" = ${addressLiteral})
          AND success = true
        ORDER BY block_time DESC
        LIMIT ${Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 100}
      `;
      return { sql };
    }

    case 'dune-gas-price': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'arbitrum'));
      const sql = `
        SELECT
          '${sqlLiteral(blockchain)}' as blockchain,
          AVG(gas_price / 1e9) as avg_gas_price_24h,
          APPROX_PERCENTILE(gas_price / 1e9, 0.5) as median_gas_price_24h,
          MIN(gas_price / 1e9) as min_gas_price_24h,
          MAX(gas_price / 1e9) as max_gas_price_24h,
          NOW() as timestamp
        FROM ${sqlLiteral(blockchain)}.transactions
        WHERE block_time >= NOW() - INTERVAL '24' HOUR
      `;
      return { sql };
    }

    case 'dune-protocol-tvl': {
      const blockchain = normalizeChain(String(config.blockchain ?? 'arbitrum'));
      const protocol = String(config.protocol ?? '').trim();
      const sql = `
        SELECT
          '${sqlLiteral(protocol)}' as protocol,
          '${sqlLiteral(blockchain)}' as blockchain,
          SUM(CAST(value AS DOUBLE) / 1e18 * COALESCE(p.price, 0)) as tvl_usd,
          0 as change_24h_percent,
          NOW() as timestamp
        FROM ${sqlLiteral(blockchain)}.transactions t
        LEFT JOIN prices.latest p ON p.blockchain = '${sqlLiteral(blockchain)}' AND p.symbol = 'ETH'
        WHERE "to" IN (
          SELECT address FROM ${sqlLiteral(blockchain)}.contracts WHERE namespace = '${sqlLiteral(protocol)}'
        )
        AND block_time >= NOW() - INTERVAL '7' DAY
      `;
      return { sql };
    }

    default: {
      return { sql: '' };
    }
  }
}

