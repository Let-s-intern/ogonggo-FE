/**
 * 광고 성과 리포트용 자체 이벤트(`POST /api/v1/events`, PRD 6.5)의 브라우저 밖에서도 도는 부분. 요청 모양과 큐,
 * 방문자 id 쿠키 읽기다. 브라우저에 붙이는 일(`fetch`·`sendBeacon`·페이지 떠남 감지)은 `./contentEvents.ts` 가 한다.
 *
 * 요청 모양은 `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 1절이다. 백엔드 배포 뒤 코드젠으로 생성 타입이
 * 생기면 아래 손으로 쓴 타입을 그것으로 바꾼다(Push 2 의 2.5).
 *
 * 다른 모듈을 가져오지 않는다. 단위 테스트(`pnpm --filter web test`)가 이 파일만 Node 에서 돌린다.
 */

export type ContentEventType =
  | 'VIEW'
  | 'CTA_CLICK'
  | 'SCROLL'
  | 'IMPRESSION'
  | 'AD_CLICK'
  | 'SHARE';

export type ContentTargetType = 'JOB' | 'BOOTCAMP';

export type ContentEventSource =
  | 'AD_CARD'
  | 'BANNER'
  | 'LIST'
  | 'SEARCH'
  | 'DIRECT'
  | 'EXTERNAL'
  | 'OTHER';

export interface ContentEvent {
  type: ContentEventType;
  /** 배너의 `IMPRESSION`·`AD_CLICK` 만 비울 수 있다. */
  targetType: ContentTargetType | null;
  targetId: number | null;
  /** 광고 노출 id. 광고 이벤트는 필수이고, 상세 이벤트는 광고를 눌러 들어왔을 때만 채운다. */
  exposureId: number | null;
  source: ContentEventSource;
  /** `SCROLL` 만. 0~100 정수. */
  scrollPercent?: number;
  /** `SCROLL` 만. 화면이 보인 시간. */
  durationMs?: number;
}

export interface ContentEventsRequest {
  visitorId: string;
  events: ContentEvent[];
}

/** 모은 이벤트를 보내기까지 기다리는 시간. 그 전에 `FLUSH_COUNT` 건이 차면 바로 보낸다. */
export const FLUSH_DELAY_MS = 2000;
export const FLUSH_COUNT = 10;

export interface ContentEventTransport {
  /**
   * 토큰을 실은 `fetch(keepalive)` 로 보낸다. 보내기 시작했으면 `true` 다. 못 시작하면(keepalive 를 못 쓰는 브라우저)
   * `false` 이고, 떠날 때만 그것을 보고 `beacon` 으로 돌린다. 요청이 실패한 것은 보내는 쪽이 삼킨다.
   */
  post(request: ContentEventsRequest): boolean;
  /** 비콘은 토큰을 실을 수 없어 비회원으로 저장된다. 떠날 때 `post` 가 못 보냈을 때만 쓴다. 브라우저가 받아 주지 않으면 `false`. */
  beacon(body: string): boolean;
}

/** 묶음 전송이 실패했을 때 다시 보내기까지 기다리는 시간. */
export const RETRY_DELAY_MS = 3000;

/**
 * 같은 묶음을 다시 보낼 만한 실패인지. 네트워크 오류(`fetch` 가 `TypeError` 로 거절)와 서버 오류(5xx)만이다. 이 요청의 성공 응답
 * 202 는 본문이 없어 `httpClient` 가 읽다가 던지므로(`SyntaxError`) 던졌다고 다 실패가 아니다 — 4xx 와 함께 다시 보내지 않는다.
 * 같은 묶음이 두 번 저장되는 것보다 한 번 유실되는 쪽이 낫다.
 */
export function isRetryableFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 500;
}

/**
 * 묶음을 보내고, 다시 보낼 만한 실패(`isRetryableFailure`)면 `RETRY_DELAY_MS` 뒤 한 번만 다시 보낸다(A9). 두 번째도 실패하면
 * 버린다. 던지지 않는다 — 이벤트 한 묶음 못 보낸 것을 사용자에게 알릴 일은 없다. 페이지가 내려가면 타이머도 사라져 그 묶음은
 * 유실된다.
 */
export function sendWithOneRetry(
  send: () => Promise<unknown>,
  setTimer: (callback: () => void, ms: number) => unknown = (callback, ms) =>
    setTimeout(callback, ms),
): Promise<void> {
  return send().then(
    () => undefined,
    (error: unknown) => {
      if (!isRetryableFailure(error)) {
        return undefined;
      }
      return new Promise<void>((resolve) => {
        setTimer(() => {
          send().then(
            () => resolve(),
            () => resolve(),
          );
        }, RETRY_DELAY_MS);
      });
    },
  );
}

export interface ContentEventQueue {
  push(event: ContentEvent): void;
  /** 모인 것을 지금 보낸다. */
  flush(): void;
  /** 모인 것을 떠나는 길에 보낸다. 토큰을 실은 `post` 가 먼저이고 `sendBeacon` 은 그것을 못 쓸 때만이다. 탭이 숨거나 페이지가 내려갈 때 부른다. */
  flushOnLeave(): void;
}

