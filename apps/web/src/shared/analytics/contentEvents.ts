import { httpClient } from '@ogonggo/api';
import { getRefreshToken, hasUsableAccessToken } from '@/shared/api/authTokens';
import { ensureAccessToken } from '@/shared/api/reissue';
import {
  createContentEventQueue,
  createImpressionRegistry,
  readVisitorId,
  rememberAdEntry,
  takeAdEntry,
  type AdEntry,
  type ContentEvent,
  type ContentEventQueue,
  type ContentEventSource,
  type ContentTargetType,
} from './contentEventQueue';

export type { ContentEvent, ContentEventSource, ContentTargetType } from './contentEventQueue';

/**
 * 광고 성과 리포트용 자체 이벤트를 백엔드로 보낸다(`POST /api/v1/events`, PRD 6.5). GTM·PostHog
 * (`./dataLayer.ts`)와 따로 가는 길이고, 그쪽 이벤트는 그대로 둔다.
 *
 * 모아 보내기는 `./contentEventQueue.ts` 다. 평소에도 탭이 숨거나 페이지가 내려갈 때도 `httpClient` 의
 * `fetch(keepalive)` 로 보내 로그인했으면 토큰이 실린다. `sendBeacon`(text/plain JSON)은 keepalive 를 못 쓰는
 * 브라우저에서만 쓴다 — 비콘에는 토큰을 실을 수 없어 비회원으로 잡힌다.
 *
 * 보내기 전에 액세스 토큰이 만료됐으면 재발급(`ensureAccessToken`)을 기다린다.
 *
 * 서버 렌더에서는 아무것도 하지 않는다. 큐와 리스너는 처음 보낼 때 만든다.
 */
const ENDPOINT = '/api/v1/events';

let queue: ContentEventQueue | null = null;
let visitorId: string | null = null;

function newVisitorId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // http 로 연 개발 서버처럼 보안 컨텍스트가 아니면 `randomUUID` 가 없다. 같은 모양(v4)을 만든다.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * 서버가 응답의 `Set-Cookie` 로 둔 방문자 id 를 읽는다(`proxy.ts`). 브라우저에서는 쿠키를 쓰지 않는다 — `document.cookie` 로
 * 쓴 쿠키는 Safari 가 7일로 줄여(ITP) iOS 비회원이 매주 새 사람이 된다. 쿠키가 없으면(막았거나 서버가 못 줬으면) 이 문서에서만
 * 같은 값을 쓴다.
 */
function getVisitorId(): string {
  visitorId ??= readVisitorId(document.cookie) ?? newVisitorId();
  return visitorId;
}

/** 페이지를 떠나는 순간에도 끊기지 않는 `fetch` 를 쓸 수 있는지. 못 쓰면 떠날 때 비콘으로 돌린다. */
function supportsKeepalive(): boolean {
  return typeof Request !== 'undefined' && 'keepalive' in Request.prototype;
}

/**
 * 로그인했는데(리프레시 토큰이 있는데) 액세스 토큰이 없거나 곧 만료되는지. 이 공개 API 는 만료된 토큰을 401 이 아니라
 * 익명으로 받아 재발급이 일어나지 않으므로, 보내기 전에 재발급을 기다려야 회원 이벤트로 저장된다. 아니면 기다리지
 * 않고 그 자리에서 보낸다 — 로그인하지 않았거나 토큰이 멀쩡하면 떠나는 순간에도 바로 나간다.
 */
function needsReissue(): boolean {
  return getRefreshToken() !== null && !hasUsableAccessToken();
}

function getQueue(): ContentEventQueue | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!queue) {
    const created = createContentEventQueue({
      getVisitorId,
      transport: {
        post: (request) => {
          if (!supportsKeepalive()) {
            return false;
          }
          const send = () =>
            httpClient(ENDPOINT, {
              method: 'POST',
              body: JSON.stringify(request),
              keepalive: true,
            }).catch(() => {
              // 이벤트 한 묶음 못 보낸 것을 사용자에게 알릴 일은 없다. 202 는 본문이 없어 읽기에서 던지는 것도 여기로 온다.
            });
          if (needsReissue()) {
            // 재발급이 실패해도 던지지 않는다. 그때는 토큰 없이 비회원으로라도 보낸다.
            void ensureAccessToken().then(send, send);
          } else {
            send();
          }
          return true;
        },
        beacon: (body) =>
          typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(ENDPOINT, body),
      },
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        created.flushOnLeave();
      }
    });
    window.addEventListener('pagehide', () => created.flushOnLeave());
    queue = created;
  }
  return queue;
}

