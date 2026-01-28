const DUNE_API_BASE = 'https://api.dune.com/api/v1';

export type DunePerformance = 'medium' | 'large';

export type DuneExecuteSqlResponse = {
  execution_id: string;
  state: string;
};

export type DuneExecutionStatusResponse = {
  execution_id: string;
  query_id: number;
  is_execution_finished: boolean;
  state: string;
  error?: {
    type?: string;
    message?: string;
    metadata?: unknown;
    line?: number;
    column?: number;
  };
};

export type DuneExecutionResultsResponse<T = Record<string, unknown>> = {
  execution_id: string;
  query_id: number;
  state: string;
  result: {
    rows: T[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
      result_set_bytes: number;
      total_row_count: number;
      total_result_set_bytes?: number;
      datapoint_count?: number;
      execution_time_millis?: number;
      pending_time_millis?: number;
    };
  };
  error?: {
    type?: string;
    message?: string;
    metadata?: unknown;
    line?: number;
    column?: number;
  };
};

function getDuneApiKey(): string {
  const key = process.env.DUNE_API_KEY;
  if (!key) {
    throw new Error('Missing DUNE_API_KEY environment variable');
  }
  return key;
}

async function duneFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = getDuneApiKey();
  const headers = new Headers(init?.headers);
  headers.set('X-Dune-Api-Key', apiKey);

  // Ensure JSON default for POSTs
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${DUNE_API_BASE}${path}`, { ...init, headers });
}

export async function executeSql(sql: string, performance: DunePerformance = 'medium'): Promise<DuneExecuteSqlResponse> {
  const res = await duneFetch('/sql/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, performance }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Dune API error executing SQL (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

export async function getExecutionStatus(executionId: string): Promise<DuneExecutionStatusResponse> {
  const res = await duneFetch(`/execution/${encodeURIComponent(executionId)}/status`, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Dune API error getting status (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

export async function getExecutionResults<T = Record<string, unknown>>(executionId: string): Promise<DuneExecutionResultsResponse<T>> {
  const res = await duneFetch(`/execution/${encodeURIComponent(executionId)}/results`, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Dune API error getting results (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

export async function executeSqlAndWait<T = Record<string, unknown>>(
  sql: string,
  opts?: {
    performance?: DunePerformance;
    pollIntervalMs?: number;
    timeoutMs?: number;
  }
): Promise<{
  execution: DuneExecuteSqlResponse;
  status: DuneExecutionStatusResponse;
  results: DuneExecutionResultsResponse<T>;
}> {
  const performance = opts?.performance ?? 'medium';
  const pollIntervalMs = opts?.pollIntervalMs ?? 1000;
  const timeoutMs = opts?.timeoutMs ?? 60000;

  const execution = await executeSql(sql, performance);
  const start = Date.now();

  // Poll status until terminal
  // Docs: state becomes terminal when is_execution_finished === true
  // https://docs.dune.com/api-reference/executions/endpoint/get-execution-status
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await getExecutionStatus(execution.execution_id);

    if (status.is_execution_finished) {
      if (status.state === 'QUERY_STATE_FAILED' || status.state === 'QUERY_STATE_CANCELED' || status.state === 'QUERY_STATE_EXPIRED') {
        const msg = status.error?.message ?? `Execution finished in state ${status.state}`;
        throw new Error(msg);
      }

      const results = await getExecutionResults<T>(execution.execution_id);
      return { execution, status, results };
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error('Query execution timeout');
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}

