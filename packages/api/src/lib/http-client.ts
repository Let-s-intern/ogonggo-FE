/**
 * Orval's fetch mutator target (see orval.config.ts): generated hooks build the
 * full URL themselves (query params baked in via URLSearchParams) and call this
 * with (url, init), so it takes the same two args a plain `fetch` call would.
 *
 * No base URL in the browser — each app's dev server proxies /api/** to its own
 * backend (apps/web: next.config.ts rewrites, apps/admin: vite.config.ts
 * server.proxy), so this stays free of bundler-specific env var access there
 * (Next reads process.env, Vite reads import.meta.env — this file can't assume
 * either from a browser bundle).
 *
 * Outside the browser (`typeof window === 'undefined'` — Next.js Server
 * Components) there is no such proxy: Node's `fetch` requires an absolute URL,
 * unlike the browser's (verified 2026-08-31: `node -e "fetch('/x')"` throws
 * `TypeError: Failed to parse URL from /x` — and Next's own fetch extension in
 * node_modules/next/dist/server/lib/patch-fetch.js hits the same parse before
 * it ever reaches a passed-through fetch, so a global-fetch monkeypatch in
 * apps/web can't fix it after the fact; the URL has to be absolute here, at
 * the call site). `process.env` is safe to read in that branch since it only
 * runs in Node. `OGONGGO_USER_API_ORIGIN` matches next.config.ts's rewrite
 * target so the two agree without a second env var.
 */
export async function httpClient<T>(url: string, init: RequestInit = {}): Promise<T> {
  const isRelative = !/^https?:\/\//.test(url);
  const resolvedUrl =
    typeof window === 'undefined' && isRelative
      ? `${process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080'}${url}`
      : url;
  const response = await fetch(resolvedUrl, {
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
