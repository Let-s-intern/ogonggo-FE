import posthog from 'posthog-js';

/**
 * PostHog. 서비스 안에서의 행동(퍼널·재방문·사용자별 흐름)을 맡는다.
 *
 * 분석 도구의 역할은 이렇게 나눈다. 유입(채널·UTM)은 GA(`GoogleTagManager.tsx`), 오류·성능은
 * Datadog RUM(`instrumentation-client.ts`), 세션 리플레이·히트맵은 Clarity(GTM 컨테이너에 걸린 태그),
 * 이벤트 분석은 PostHog 다. 그래서 PostHog 의 녹화와 자동 클릭 수집은 끈다 — 녹화는 Clarity 와
 * 겹치고, 자동 클릭 수집은 이벤트 양만 늘려 무료 한도를 먼저 쓴다. 이벤트는 GTM 과 같은 `track`
 * (`dataLayer.ts`)으로 함께 보낸다.
 *
 * **키는 `NEXT_PUBLIC_POSTHOG_KEY` 에서 온다.** GTM 과 같은 이유로 Vercel 의 Production 환경에만
 * 넣는다. 값이 없으면 초기화하지 않아 아무 요청도 나가지 않고, 아래 함수는 모두 아무것도 하지 않는다.
 *
 * 요청은 같은 오리진의 `/ingest` 로 보낸다(`next.config.ts` 의 rewrite). 광고 차단기가 PostHog 주소를
 * 막아 이벤트가 빠지는 것을 줄인다.
 */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** PostHog 프로젝트를 만든 리전. `eu` 가 아니면 미국 리전이다. `next.config.ts` 의 rewrite 와 같은 값을 본다. */
const UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_REGION === 'eu'
    ? 'https://eu.posthog.com'
    : 'https://us.posthog.com';

let enabled = false;

/** `instrumentation-client.ts` 가 하이드레이션 전에 한 번 부른다. */
export function initPostHog(): void {
  if (!POSTHOG_KEY || enabled) {
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: '/ingest',
    ui_host: UI_HOST,
    // 화면 이동(App Router 의 history 변경)마다 `$pageview` 를 남긴다.
    capture_pageview: 'history_change',
    // 로그인해 식별한 사용자만 사람 프로필을 만든다. 익명 방문은 이벤트만 남는다.
    person_profiles: 'identified_only',
    autocapture: false,
    disable_session_recording: true,
  });
  enabled = true;
}

/** `track`(`dataLayer.ts`)이 GTM 으로 보내는 이벤트를 같은 이름·값으로 보낸다. */
export function captureEvent(event: string, properties: Record<string, unknown>): void {
  if (!enabled) {
    return;
  }
  posthog.capture(event, properties);
}

/** 로그인한 계정으로 지금까지의 익명 방문을 묶는다. 같은 id 로 다시 불러도 한 번으로 친다. */
export function identifyUser(userId: number, properties: Record<string, unknown>): void {
  if (!enabled) {
    return;
  }
  posthog.identify(String(userId), properties);
}

/**
 * 로그아웃 뒤 다음 방문이 앞 사용자에 묶이지 않게 끊는다. 식별된 적이 없으면 건너뛴다 — 익명 방문마다
 * 끊으면 같은 사람이 매번 새 방문자로 잡힌다.
 */
export function resetUser(): void {
  if (!enabled || posthog.get_property('$user_state') !== 'identified') {
    return;
  }
  posthog.reset();
}
