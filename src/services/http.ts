/**
 * Shared plumbing for the service layer (§24, §25).
 *
 * Services are the only place that talks to a data source. Today the source is
 * a bundled fixture set; swapping in Supabase or a route handler means editing
 * one service, never a component.
 */

export type DataSource = 'mock' | 'supabase';

export function dataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' ? 'supabase' : 'mock';
}

/** A stable error shape, so every caller can render one honest message. */
export class ServiceError extends Error {
  readonly retryable: boolean;

  constructor(message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ServiceError';
    this.retryable = options?.retryable ?? true;
  }
}

/**
 * Simulates network latency for the mock source, so loading states are real
 * during development instead of appearing only in production.
 */
export function delay<T>(value: T, ms = 220): Promise<T> {
  if (process.env.NODE_ENV === 'test') return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Deep-clones a fixture so callers can never mutate shared mock state. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

export async function postJson<TResponse, TBody = unknown>(
  url: string,
  body: TBody,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    throw new ServiceError('Request failed with status ' + response.status, {
      retryable: response.status >= 500 || response.status === 429,
    });
  }
  return (await response.json()) as TResponse;
}
