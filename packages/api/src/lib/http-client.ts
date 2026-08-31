/**
 * Orval's fetch mutator target (see orval.config.ts): generated hooks build the
 * full URL themselves (query params baked in via URLSearchParams) and call this
 * with (url, init), so it takes the same two args a plain `fetch` call would.
 *
 * No base URL here — each app's dev server proxies /api/** to its own backend
 * (apps/web: next.config.ts rewrites, apps/admin: vite.config.ts server.proxy),
 * so this package stays free of bundler-specific env var access (Next reads
 * process.env, Vite reads import.meta.env — this file can't assume either).
 */
export async function httpClient<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url} failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
