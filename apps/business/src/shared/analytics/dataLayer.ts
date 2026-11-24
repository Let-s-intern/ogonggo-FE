import { isSignedIn } from '@/shared/api/authTokens';
import { pageTypeOf } from './pageType';

/**
 * GTM 으로 보내는 이벤트. 기준은 `apps/web/src/shared/analytics/dataLayer.ts` 의 `track`·`syncPageContext` 이고
 * 웹과 같은 컨테이너에 같은 모양으로 보낸다. 웹과 달리 PostHog 에는 보내지 않는다(2026-11-24 사용자 결정).
 *
 * **`NEXT_PUBLIC_GTM_ID` 가 없으면 아무것도 하지 않는다.** 컨테이너가 없는데 `window.dataLayer` 에 쌓기만 하면
 * 배열이 계속 커진다. 프리뷰·로컬에서 이벤트가 어디로도 나가지 않게 한다(`GoogleTagManager.tsx`).
 *
 * **이벤트마다 키를 빠짐없이 보낸다.** dataLayer 는 앞선 push 의 값을 기억해서, 키를 빼면 직전 이벤트의 값이
 * 다음 이벤트에 그대로 붙는다. 값이 없으면 문자열은 `''` 다.
 */
export type DataLayerParams = Record<string, string | number | null>;

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

const ENABLED = Boolean(process.env.NEXT_PUBLIC_GTM_ID);

export function track(event: string, params: DataLayerParams = {}): void {
  if (!ENABLED || typeof window === 'undefined') {
    return;
  }
  syncPageContext();
  push({ event, ...params });
}

let lastPageContext = '';

/**
 * 지금 화면의 `page_context` 를 보낸다. 앞서 보낸 것과 같으면 보내지 않는다.
 *
 * GTM 은 모든 이벤트에 직전 `page_context` 의 `page_type`·`login_state` 를 붙인다. 그래서 다른 이벤트보다 먼저
 * 나가야 하는데, 화면 이동을 지켜보는 `PageContextTracker` 의 effect 는 자식 화면의 effect 보다 늦게 돈다.
 * `track` 이 보내기 직전에 이것을 부르는 이유다. 먼저 불린 쪽이 보내고 나중 쪽은 건너뛴다.
 */
export function syncPageContext(): void {
  if (!ENABLED || typeof window === 'undefined') {
    return;
  }
  const pageType = pageTypeOf(window.location.pathname);
  const loginState = isSignedIn() ? 'Y' : 'N';
  const key = `${window.location.pathname}|${loginState}`;
  if (key === lastPageContext) {
    return;
  }
  lastPageContext = key;
  push({ event: 'page_context', page_type: pageType, login_state: loginState });
}

function push(entry: Record<string, unknown>): void {
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(entry);
}
