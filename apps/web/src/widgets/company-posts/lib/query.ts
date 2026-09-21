/**
 * `/mypage/company/posts` 의 URL 상태(v5 PRD 2 절).
 *
 * 주소에 들어가는 것은 탭과 페이지 둘뿐이다. `listMyJobs`·`listMyBootcamps` 가 받는 것이
 * `page`·`size` 뿐이라 필터도 검색도 정렬도 없다 — 그 줄을 그리지 않은 근거는
 * `.claude/tasks/memos/결정-기업-마이페이지-push2-2026-09-21.md` 1 절에 있다.
 */
export const COMPANY_POST_TABS = ['jobs', 'bootcamps'] as const;
export type CompanyPostTab = (typeof COMPANY_POST_TABS)[number];

export interface CompanyPostsQuery {
  tab: CompanyPostTab;
  page: number;
}

export const DEFAULT_COMPANY_POSTS_QUERY: CompanyPostsQuery = { tab: 'jobs', page: 1 };

/** 기본값은 주소에서 뺀다. 탭을 옮기면 1 페이지로 돌아간다 — v4 목록 화면 넷과 같다. */
export function buildCompanyPostsHref(
  base: CompanyPostsQuery,
  overrides: Partial<CompanyPostsQuery> = {},
): string {
  if (overrides.tab !== undefined && overrides.tab !== base.tab) {
    return buildCompanyPostsHref({ tab: overrides.tab, page: 1 });
  }

  const merged: CompanyPostsQuery = { ...base, ...overrides };
  const params = new URLSearchParams();
  if (merged.tab !== DEFAULT_COMPANY_POSTS_QUERY.tab) {
    params.set('tab', merged.tab);
  }
  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }

  const search = params.toString();
  return search ? `/mypage/company/posts?${search}` : '/mypage/company/posts';
}

/** 주소의 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. */
export function parseCompanyPostsQuery(
  searchParams: Record<string, string | undefined>,
): CompanyPostsQuery {
  const tab = COMPANY_POST_TABS.find((candidate) => candidate === searchParams.tab);
  const page = Number(searchParams.page);
  return {
    tab: tab ?? DEFAULT_COMPANY_POSTS_QUERY.tab,
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_COMPANY_POSTS_QUERY.page,
  };
}