export interface ContentEventQueueOptions {
  getVisitorId: () => string;
  transport: ContentEventTransport;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
}

/**
 * 이벤트를 모아 2초 또는 10건마다 한 요청으로 보낸다(PRD 6.5). 카드 노출처럼 한꺼번에 여러 건이 생기는 것을 요청
 * 하나로 묶는다. 10건이 차면 바로 보내므로 한 요청이 백엔드 상한(20건)을 넘지 않는다.
 */
export function createContentEventQueue({
  getVisitorId,
  transport,
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
}: ContentEventQueueOptions): ContentEventQueue {
  let pending: ContentEvent[] = [];
  let timer: unknown;

  const take = (): ContentEventsRequest | null => {
    if (timer !== undefined) {
      clearTimer(timer);
      timer = undefined;
    }
    if (pending.length === 0) {
      return null;
    }
    const request = { visitorId: getVisitorId(), events: pending };
    pending = [];
    return request;
  };

  const flush = () => {
    const request = take();
    if (request) {
      transport.post(request);
    }
  };

  return {
    push(event) {
      pending.push(event);
      if (pending.length >= FLUSH_COUNT) {
        flush();
        return;
      }
      timer ??= setTimer(() => {
        timer = undefined;
        flush();
      }, FLUSH_DELAY_MS);
    },
    flush,
    flushOnLeave() {
      const request = take();
      if (request && !transport.post(request)) {
        transport.beacon(JSON.stringify(request));
      }
    },
  };
}

export interface ImpressionRegistry {
  /** 이 노출을 이번 페이지 조회에서 처음 보내는 것이면 `true`. 같은 노출이 다시 오면 `false`. */
  claim(event: ContentEvent): boolean;
  /** 새 페이지 조회가 시작될 때 부른다. */
  reset(): void;
}

/**
 * 노출을 한 페이지 조회 안에서 노출 id 마다 한 번만 보내려고 이미 보낸 노출을 기억한다(A8, 2026-11-24). 한 페이지 조회는 주소의
 * 경로가 바뀔 때마다 새로 시작한다 — 홈 2쪽에서 1쪽으로 와도 같은 조회라 히어로·배너를 다시 세지 않고, 상세에 갔다가 뒤로 가기로
 * 돌아온 화면은 새 조회라 다시 센다. 카드가 다시 그려지는 횟수(마운트)와 모바일·데스크톱 달력의 구조 차이에 값이 따라가지
 * 않게 하는 것이 목적이다. 같은 노출 id 라도 대상이 다르면 다른 노출이다.
 */
