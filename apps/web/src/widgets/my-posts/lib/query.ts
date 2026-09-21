import type {
  ListMyRecruitmentPostsApplicationStatus,
  ListMyRecruitmentPostsRecruitmentStatus,
  ListMyRecruitmentPostsSort,
} from '@ogonggo/api';

/**
 * `/mypage/posts` 의 URL 쿼리 상태(PRD 4 절).
 *
 * 탭이 없는 화면이다 — 목업(`작성한 사이드 프로젝트 스터디 모집글.png`) 에 탭 줄이 없고,
 * `listMyRecruitmentPosts` 도 한 목록만 준다. 주소에 들어가는 것은 페이지와 필터 넷이다.
 */
export interface MyPostsQuery {
  page: number;
  recruitmentStatus?: ListMyRecruitmentPostsRecruitmentStatus;
  applicationStatus?: ListMyRecruitmentPostsApplicationStatus;
  keyword?: string;
  sort?: ListMyRecruitmentPostsSort;
}

export const DEFAULT_MY_POSTS_QUERY: MyPostsQuery = { page: 1 };

const FILTER_KEYS = [
  'recruitmentStatus',
  'applicationStatus',
  'keyword',
  'sort',
] as const satisfies readonly (keyof MyPostsQuery)[];

/** 모집 중인가 마감인가. 목업 필터 줄의 `마감 상태` 다. */
export const RECRUITMENT_STATUSES: readonly ListMyRecruitmentPostsRecruitmentStatus[] = [
  'RECRUITING',
  'CLOSED',
];

/**
 * 지원자가 있는 글인가 없는 글인가.
 *
 * 목업의 필터 이름은 `지원 상태` 인데 **문구를 백엔드 값에 맞춘다**(PRD 4 절 결정).
 * `applicationStatus` 의 두 값은 `HAS_APPLICATIONS`·`NO_APPLICATIONS` 이고, 이 화면은 내가
 * 쓴 글 목록이라 남의 지원 진행 단계를 거를 일이 없다 — 거르는 것은 "지원자가 붙었는가" 다.
 */
export const APPLICATION_STATUSES: readonly ListMyRecruitmentPostsApplicationStatus[] = [
  'HAS_APPLICATIONS',
  'NO_APPLICATIONS',
];

/** 생성 타입에 정렬 값이 `LATEST_SAVED` 하나뿐이다. 목업의 `최근 저장순` 이 이것이다. */
export const SORTS: readonly ListMyRecruitmentPostsSort[] = ['LATEST_SAVED'];

/** 지금 걸려 있는 필터가 있는가. 필터 줄의 `전체` 칩 색이 이걸로 갈린다. */
export function hasMyPostsFilter(query: MyPostsQuery): boolean {
  return FILTER_KEYS.some((key) => query[key] !== undefined);
}

/** 기본값은 주소에서 뺀다. 필터를 바꾸면 1 페이지로 돌아간다 — 목록 화면 넷과 같다. */
export function buildMyPostsHref(base: MyPostsQuery, overrides: Partial<MyPostsQuery> = {}): string {
  const changedKeys = (Object.keys(overrides) as (keyof MyPostsQuery)[]).filter(
    (key) => key !== 'page' && overrides[key] !== base[key],
  );
  const merged: MyPostsQuery = {
    ...base,
    ...(changedKeys.length > 0 ? { page: 1 } : {}),
    ...overrides,
  };

  const params = new URLSearchParams();
  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  for (const key of FILTER_KEYS) {
    const value = merged[key];
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `/mypage/posts?${search}` : '/mypage/posts';
}

/** 필터를 전부 지운 주소. 필터 줄의 `전체` 칩이 간다. */
export function buildMyPostsResetHref(): string {
  return buildMyPostsHref(DEFAULT_MY_POSTS_QUERY);
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

/** 백엔드가 `keyword` 를 2~100자로 받는다. 범위를 벗어난 값은 없는 것으로 친다. */
function pickKeyword(value: string | undefined): string | undefined {
  const keyword = value?.trim();
  return keyword && keyword.length >= 2 && keyword.length <= 100 ? keyword : undefined;
}

/** 주소의 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. */
export function parseMyPostsQuery(searchParams: Record<string, string | undefined>): MyPostsQuery {
  const page = Number(searchParams.page);
  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_MY_POSTS_QUERY.page,
    recruitmentStatus: pick(searchParams.recruitmentStatus, RECRUITMENT_STATUSES),
    applicationStatus: pick(searchParams.applicationStatus, APPLICATION_STATUSES),
    keyword: pickKeyword(searchParams.keyword),
    sort: pick(searchParams.sort, SORTS),
  };
}
