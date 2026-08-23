import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase access.
 *
 * Nothing in the app imports this directly — services do. That keeps the
 * mock-to-real swap (§25) a change inside one service rather than a change
 * across the UI.
 */

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function requireConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, ' +
        'or leave NEXT_PUBLIC_DATA_SOURCE=mock.',
    );
  }
  return { url, anonKey };
}

let browserClient: SupabaseClient | null = null;

/** One browser client per tab; repeated calls reuse it. */
export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  const { url, anonKey } = requireConfig();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export interface CookieStore {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

/**
 * Server client for route handlers and server components. The caller passes the
 * cookie store, because `next/headers` is only available in a request scope.
 */
export function supabaseServer(cookies: CookieStore): SupabaseClient {
  const { url, anonKey } = requireConfig();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (entries: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        for (const { name, value, options } of entries) {
          try {
            cookies.set(name, value, options);
          } catch {
            // Server components cannot set cookies; middleware refreshes them.
          }
        }
      },
    },
  });
}
