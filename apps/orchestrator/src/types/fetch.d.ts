/**
 * Type declarations for Fetch API in Node.js 18+
 * This ensures TypeScript recognizes fetch, Response, Request, etc.
 */

declare global {
  // Fetch API types are available in Node.js 18+
  // These declarations ensure TypeScript recognizes them
  interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    json(): Promise<any>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
  }

  interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    signal?: AbortSignal | null;
  }

  interface HeadersInit {
    [key: string]: string;
  }

  type BodyInit = string | Blob | ArrayBuffer | FormData | ReadableStream<Uint8Array>;

  function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export {};