export function createImpressionRegistry(): ImpressionRegistry {
  const seen = new Set<string>();
  return {
    claim(event) {
      const key = `${event.source}:${event.exposureId}:${event.targetType}:${event.targetId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    },
    reset() {
      seen.clear();
    },
  };
}

/** 익명 방문자 id 쿠키. 이름은 API 계약에 적힌 것이다. 서버가 `Set-Cookie` 로 발급하고(`proxy.ts`) 브라우저는 읽기만 한다. */
export const VISITOR_COOKIE = 'ogg_vid';
/** 서버(`proxy.ts`)가 쿠키를 발급할 때의 수명. 1년이다. */
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
/** 백엔드가 받는 최대 길이. UUID 는 36자다. */
const VISITOR_ID_MAX_LENGTH = 36;

/** `document.cookie` 문자열에서 방문자 id 를 읽는다. 없거나 모양이 틀리면 `null` 이다. */
export function readVisitorId(cookie: string): string | null {
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== VISITOR_COOKIE) {
      continue;
    }
    const value = rest.join('=');
    return /^[0-9A-Za-z-]+$/.test(value) && value.length <= VISITOR_ID_MAX_LENGTH ? value : null;
  }
  return null;
}

const SEARCH_ENGINE_HOST = /(^|\.)(google|naver|daum|bing|yahoo|duckduckgo)\./;
/** 네이버 블로그·카페는 검색이 아니라 사람이 건 링크다(`naver` 를 포함해도 `SEARCH` 가 아니다). */
const NAVER_COMMUNITY_HOST = /(^|\.)(blog|cafe)\.naver\.com$/;

/**
 * 상세를 사이트 밖에서 바로 연 경우의 유입 경로. 검색 엔진에서 왔으면 `SEARCH`, 다른 사이트면 `EXTERNAL`,
 * 주소를 직접 쳤거나 북마크면 `DIRECT` 다. 우리 사이트에서 새로 고쳤거나 새 탭으로 연 것은 `OTHER` 다.
 * 네이버 블로그·카페(`blog.naver.com`, `cafe.naver.com`)는 `EXTERNAL` 이다(2026-11-24).
 */
export function landingSource(referrer: string, ownOrigin: string): ContentEventSource {
  if (!referrer) {
    return 'DIRECT';
  }
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return 'OTHER';
  }
  if (url.origin === ownOrigin) {
    return 'OTHER';
  }
  if (NAVER_COMMUNITY_HOST.test(url.hostname)) {
    return 'EXTERNAL';
  }
  return SEARCH_ENGINE_HOST.test(url.hostname) ? 'SEARCH' : 'EXTERNAL';
}

/** `performance.getEntriesByType('navigation')[0]` 에서 `detailSource` 가 보는 값. */
export interface NavigationLike {
  /** 페이지를 처음 연 주소. */
  name: string;
  /** `navigate` | `reload` | `back_forward` | `prerender`. */
  type: string;
}

export interface DetailSourceInput {
  /** 이 문서(페이지 로드)에서 처음 하는 판정인가. 한 번 판정한 뒤에는 착지를 소비한 것이다. */
  firstJudgement: boolean;
  navigation: NavigationLike | undefined;
  pathname: string;
  referrer: string;
  ownOrigin: string;
}

/**
 * 광고를 누르지 않고 열린 상세의 유입 경로. 사이트에 처음 들어온 그 페이지일 때만 이전 페이지 주소로 가른다. 한 번 판정한
 * 뒤에는 같은 주소를 앱 안에서 다시 열어도 검색·외부로 잡지 않고(`LIST`), 새로 고침이나 뒤·앞으로 가기로 다시 열린 문서는
 * 처음 referrer 가 남아 있어도 어디서 왔는지 알 수 없어 `OTHER` 다(2026-11-24).
 */
export function detailSource({
  firstJudgement,
  navigation,
  pathname,
  referrer,
  ownOrigin,
}: DetailSourceInput): ContentEventSource {
  if (!firstJudgement || !navigation) {
    return 'LIST';
  }
  try {
    if (new URL(navigation.name).pathname !== pathname) {
      return 'LIST';
    }
  } catch {
    return 'LIST';
  }
  if (navigation.type === 'reload' || navigation.type === 'back_forward') {
    return 'OTHER';
  }
  return landingSource(referrer, ownOrigin);
}

/** 클릭 이벤트에서 `staysInThisTab` 이 보는 값. React 의 `MouseEvent` 가 그대로 맞는다. */
export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * 이 클릭이 지금 탭을 링크 대상으로 옮기는지. 수정키(cmd·ctrl·shift·alt)를 누르거나 가운데 버튼이거나 링크가 새 탭
 * (`target`)이면 다른 탭이 열려 이 탭은 그대로다. 광고 클릭이 상세로 넘기는 노출 id 는 이 탭의 `sessionStorage` 에 남기므로,
 * 이동하지 않는 클릭이 남기면 원래 탭에서 나중에 같은 공고를 일반 카드로 열 때 광고 몫으로 잡힌다(2026-11-24).
 */
export function staysInThisTab(click: ClickLike, linkTarget?: string | null): boolean {
  if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) {
    return false;
  }
  return !linkTarget || linkTarget === '_self';
}

/** 광고(카드·배너)를 눌러 상세로 갈 때 남기는 값. 상세가 읽어 자기 이벤트의 `exposureId` 로 싣는다. */
export interface AdEntry {
  targetType: ContentTargetType;
  targetId: number;
  exposureId: number;
  source: 'AD_CARD' | 'BANNER';
  /** 누른 시각(epoch ms). */
  at: number;
}

/** 광고를 누른 뒤 이 시간 안에 열린 상세만 광고로 들어온 것으로 본다. */
export const AD_ENTRY_TTL_MS = 30 * 60 * 1000;

export const AD_ENTRY_KEY = 'ogonggo:ad-entry';

type EntryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function rememberAdEntry(storage: EntryStorage, entry: AdEntry): void {
  try {
    storage.setItem(AD_ENTRY_KEY, JSON.stringify(entry));
  } catch {
    // 저장소를 못 쓰면 상세가 광고 몫으로 잡히지 않을 뿐이다.
  }
}

/**
 * 연 상세가 방금 누른 광고의 대상이면 그 값을 준다. 한 번 읽으면 지운다 — 새로 고친 상세가 광고로 한 번 더 들어온
 * 것으로 잡히지 않게 한다(`entities/job/model/listSource.ts` 와 같은 규칙). 대상이 다르거나 30분이 지났으면 `null`.
 */
export function takeAdEntry(
  storage: EntryStorage,
  targetType: ContentTargetType,
  targetId: number,
  now: number,
): AdEntry | null {
  try {
    const raw = storage.getItem(AD_ENTRY_KEY);
    storage.removeItem(AD_ENTRY_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<AdEntry>) : null;
    if (
      saved?.targetType === targetType &&
      saved.targetId === targetId &&
      typeof saved.exposureId === 'number' &&
      (saved.source === 'AD_CARD' || saved.source === 'BANNER') &&
      typeof saved.at === 'number' &&
      now - saved.at <= AD_ENTRY_TTL_MS &&
      now >= saved.at
    ) {
      return saved as AdEntry;
    }
  } catch {
    // 아래 `null` 로 떨어진다.
  }
  return null;
}
