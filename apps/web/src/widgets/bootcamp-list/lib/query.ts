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

/**
 * 탭 하나가 목록 요청에 더하는 쿼리 파라미터(PRD 4.1 표). `programType`과 `tuitionType`이
 * 섞여 있어 한 파라미터로 묶이지 않는다 — `부트캠프`만 `programType`이고 나머지 둘은
 * `tuitionType`이다.
 *
 * `부트캠프`의 값 `'부트캠프'`는 픽스처에서 오프라인 과정 12건의 `programType`이다
 * (`packages/api/src/mocks/fixtures/bootcamp.ts`). 온라인 과정은 새싹의 카테고리 표기
 * (AI, 파이썬, AICE, 웹크롤링, 풀스택, AIot, 프론트엔드, 안드로이드)가 `programType`이라
 * 이 탭에 걸리지 않는다.
 */
export const TAB_FILTERS: Record<BootcampTab, Record<string, string>> = {
  all: {},
  bootcamp: { programType: '부트캠프' },
  government: { tuitionType: 'GOVERNMENT_FUNDED' },
  free: { tuitionType: 'FREE' },
};

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
