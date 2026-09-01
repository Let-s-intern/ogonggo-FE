/**
 * `/side-studies` 목록이 페이지네이션에서 공유하는 URL 쿼리 상태.
 *
 * API 없음: 사이드·스터디는 백엔드에 엔드포인트가 없어서 `page`조차 실제 계약이 아니다
 * (PRD 5절). 지금은 MSW 핸들러(`packages/api/src/mocks/handlers.ts`)만 이 값을 읽는다 —
 * 실제 API가 생기면 파라미터 이름부터 맞춰 봐야 한다.
 */
export interface SideStudyListQuery {
  page: number;
}

export const DEFAULT_SIDE_STUDY_QUERY: SideStudyListQuery = {
  page: 1,
};

/** 기본값(`page=1`)은 URL에서 생략한다 — `buildBootcampListHref`와 같은 방식이다. */
export function buildSideStudyListHref(
  base: SideStudyListQuery,
  overrides: Partial<SideStudyListQuery> = {},
): string {
  const merged: SideStudyListQuery = { ...base, ...overrides };
  const params = new URLSearchParams();

  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }

  const query = params.toString();
  return query ? `/side-studies?${query}` : '/side-studies';
}

/** `?page=` 문자열을 그대로 믿지 않고 1 이상의 정수만 통과시킨다. */
export function parseSideStudyListQuery(searchParams: { page?: string }): SideStudyListQuery {
  const page = Number(searchParams.page);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_SIDE_STUDY_QUERY.page,
  };
}
