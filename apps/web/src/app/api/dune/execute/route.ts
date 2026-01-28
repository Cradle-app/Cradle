import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildDuneSql, type DuneAnalyticsNodeType } from '@/lib/dune/queries';
import { executeSqlAndWait, type DunePerformance } from '@/lib/dune/server';

export const runtime = 'nodejs';

const DuneTypeSchema = z.enum([
  'dune-execute-sql',
  'dune-token-price',
  'dune-wallet-balances',
  'dune-dex-volume',
  'dune-nft-floor',
  'dune-address-labels',
  'dune-transaction-history',
  'dune-gas-price',
  'dune-protocol-tvl',
]);

const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a 0x-prefixed 40-hex address');

const RequestSchema = z.object({
  type: DuneTypeSchema,
  config: z.record(z.unknown()).default({}),
});

function validateRequiredInputs(type: DuneAnalyticsNodeType, config: Record<string, unknown>) {
  if (type === 'dune-execute-sql') {
    const sql = String(config.sql ?? '').trim();
    if (!sql) throw new Error('SQL is required');
    return;
  }

  if (type === 'dune-token-price') {
    AddressSchema.parse(String(config.contractAddress ?? ''));
    return;
  }

  if (type === 'dune-wallet-balances') {
    AddressSchema.parse(String(config.address ?? ''));
    return;
  }

  if (type === 'dune-nft-floor') {
    AddressSchema.parse(String(config.collectionAddress ?? ''));
    return;
  }

  if (type === 'dune-address-labels') {
    AddressSchema.parse(String(config.address ?? ''));
    return;
  }

  if (type === 'dune-transaction-history') {
    AddressSchema.parse(String(config.address ?? ''));
    return;
  }

  if (type === 'dune-protocol-tvl') {
    const protocol = String(config.protocol ?? '').trim();
    if (!protocol) throw new Error('Protocol is required');
    return;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, config } = RequestSchema.parse(body);

    validateRequiredInputs(type, config);

    const { sql, performance } = buildDuneSql(type, config);
    const timeoutMs =
      type === 'dune-execute-sql'
        ? Number(config.timeout ?? 60000)
        : 60000;

    const result = await executeSqlAndWait(sql, {
      performance: (performance as DunePerformance | undefined) ?? 'medium',
      timeoutMs: Number.isFinite(timeoutMs) ? Math.min(Math.max(timeoutMs, 10_000), 300_000) : 60_000,
      pollIntervalMs: 1000,
    });

    return NextResponse.json({
      type,
      sql,
      executionId: result.execution.execution_id,
      state: result.status.state,
      metadata: result.results.result.metadata,
      rows: result.results.result.rows,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: err.issues,
        },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

