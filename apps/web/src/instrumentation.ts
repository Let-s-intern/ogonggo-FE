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
/**
 * `register()` 가 한 프로세스에서 두 번 이상 불릴 수 있다. 두 번째 `server.listen()` 은
 * `Failed to call "configure()" on the network: cannot configure an already enabled network`
 * 로 던지고, 그러면 Next 가 `Invariant Violation: An error occurred while loading
 * instrumentation hook` 으로 모든 요청을 500 으로 만든다.
 *
 * 아래 `keepMswFetchAcrossRecompiles` 가 `globalThis.fetch` 를 접근자로 바꾸기 때문에 MSW 의
 * 재적용 판정이 달라져 이 경로가 열렸다. 켜 놓았다는 사실을 전역 심볼에 남겨 두 번째 호출을
 * 그냥 돌려보낸다 — 모듈 스코프 변수로는 안 된다. 재컴파일이 모듈을 다시 평가하면 그 변수가
 * 초기화되기 때문이다.
 */
const MSW_STARTED = Symbol.for('ogonggo.msw.started');

/**
 * 목데이터를 쓸지. 기본은 **켜짐**이다 — 지금 배포본이 MSW 기반이라 기본을 뒤집으면 그게
 * 깨진다. 실제 백엔드를 보려면 `OGONGGO_USE_MOCKS=false` 를 준다.
 *
 * `!== 'false'` 가 아니라 `=== 'false'` 로 끄는 것에 뜻이 있다. 오타(`fasle`)나 빈 값이
 * 조용히 목을 꺼 버리면, 데이터가 안 보이는 이유를 한참 찾게 된다. 끄는 쪽이 정확한 철자를
 * 요구하는 편이 안전하다.
 */
function usesMocks(): boolean {
  return process.env.OGONGGO_USE_MOCKS !== 'false';
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (!usesMocks()) {
    // 어느 쪽으로 떴는지 남긴다. 목이 켜진 줄 모르고 "왜 데이터가 안 바뀌지"를 찾는 일이
    // 실제로 있었다 — 켜짐도 꺼짐도 한 줄씩 찍는다.
    console.info(
      `[ogonggo] 목데이터 꺼짐. 실제 백엔드를 봅니다 — ${process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080'}`,
    );
    return;
  }

  const globals = globalThis as typeof globalThis & { [MSW_STARTED]?: boolean };
  if (globals[MSW_STARTED]) {
    return;
  }
  globals[MSW_STARTED] = true;

  const originalFetch = globalThis.fetch;

  const { server } = await import('@ogonggo/api/src/mocks/server');
  server.listen({ onUnhandledRequest: 'bypass' });
  console.info('[ogonggo] 목데이터 켜짐 (MSW). 실제 백엔드를 보려면 OGONGGO_USE_MOCKS=false');

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
