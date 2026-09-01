/**
 * `/bootcamps` 목록이 탭·`모집 중만`·정렬·페이지네이션에서 공유하는 URL 쿼리 상태.
 *
 * API 없음: 이 넷 중 `page`만 실제 `GET /api/v1/bootcamps`에 있다
 * (`packages/api/src/generated/user/models/getBootcampsParams.ts`는 `page`와 `size`뿐이다).
 * `tab`·`openOnly`·`sort`는 목업에는 있고 백엔드에는 대응이 없어 MSW 핸들러
 * (`packages/api/src/mocks/handlers.ts`)에서만 처리된다 — 실제 API로 전환할 때 이 세 개는
 * 서버가 조용히 무시하게 되므로 그때 다시 손봐야 한다(PRD 2절).
 */
export const BOOTCAMP_TABS = ['all', 'bootcamp', 'government', 'free'] as const;
export type BootcampTab = (typeof BOOTCAMP_TABS)[number];

/** API 없음: `getBootcamps`에 `sort` 파라미터가 없다. 목업의 `최신순` 드롭다운용이다. */
export const BOOTCAMP_SORTS = ['LATEST', 'VIEW_COUNT'] as const;
export type BootcampSort = (typeof BOOTCAMP_SORTS)[number];

export interface BootcampListQuery {
  page: number;
  sort: BootcampSort;
  tab: BootcampTab;
  openOnly: boolean;
}

export const DEFAULT_BOOTCAMP_QUERY: BootcampListQuery = {
  page: 1,
  sort: 'LATEST',
  tab: 'all',
  openOnly: false,
};

/**
 * 기본값(`page=1`, `sort=LATEST`, `tab=all`, `openOnly=false`)은 URL에서 생략한다 —
 * `buildJobListHref`(`widgets/job-list/lib/query.ts`)와 같은 방식이다. 탭이나 정렬이 바뀌면
 * `page`를 1로 되돌린다. 안 그러면 24건짜리 목록에서 12건짜리 탭으로 옮길 때 2페이지에
 * 머물러 빈 화면이 나온다.
 */
export function buildBootcampListHref(
  base: BootcampListQuery,
  overrides: Partial<BootcampListQuery> = {},
): string {
  const resetsPage =
    (overrides.tab !== undefined && overrides.tab !== base.tab) ||
    (overrides.sort !== undefined && overrides.sort !== base.sort) ||
    (overrides.openOnly !== undefined && overrides.openOnly !== base.openOnly);
  const merged: BootcampListQuery = {
    ...base,
    ...(resetsPage ? { page: 1 } : {}),
    ...overrides,
  };
  const params = new URLSearchParams();

  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  if (merged.sort !== DEFAULT_BOOTCAMP_QUERY.sort) {
    params.set('sort', merged.sort);
  }
  if (merged.tab !== DEFAULT_BOOTCAMP_QUERY.tab) {
    params.set('tab', merged.tab);
  }
  if (merged.openOnly) {
    params.set('openOnly', 'true');
  }

  const query = params.toString();
  return query ? `/bootcamps?${query}` : '/bootcamps';
}

/** `?page=`/`?sort=`/`?tab=`/`?openOnly=` 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. */
export function parseBootcampListQuery(searchParams: {
  page?: string;
  sort?: string;
  tab?: string;
  openOnly?: string;
}): BootcampListQuery {
  const page = Number(searchParams.page);
  const sort = BOOTCAMP_SORTS.find((value) => value === searchParams.sort);
  const tab = BOOTCAMP_TABS.find((value) => value === searchParams.tab);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_BOOTCAMP_QUERY.page,
    sort: sort ?? DEFAULT_BOOTCAMP_QUERY.sort,
    tab: tab ?? DEFAULT_BOOTCAMP_QUERY.tab,
    openOnly: searchParams.openOnly === 'true',
  };
}
