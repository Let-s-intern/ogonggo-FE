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

  const { server } = await import('@ogonggo/api/src/mocks/server');
  server.listen({ onUnhandledRequest: 'bypass' });
}
