import { ListPublicBootcampsCategory } from '@ogonggo/api';

/**
 * `/bootcamps` 목록이 탭·검색·정렬·페이지네이션에서 공유하는 URL 쿼리 상태. 전부
 * `GET /api/v1/bootcamps`(`listPublicBootcamps`)의 파라미터에 대응한다.
 */
export const BOOTCAMP_TABS = ['all', 'bootcamp', 'sesac'] as const;
export type BootcampTab = (typeof BOOTCAMP_TABS)[number];

/**
 * 탭 하나가 보내는 `category`. `전체`는 보내지 않는다.
 *
 * 백엔드는 분류를 저장하지 않고 등록 경로로 가른다(`ogonggo-BE` 의 `BootcampCategory`).
 * `KDT`는 고용24에서 수집한 K-디지털 트레이닝 과정, `SESAC`은 크롤러가 등록한 과정이다. 기업 회원이
 * 직접 등록한 과정과 고용24의 다른 훈련유형은 어느 탭에도 걸리지 않고 `전체`에만 나온다.
 */
export const TAB_CATEGORIES: Record<BootcampTab, ListPublicBootcampsCategory | undefined> = {
  all: undefined,
  bootcamp: ListPublicBootcampsCategory.KDT,
  sesac: ListPublicBootcampsCategory.SESAC,
};

/** 목업의 `최신순` 드롭다운. `listPublicBootcamps`의 `sort`에 대응한다. */
export const BOOTCAMP_SORTS = ['LATEST', 'VIEW_COUNT'] as const;
export type BootcampSort = (typeof BOOTCAMP_SORTS)[number];

export interface BootcampListQuery {
  page: number;
  sort: BootcampSort;
  tab: BootcampTab;
  /** 검색어. 주소의 이름은 채용공고 목록과 같은 `q`, API 로는 `keyword` 로 나간다. */
  q?: string;
}

export const DEFAULT_BOOTCAMP_QUERY: BootcampListQuery = {
  page: 1,
  sort: 'LATEST',
  tab: 'all',
};

/**
 * 기본값(`page=1`, `sort=LATEST`, `tab=all`)은 URL에서 생략한다 —
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
    ('q' in overrides && overrides.q !== base.q);
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
  if (merged.q) {
    params.set('q', merged.q);
  }

  const query = params.toString();
  return query ? `/bootcamps?${query}` : '/bootcamps';
}

/** `?page=`/`?sort=`/`?tab=`/`?q=` 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. */
export function parseBootcampListQuery(searchParams: {
  page?: string;
  sort?: string;
  tab?: string;
  q?: string;
}): BootcampListQuery {
  const page = Number(searchParams.page);
  const sort = BOOTCAMP_SORTS.find((value) => value === searchParams.sort);
  const tab = BOOTCAMP_TABS.find((value) => value === searchParams.tab);
  const q = searchParams.q?.trim();

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_BOOTCAMP_QUERY.page,
    sort: sort ?? DEFAULT_BOOTCAMP_QUERY.sort,
    tab: tab ?? DEFAULT_BOOTCAMP_QUERY.tab,
    q: q || undefined,
  };
}

/** 백엔드가 2~100자만 받는다. 벗어나면 400 이라 화면 전체가 에러가 되므로 검색어 없이 보낸다. */
export function pickBootcampKeyword(q: string | undefined): string | undefined {
  const keyword = q?.trim();
  return keyword && keyword.length >= 2 && keyword.length <= 100 ? keyword : undefined;
}
