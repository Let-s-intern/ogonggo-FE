import { httpClient } from '@ogonggo/api';
import {
  createContentEventQueue,
  readVisitorId,
  rememberAdEntry,
  takeAdEntry,
  visitorCookie,
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
 * 모아 보내기는 `./contentEventQueue.ts` 다. 평소에는 `httpClient` 로 보내 로그인했으면 토큰이 실린다. 탭이 숨거나
 * 페이지가 내려갈 때는 남은 것을 `sendBeacon`(text/plain JSON)으로 보낸다 — 그 순간의 `fetch` 는 끊길 수 있다.
 * 비콘에는 토큰을 실을 수 없어 비회원으로 잡힌다.
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

/** 첫 방문이면 만들어 1년 쿠키로 둔다. 쿠키를 막아 두었으면 이 탭에서만 같은 값을 쓴다. */
function getVisitorId(): string {
  visitorId ??= readVisitorId(document.cookie);
  if (!visitorId) {
    visitorId = newVisitorId();
    document.cookie = visitorCookie(visitorId, location.protocol === 'https:');
  }
  return visitorId;
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
          httpClient(ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(request),
            keepalive: true,
          }).catch(() => {
            // 이벤트 한 묶음 못 보낸 것을 사용자에게 알릴 일은 없다. 202 는 본문이 없어 읽기에서 던지는 것도 여기로 온다.
          });
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

/** 모인 것을 지금 비콘으로 보낸다. 떠날 때 마지막 이벤트(`SCROLL`)를 넣은 쪽이 부른다. */
export function flushContentEventsOnLeave(): void {
  getQueue()?.flushOnLeave();
}

/**
 * 광고를 누를 때 부른다. `AD_CLICK` 을 보내고, 상세로 가는 클릭이면 대상과 노출 id 를 이 탭의 `sessionStorage` 에
 * 남긴다. 주소 쿼리에 싣지 않는 것은 공유·북마크된 주소로 나중에 온 방문까지 광고 몫으로 잡히기 때문이다.
 */
export function recordAdClick({
  exposureId,
  source,
  target,
}: {
  exposureId: number;
  source: 'AD_CARD' | 'BANNER';
  /** 누르면 가는 상세. 배너가 사이트 밖이나 목록으로 가면 없다. */
  target: { targetType: ContentTargetType; targetId: number } | null;
}): void {
  // 배너 클릭은 대상 없이 보낸다(API 계약 1절). 배너 노출에는 대상이 없어 대상을 실으면 불일치로 버려질 수 있다.
  const clickTarget = source === 'BANNER' ? null : target;
  sendContentEvent({
    type: 'AD_CLICK',
    targetType: clickTarget?.targetType ?? null,
    targetId: clickTarget?.targetId ?? null,
    exposureId,
    source,
  });
  if (target) {
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
