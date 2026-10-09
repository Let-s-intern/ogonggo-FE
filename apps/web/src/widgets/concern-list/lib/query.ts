import type { ListPublicConcernsSort } from '@ogonggo/api';
import { CONCERN_CATEGORIES, CONCERN_SORTS } from '@/entities/concern/model/labels';
import type { ConcernCategory } from '@/entities/concern/model/types';

/**
 * `/concerns` 목록이 칩·정렬·페이지네이션에서 공유하는 URL 쿼리 상태. 전부 `GET /api/v1/concerns`
 * (`listPublicConcerns`)의 `page`, `category`, `sort` 파라미터에 그대로 대응한다. 값은 백엔드가 쓰는
 * 이름(`JOB_POSTING`, `VIEW_COUNT`) 그대로 주소에 남긴다 — 따로 짧은 이름을 두지 않는다.
 */
export interface ConcernListQuery {
  page: number;
  sort: ListPublicConcernsSort;
  /** 없으면 전체 카테고리다. */
  category?: ConcernCategory;
}

export const DEFAULT_CONCERN_QUERY: ConcernListQuery = {
  page: 1,
  sort: 'LATEST',
};

/**
 * 기본값(`page=1`, `sort=LATEST`, 카테고리 없음)은 URL에서 생략한다 — `buildBootcampListHref`와 같은
 * 방식이다. 카테고리나 정렬이 바뀌면 `page`를 1로 되돌린다(PRD 결정 1). 안 그러면 다섯 쪽짜리 전체에서
 * 한 쪽짜리 카테고리로 옮길 때 5쪽에 머물러 빈 화면이 나온다.
 *
 * `전체` 칩은 `{ category: undefined }` 로 부른다. 키가 있느냐로 바뀜을 읽으므로 `undefined` 도 덮어쓰기다.
 */
export function buildConcernListHref(
  base: ConcernListQuery,
  overrides: Partial<ConcernListQuery> = {},
): string {
  const resetsPage =
    ('category' in overrides && overrides.category !== base.category) ||
    (overrides.sort !== undefined && overrides.sort !== base.sort);
  const merged: ConcernListQuery = {
    ...base,
    ...(resetsPage ? { page: 1 } : {}),
    ...overrides,
  };
  const params = new URLSearchParams();

  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  if (merged.sort !== DEFAULT_CONCERN_QUERY.sort) {
    params.set('sort', merged.sort);
  }
  if (merged.category) {
    params.set('category', merged.category);
  }

  const query = params.toString();
  return query ? `/concerns?${query}` : '/concerns';
}

/**
 * `?page=`/`?sort=`/`?category=` 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. 모르는 값은 버리고
 * 기본값으로 돌아간다 — 주소창에서 누구나 바꿀 수 있고, 모르는 `category` 를 그대로 보내면 백엔드가 400 을
 * 줘서 화면 전체가 에러가 된다.
 */
export function parseConcernListQuery(searchParams: {
  page?: string;
  sort?: string;
  category?: string;
}): ConcernListQuery {
  const page = Number(searchParams.page);
  const sort = CONCERN_SORTS.find((value) => value === searchParams.sort);
  const category = CONCERN_CATEGORIES.find((value) => value === searchParams.category);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_CONCERN_QUERY.page,
    sort: sort ?? DEFAULT_CONCERN_QUERY.sort,
    category,
  };
}
