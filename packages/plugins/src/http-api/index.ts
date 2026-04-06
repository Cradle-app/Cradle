import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { HttpApiConfig } from '@dapp-forge/blueprint-schema';

export class HttpApiPlugin extends BasePlugin<z.infer<typeof HttpApiConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'http-api',
    name: 'HTTP API',
    version: '0.1.0',
    description: 'Make external HTTP requests (GET, POST, PUT, DELETE)',
    category: 'app',
    tags: ['http', 'api', 'rest', 'fetch', 'request', 'web2'],
  };

  readonly configSchema = HttpApiConfig as unknown as z.ZodType<z.infer<typeof HttpApiConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'request-in', name: 'Request Input', type: 'input', dataType: 'config' },
    { id: 'response-out', name: 'Response', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof HttpApiConfig>> {
    return {
      method: 'GET',
      url: 'https://api.example.com/data',
      headers: [],
      bodyType: 'none',
      body: '',
      timeout: 30000,
      retries: 3,
      authType: 'none',
      responseMapping: '',
      generateProxy: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();
    const shortId = node.id.slice(0, 8);
    const proxyPath = `proxy-${shortId}`;
    const envPrefix = `HTTP_API_${shortId.toUpperCase()}`;

    this.addFile(output, 'http-client.ts', generateHttpClient(config), 'frontend-lib');
    this.addFile(output, 'types.ts', generateTypes(), 'frontend-types');
    this.addFile(output, 'useHttpApi.ts', generateHook(config, proxyPath), 'frontend-hooks');

    if (config.generateProxy) {
      this.addFile(output, `${proxyPath}/route.ts`, generateProxyRoute(config, envPrefix), 'backend-routes');
    }
    if (config.authType === 'bearer') {
      this.addEnvVar(output, `${envPrefix}_BEARER_TOKEN`, 'Bearer token for API authentication', { required: true });
    } else if (config.authType === 'api-key') {
      this.addEnvVar(output, `${envPrefix}_API_KEY`, 'API key for authentication', { required: true });
    } else if (config.authType === 'basic') {
      this.addEnvVar(output, `${envPrefix}_BASIC_USER`, 'Basic auth username', { required: true });
      this.addEnvVar(output, `${envPrefix}_BASIC_PASS`, 'Basic auth password', { required: true });
    }

    this.addDoc(output, `docs/logic/http-api-${shortId}.md`, 'HTTP API Block', generateDocs(config, proxyPath));

    context.logger.info('Generated HTTP API client', { nodeId: node.id, method: config.method });
    return output;
  }
}

function generateTypes(): string {
  return `export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  duration: number;
}

export interface HttpError {
  message: string;
  status?: number;
  response?: unknown;
}
`;
}

function generateHttpClient(config: z.infer<typeof HttpApiConfig>): string {
  return `import type { HttpRequestConfig, HttpResponse } from '../types/types';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function httpRequest<T = unknown>(
  config: HttpRequestConfig,
): Promise<HttpResponse<T>> {
  const { method, url, headers = {}, body, timeout = ${config.timeout}, retries = ${config.retries} } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await sleep(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = Date.now();

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const data = (await res.json().catch(() => null)) as T;
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });

      if (!res.ok && attempt < retries) {
        lastError = new Error(\`HTTP \${res.status}: \${res.statusText}\`);
        continue;
      }

      return { data, status: res.status, statusText: res.statusText, headers: responseHeaders, duration: Date.now() - start };
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= retries) break;
    }
  }

  throw lastError ?? new Error('Request failed');
}
`;
}

function generateHook(config: z.infer<typeof HttpApiConfig>, proxyPath: string): string {
  const defaultUrl = config.generateProxy ? `/api/${proxyPath}` : config.url;
  return `import { useState, useCallback } from 'react';
import { httpRequest } from '../lib/http-client';
import type { HttpResponse } from '../types/types';

export function useHttpApi<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (options?: {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<HttpResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await httpRequest<T>({
        method: options?.method ?? '${config.method}',
        url: options?.url ?? '${defaultUrl}',
        headers: options?.headers,
        body: options?.body,
        timeout: ${config.timeout},
        retries: ${config.retries},
      });
      setData(result.data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}
`;
}

function generateProxyRoute(config: z.infer<typeof HttpApiConfig>, envPrefix: string): string {
  return `import { NextResponse } from 'next/server';

export async function ${config.method === 'GET' ? 'GET' : 'POST'}(request: Request) {
  try {
    const targetUrl = '${config.url}';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    ${config.authType === 'bearer' ? `
    const token = process.env.${envPrefix}_BEARER_TOKEN;
    if (token) headers['Authorization'] = \`Bearer \${token}\`;` : ''}
    ${config.authType === 'api-key' ? `
    const apiKey = process.env.${envPrefix}_API_KEY;
    if (apiKey) headers['X-API-Key'] = apiKey;` : ''}

    ${config.method !== 'GET' ? `const body = await request.json().catch(() => null);` : ''}

    const res = await fetch(targetUrl, {
      method: '${config.method}',
      headers,
      ${config.method !== 'GET' ? 'body: body ? JSON.stringify(body) : undefined,' : ''}
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy request failed' },
      { status: 500 },
    );
  }
}
`;
}

function generateDocs(config: z.infer<typeof HttpApiConfig>, proxyPath: string): string {
  return `# HTTP API Block

Makes external HTTP requests with retry logic and optional proxy.

## Configuration
- **Method**: ${config.method}
- **URL**: ${config.url}
- **Timeout**: ${config.timeout}ms
- **Retries**: ${config.retries}
- **Auth**: ${config.authType}
- **Proxy**: ${config.generateProxy ? `Enabled (server-side at /api/${proxyPath})` : 'Direct client'}

## Usage

\`\`\`typescript
import { useHttpApi } from '@/lib/http-api/hooks/useHttpApi';

function MyComponent() {
  const { data, loading, error, execute } = useHttpApi();

  useEffect(() => { execute(); }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
\`\`\`
`;
}
