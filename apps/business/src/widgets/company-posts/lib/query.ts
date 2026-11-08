/**
 * `/mypage/company/posts/{jobs|bootcamps}` 의 URL 상태(v5 PRD 2 절, `prd-company-mypage-posts.md`).
 *
 * 종류는 경로가, 페이지는 `?page=` 가 정한다. 종류가 경로에 있는 이유는 사이드바 메뉴가 `채용공고` ·
 * `부트캠프` 둘로 나뉘어서다 — 메뉴의 현재 항목은 경로 앞부분으로 고르므로(`MyPageSidebar`) 쿼리로는
 * 켤 수 없다. 작성·수정 폼도 이미 `.../posts/jobs/new` 처럼 종류 아래에 있다.
 *
 * `listMyJobs`·`listMyBootcamps` 가 받는 것이 `page`·`size` 뿐이라 필터도 검색도 정렬도 없다 — 그 줄을
 * 그리지 않은 근거는 `.claude/tasks/memos/결정-기업-마이페이지-push2-2026-09-21.md` 1 절에 있다.
 */
export const COMPANY_POST_TABS = ['jobs', 'bootcamps'] as const;
export type CompanyPostTab = (typeof COMPANY_POST_TABS)[number];

export interface CompanyPostsQuery {
  tab: CompanyPostTab;
  page: number;
}

/** 1 페이지는 주소에서 뺀다. */
export function buildCompanyPostsHref(
  base: CompanyPostsQuery,
  overrides: Partial<CompanyPostsQuery> = {},
): string {
  const merged: CompanyPostsQuery = { ...base, ...overrides };
  const path = `/mypage/company/posts/${merged.tab}`;
  return merged.page > 1 ? `${path}?page=${merged.page}` : path;
}

/** 주소의 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. */
export function parseCompanyPostsQuery(
  tab: CompanyPostTab,
  searchParams: Record<string, string | undefined>,
): CompanyPostsQuery {
  const page = Number(searchParams.page);
  return { tab, page: Number.isInteger(page) && page >= 1 ? page : 1 };
}

/**
 * 옛 주소 `/mypage/company/posts?tab=` 의 종류. 메뉴가 나뉘기 전의 링크(즐겨찾기, 열려 있던 탭)를
 * 살리려고 옛 경로가 이 값으로 새 경로에 보낸다.
 */
export function legacyCompanyPostTab(searchParams: Record<string, string | undefined>) {
  return COMPANY_POST_TABS.find((candidate) => candidate === searchParams.tab) ?? 'jobs';
}
