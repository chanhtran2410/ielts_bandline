/**
 * Shared helpers for the content scripts.
 *
 * These deliberately duplicate the rules in src/lib rather than importing them:
 * the scripts run under plain tsx outside the Next build, and a validator that
 * silently drifts from the app's own grading would be worse than a copy that is
 * pinned by tests. `content-lib.test.ts` asserts the two stay in agreement.
 */

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’‑-]?[\p{L}\p{N}]+)*/gu;

export function countWords(text: string): number {
  if (!text) return 0;
  return text.match(WORD_PATTERN)?.length ?? 0;
}

/** Same normalisation the app grades with, so validation matches marking. */
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^(?:a|an|the)\s+/u, '')
    .replace(/[.,;:!?]+$/u, '');
}

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

/**
 * Reads Supabase credentials from the environment. The service key bypasses
 * RLS, so it is required for seeding and must never be committed or shipped to
 * the browser.
 */
export function requireSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    console.error(
      'Set SUPABASE_URL and SUPABASE_SERVICE_KEY before seeding.\n' +
        'The service key is a secret: pass it on the command line or via a\n' +
        'gitignored .env.local, never in a committed file.',
    );
    process.exit(1);
  }
  return { url: url.replace(/\/$/, ''), serviceKey };
}

/** Minimal PostgREST client — avoids pulling the SDK into a build script. */
export async function pgRest<T>(
  config: SupabaseConfig,
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const response = await fetch(config.url + '/rest/v1/' + path, {
    method: init.method ?? 'GET',
    headers: {
      apikey: config.serviceKey,
      Authorization: 'Bearer ' + config.serviceKey,
      'content-type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} → ${response.status}: ${text.slice(0, 400)}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}
