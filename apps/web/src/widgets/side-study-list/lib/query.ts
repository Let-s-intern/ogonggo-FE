/**
 * `/side-studies` 목록이 탭과 페이지네이션에서 공유하는 URL 쿼리 상태.
 *
 * API 없음: 사이드·스터디는 백엔드에 엔드포인트가 없어서 `page`도 `kind`도 실제 계약이 아니다
 * (PRD 5절). 지금은 MSW 핸들러(`packages/api/src/mocks/handlers.ts`)만 이 값을 읽는다 —
 * 실제 API가 생기면 파라미터 이름부터 맞춰 봐야 한다.
 */
export const SIDE_STUDY_TABS = ['all', 'project', 'study'] as const;
export type SideStudyTab = (typeof SIDE_STUDY_TABS)[number];

/**
 * 탭 하나가 목록 요청에 더하는 `kind` 값(PRD 4.3의 탭 세 개). 부트캠프 탭과 달리 파라미터가
 * 하나뿐이라 `Record<탭, 값>`으로 충분하다 — `전체`는 아무것도 붙이지 않는다.
 */
export const TAB_KINDS: Record<SideStudyTab, string | undefined> = {
  all: undefined,
  project: 'SIDE_PROJECT',
  study: 'STUDY',
};

export interface SideStudyListQuery {
  page: number;
  tab: SideStudyTab;
}

export const DEFAULT_SIDE_STUDY_QUERY: SideStudyListQuery = {
  page: 1,
  tab: 'all',
};

/**
 * 기본값(`page=1`, `tab=all`)은 URL에서 생략한다 — `buildBootcampListHref`와 같은 방식이다.
 * 탭이 바뀌면 `page`를 1로 되돌린다. 안 그러면 12건짜리 목록에서 4건짜리 탭으로 옮길 때
 * 2페이지에 머물러 빈 화면이 나온다.
 */
export function buildSideStudyListHref(
  base: SideStudyListQuery,
  overrides: Partial<SideStudyListQuery> = {},
): string {
  const resetsPage = overrides.tab !== undefined && overrides.tab !== base.tab;
  const merged: SideStudyListQuery = {
    ...base,
    ...(resetsPage ? { page: 1 } : {}),
    ...overrides,
  };
  const params = new URLSearchParams();

  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  if (merged.tab !== DEFAULT_SIDE_STUDY_QUERY.tab) {
    params.set('tab', merged.tab);
  }

  const query = params.toString();
  return query ? `/side-studies?${query}` : '/side-studies';
}

/** `?page=`/`?tab=` 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. */
export function parseSideStudyListQuery(searchParams: {
  page?: string;
  tab?: string;
}): SideStudyListQuery {
  const page = Number(searchParams.page);
  const tab = SIDE_STUDY_TABS.find((value) => value === searchParams.tab);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_SIDE_STUDY_QUERY.page,
    tab: tab ?? DEFAULT_SIDE_STUDY_QUERY.tab,
  };
}
