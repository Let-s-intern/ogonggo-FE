/**
 * `/mypage/posts` 의 URL 쿼리 상태(PRD 4 절).
 *
 * 탭이 없는 화면이다 — 목업(`작성한 사이드 프로젝트 스터디 모집글.png`) 에 탭 줄이 없고,
 * `listMyRecruitmentPosts` 도 한 목록만 준다. 그래서 주소에 들어가는 것은 페이지뿐이다.
 * 필터는 1.5 에서 더한다.
 */
export interface MyPostsQuery {
  page: number;
}

export const DEFAULT_MY_POSTS_QUERY: MyPostsQuery = { page: 1 };

/** 기본값은 주소에서 뺀다. 목록 화면 넷이 하는 것과 같다. */
export function buildMyPostsHref(
  base: MyPostsQuery,
  overrides: Partial<MyPostsQuery> = {},
): string {
  const merged: MyPostsQuery = { ...base, ...overrides };

  const params = new URLSearchParams();
  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }

  const search = params.toString();
  return search ? `/mypage/posts?${search}` : '/mypage/posts';
}

/** 주소의 문자열을 그대로 믿지 않는다. */
export function parseMyPostsQuery(
  searchParams: Record<string, string | undefined>,
): MyPostsQuery {
  const page = Number(searchParams.page);
  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_MY_POSTS_QUERY.page,
  };
}