export function sendContentEvent(event: ContentEvent): void {
  getQueue()?.push(event);
}

const impressions = createImpressionRegistry();

/** 새 페이지 조회(주소의 경로가 바뀜)가 시작됐다. 이 조회 안에서 센 노출을 잊는다(`createImpressionRegistry`). */
export function startPageView(): void {
  impressions.reset();
}

/** 광고 노출(`IMPRESSION`)을 보낸다. 이 페이지 조회에서 이미 센 노출이면 보내지 않는다. */
export function sendImpression(event: ContentEvent): void {
  if (impressions.claim(event)) {
    sendContentEvent(event);
  }
}

/**
 * 모인 것을 지금 보낸다. 새 탭을 여는 클릭(지원 버튼, 외부 주소 배너, SNS 공유)이 이벤트를 넣은 직후 부른다 — 새 탭이
 * 열리면 원래 탭이 곧바로 숨는데, 그때까지 2초 타이머를 기다리게 두지 않는다.
 */
export function flushContentEvents(): void {
  getQueue()?.flush();
}

/** 모인 것을 떠나는 길로 지금 보낸다(토큰 실은 keepalive `fetch`). 떠날 때 마지막 이벤트(`SCROLL`)를 넣은 쪽이 부른다. */
export function flushContentEventsOnLeave(): void {
  getQueue()?.flushOnLeave();
}

export interface AdClick {
  exposureId: number;
  source: 'AD_CARD' | 'BANNER';
  /** 누르면 가는 상세. 배너가 사이트 밖이나 목록으로 가면 없다. */
  target: { targetType: ContentTargetType; targetId: number } | null;
}

/**
 * 광고를 누를 때 부른다. `AD_CLICK` 은 어떤 클릭이든 보내고, 이 탭이 상세로 이동하는 클릭(`sameTab`)일 때만 대상과 노출 id 를
 * 이 탭의 `sessionStorage` 에 남긴다. 새 탭은 그 값을 받지 못하고, 이동하지 않는 탭에 남기면 나중에 같은 공고를 일반 카드로 열 때
 * 광고 몫으로 잡히기 때문이다(`staysInThisTab`). 주소 쿼리에 싣지 않는 것은 공유·북마크된 주소로 나중에 온 방문까지 광고 몫으로
 * 잡히기 때문이다.
 */
export function recordAdClick(
  { exposureId, source, target }: AdClick,
  { sameTab }: { sameTab: boolean },
): void {
  // 배너 클릭은 대상 없이 보낸다(API 계약 1절). 배너 노출에는 대상이 없어 대상을 실으면 불일치로 버려질 수 있다.
  const clickTarget = source === 'BANNER' ? null : target;
  sendContentEvent({
    type: 'AD_CLICK',
    targetType: clickTarget?.targetType ?? null,
    targetId: clickTarget?.targetId ?? null,
    exposureId,
    source,
  });
  if (target && sameTab) {
    rememberAdEntry(sessionStorage, { ...target, exposureId, source, at: Date.now() });
  }
}

/** 상세가 열릴 때 한 번. 방금 누른 광고의 대상이면 그 값이다. */
export function takeAdEntryFor(targetType: ContentTargetType, targetId: number): AdEntry | null {
  try {
    return takeAdEntry(sessionStorage, targetType, targetId, Date.now());
  } catch {
    return null;
  }
}

export interface DetailVisit {
  targetType: ContentTargetType;
  targetId: number;
  exposureId: number | null;
  source: ContentEventSource;
}

let currentVisit: DetailVisit | null = null;

/**
 * 지금 열린 상세의 유입 값. 상세의 `VIEW` 를 보낸 쪽이 적고, 지원 버튼(`CTA_CLICK`)이 같은 값을 싣는다.
 * 노출 id 는 열릴 때 한 번 읽고 지우므로 여기 들고 있어야 한다.
 */
export function setCurrentVisit(visit: DetailVisit): void {
  currentVisit = visit;
}

export function currentVisitFor(targetType: ContentTargetType, targetId: number): DetailVisit {
  return currentVisit?.targetType === targetType && currentVisit.targetId === targetId
    ? currentVisit
    : { targetType, targetId, exposureId: null, source: 'OTHER' };
}
