import { isSignedIn } from '@/shared/api/authTokens';

/**
 * GTM 으로 보내는 이벤트. 키 이름과 허용값은 마케팅팀 'dataLayer 개발 명세서(프론트엔드)'
 * (2026-09-22)가 정하고, GTM 변수가 그 이름에 그대로 묶여 있다 — 한 글자만 달라도 수집되지 않는다.
 * 명세에 없는 키는 마케팅팀과 합의한 뒤에 더한다.
 *
 * **이벤트마다 명세된 키를 빠짐없이 보낸다.** dataLayer 는 앞선 push 의 값을 기억해서, 키를 빼면
 * 직전 공고의 `ad_campaign_id` 가 다음 이벤트에 그대로 붙는다. 값이 없으면 문자열은 `''`,
 * 숫자는 `null` 이다. `undefined` 는 타입에서 막는다.
 */
export type DataLayerParams = Record<string, string | number | null>;

/** 부트캠프·사이드 스터디 목록 카드의 자리. 두 목록 모두 페이지가 있다. */
export interface ProgramCardTracking {
  /** 지금 페이지 목록 안의 순서, 1부터. */
  listPosition: number;
  /** 목록 페이지 번호, 1부터. */
  pageNumber: number;
}

/**
 * 광고 프로그램인가. 명세 4장 `program_impression` 의 조건이다. 광고 값이 API 에 들어오기
 * 전에는 `NO_AD_PARAMS` 라 늘 거짓이다.
 */
export function isPromoted(info: DataLayerParams): boolean {
  return info.is_promoted === 'Y' || Boolean(info.ad_campaign_id);
}

export interface DataLayerEvent {
  event: string;
  params: DataLayerParams;
}

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function track(event: string, params: DataLayerParams = {}): void {
  if (typeof window === 'undefined') {
    return;
  }
  syncPageContext();
  push({ event, ...params });
}

let lastPageContext = '';

/**
 * 지금 화면의 `page_context` 를 보낸다. 앞서 보낸 것과 같으면 보내지 않는다.
 *
 * GTM 은 모든 이벤트에 직전 `page_context` 의 `page_type`·`login_state` 를 붙인다. 그래서 다른
 * 이벤트보다 먼저 나가야 하는데, 화면 이동을 지켜보는 `PageContextTracker` 의 effect 는 자식
 * 화면의 effect(예: `job_detail_view`)보다 늦게 돈다 — React 는 effect 를 자식부터 돌린다.
 * `track` 이 보내기 직전에 이것을 부르는 이유다. 먼저 불린 쪽이 보내고 나중 쪽은 건너뛴다.
 */
export function syncPageContext(): void {
  if (typeof window === 'undefined') {
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

/**
 * 경로 → `page_type`. 허용값은 명세 3장의 열 개뿐이고, 나머지 화면은 `etc` 다.
 *
 * 달력에서 공고를 누르면 모달 라우트가 뜨지만 주소는 `/jobs/{id}` 라 `job_detail` 이 된다.
 */
export function pageTypeOf(pathname: string): string {
  if (pathname === '/') return 'job_list';
  if (/^\/jobs\/[^/]+$/.test(pathname)) return 'job_detail';
  if (pathname === '/calendar') return 'calendar';
  if (pathname === '/bootcamps') return 'bootcamp_list';
  if (/^\/bootcamps\/[^/]+$/.test(pathname)) return 'bootcamp_detail';
  if (pathname === '/side-studies') return 'side_study_list';
  if (/^\/side-studies\/[^/]+$/.test(pathname)) return 'side_study_detail';
  if (pathname.startsWith('/mypage/company/posts/jobs/')) return 'job_post';
  if (pathname === '/mypage' || pathname.startsWith('/mypage/')) return 'mypage';
  return 'etc';
}

/**
 * 광고 값 3개. 공고·프로그램 API 응답에 아직 없어(2026-09-28) 광고가 아닌 값을 보낸다.
 * 명세 3장이 API 에 더하라고 한 필드이고, 들어오면 이 자리를 응답 값으로 바꾼다.
 * `program_impression` 은 광고 프로그램에만 나가므로 그 전까지는 한 건도 나가지 않는다.
 */
export const NO_AD_PARAMS = {
  is_promoted: 'N',
  ad_product: 'none',
  ad_campaign_id: '',
} satisfies DataLayerParams;

/**
 * 필터 하나를 `current` 에서 `next` 로 바꿀 때 나갈 `filter_apply` 들. 값 하나당 한 건이라, 고른
 * 값을 다른 값으로 바꾸면 해제와 선택 두 건이다. 같은 값을 다시 고르면 목록이 바뀌지 않아 없다.
 */
export function filterApplyEvents(
  filterType: string,
  current: string | undefined,
  next: string | undefined,
): DataLayerEvent[] {
  if (current === next) {
    return [];
  }
  const events: DataLayerEvent[] = [];
  if (current) {
    events.push({
      event: 'filter_apply',
      params: { filter_type: filterType, filter_value: current, filter_action: 'deselect' },
    });
  }
  if (next) {
    events.push({
      event: 'filter_apply',
      params: { filter_type: filterType, filter_value: next, filter_action: 'select' },
    });
  }
  return events;
}

/**
 * `program_status`. 마감이 아니면서 마감까지 7일 이내(D-7~D-DAY)면 `closing_soon` 이다.
 * 마감 여부는 화면이 `마감` 배지를 그리는 판단을 그대로 넘겨받는다.
 */
export function programStatus(closed: boolean, daysLeft: number | null): string {
  if (closed) {
    return 'closed';
  }
  return daysLeft !== null && daysLeft <= 7 ? 'closing_soon' : 'recruiting';
}
