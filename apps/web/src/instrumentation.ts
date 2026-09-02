/**
 * Runs once when a Next.js server instance starts, before it serves any
 * request — the documented hook for this
 * (node_modules/next/dist/docs/01-app/02-guides/instrumentation.md).
 * Node.js only: `msw/node` patches Node's http/https/fetch, which the edge
 * runtime does not have (see the same doc's "Importing runtime-specific
 * code" section for the `NEXT_RUNTIME` guard pattern used below).
 *
 * This wires the MSW mock handlers (packages/api/src/mocks/handlers.ts)
 * into every server-side fetch a Server Component makes — the browser side
 * is unaffected and still goes through next.config.ts's `/api/**` rewrite.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const originalFetch = globalThis.fetch;

  const { server } = await import('@ogonggo/api/src/mocks/server');
  server.listen({ onUnhandledRequest: 'bypass' });

  keepMswFetchAcrossRecompiles(originalFetch, globalThis.fetch);
}

/**
 * Keeps MSW's `fetch` patch in place across a Turbopack server recompile.
 *
 * The dev server copies `globalThis.fetch` into its own `originalFetch` while
 * it boots (next/dist/server/lib/router-server.js:136), which is before
 * `register()` runs — so that copy predates MSW. Every recompile that writes
 * server chunks then calls `resetFetch()` (same file, line 147, reached from
 * `clearRequireCache` in next/dist/server/dev/hot-reloader-turbopack.js:550),
 * which puts that pre-MSW copy back on `globalThis` and clears
 * `Symbol.for('next-patch')` so the next request re-wraps it for the fetch
 * cache. MSW is out of the chain from then on, and `register()` is not called
 * again. Verified by logging every assignment to `globalThis.fetch` across a
 * recompile: `resetFetch` swapped Next's wrapper back to the pre-MSW function,
 * then `patchFetch` wrapped that, with MSW's `fetchProxy` gone from the chain —
 * after which a Server Component reached the real backend on 8080 and the page
 * 404'd.
 *
 * Calling `server.listen()` again cannot repair it: the interceptor registers
 * itself on `globalThis` under `Symbol.for('fetch-interceptor')`, and a second
 * `apply()` finds that entry and skips re-patching (`Interceptor#apply` in
 * @mswjs/interceptors/lib/node/fetchUtils-*.mjs).
 *
 * So intercept the assignment instead: when something puts the exact pre-MSW
 * function back, store MSW's proxy in its place. Every other value — Next's own
 * `patchFetch` wrapper, which has to stay outermost — is stored untouched.
 */
function keepMswFetchAcrossRecompiles(originalFetch: typeof fetch, mswFetch: typeof fetch) {
  if (mswFetch === originalFetch) {
    return;
  }

  let current = mswFetch;
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    enumerable: true,
    get: () => current,
    set: (next: typeof fetch) => {
      current = next === originalFetch ? mswFetch : next;
    },
  });
}
