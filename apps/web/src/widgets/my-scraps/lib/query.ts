import type {
  ListMyBootcampBookmarksStatus,
  ListMyBootcampBookmarksTuitionType,
  ListMyJobBookmarksEmploymentType,
  ListMyJobBookmarksExperienceType,
} from '@ogonggo/api';

/**
 * `/mypage/scraps` 의 URL 쿼리 상태(PRD 2 절). 탭·필터·페이지가 전부 주소에 있다 — 목록
 * 화면 넷이 이미 그렇고, 그래야 뒤로가기와 새로고침이 보던 화면으로 돌아온다.
 */
export const MY_SCRAP_TABS = ['jobs', 'bootcamps', 'side-studies'] as const;
export type MyScrapTab = (typeof MY_SCRAP_TABS)[number];

export interface MyScrapsQuery {
  tab: MyScrapTab;
  page: number;
  /** 채용 공고 탭 전용. */
  employmentType?: ListMyJobBookmarksEmploymentType;
  experienceType?: ListMyJobBookmarksExperienceType;
  jobField?: string;
  jobRole?: string;
  /** 교육·부트캠프 탭 전용. */
  tuitionType?: ListMyBootcampBookmarksTuitionType;
  status?: ListMyBootcampBookmarksStatus;
  /** 두 탭이 함께 쓴다. 사이드·스터디 탭은 받지 않는다. */
  keyword?: string;
}

export const DEFAULT_MY_SCRAPS_QUERY: MyScrapsQuery = { tab: 'jobs', page: 1 };

/** 그 탭에서 실제로 쓰이는 필터 키. 탭을 옮기면 남은 값은 주소에서 지운다. */
const TAB_FILTER_KEYS = {
  jobs: ['employmentType', 'experienceType', 'jobField', 'jobRole', 'keyword'],
  bootcamps: ['tuitionType', 'status', 'keyword'],
  'side-studies': [],
} as const satisfies Record<MyScrapTab, readonly (keyof MyScrapsQuery)[]>;

/** 지금 탭에 걸려 있는 필터가 하나라도 있는가. 필터 줄의 `전체` 칩 색이 이걸로 갈린다. */
export function hasMyScrapsFilter(query: MyScrapsQuery): boolean {
  return TAB_FILTER_KEYS[query.tab].some((key) => query[key] !== undefined);
}

/**
 * 기본값(`tab=jobs`, `page=1`) 과 그 탭이 쓰지 않는 필터는 주소에서 뺀다 —
 * `buildSideStudyListHref` 와 같은 방식이다.
 *
 * 탭이나 필터가 바뀌면 `page` 를 1 로 되돌린다. 안 그러면 3 페이지에서 필터를 걸었을 때 결과가
 * 한 페이지뿐인데 3 페이지에 머물러 빈 표가 나온다.
 *
 * **탭을 옮기면 필터를 전부 지운다.** 탭마다 고를 수 있는 필터가 달라 셋 중 `keyword` 하나만
 * 따라가는데, 그러면 검색어를 지운 기억이 없는 사람이 빈 표를 보게 된다. 탭을 옮기는 것은
 * 다른 목록으로 가는 일이지 같은 목록을 좁히는 일이 아니다.
 */
export function buildMyScrapsHref(
  base: MyScrapsQuery,
  overrides: Partial<MyScrapsQuery> = {},
): string {
  if (overrides.tab !== undefined && overrides.tab !== base.tab) {
    return buildMyScrapsHref({ tab: overrides.tab, page: 1 });
  }

  const changedKeys = (Object.keys(overrides) as (keyof MyScrapsQuery)[]).filter(
    (key) => key !== 'page' && overrides[key] !== base[key],
  );
  const merged: MyScrapsQuery = {
    ...base,
    ...(changedKeys.length > 0 ? { page: 1 } : {}),
    ...overrides,
  };

  const params = new URLSearchParams();
  if (merged.tab !== DEFAULT_MY_SCRAPS_QUERY.tab) {
    params.set('tab', merged.tab);
  }
  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  for (const key of TAB_FILTER_KEYS[merged.tab]) {
    const value = merged[key];
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `/mypage/scraps?${search}` : '/mypage/scraps';
}

/** 그 탭의 필터를 전부 지운 주소. 필터 줄의 `전체` 칩이 간다. */
export function buildMyScrapsResetHref(query: MyScrapsQuery): string {
  return buildMyScrapsHref({ tab: query.tab, page: 1 });
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

const EMPLOYMENT_TYPES: readonly ListMyJobBookmarksEmploymentType[] = [
  'FULL_TIME',
  'CONTRACT',
  'INTERN',
  'PART_TIME',
  'ETC',
];
const EXPERIENCE_TYPES: readonly ListMyJobBookmarksExperienceType[] = [
  'NEWCOMER',
  'EXPERIENCED',
  'BOTH',
  'IRRELEVANT',
];
const TUITION_TYPES: readonly ListMyBootcampBookmarksTuitionType[] = [
  'FREE',
  'PAID',
  'GOVERNMENT_FUNDED',
];
/**
 * `DRAFT` 는 뺀다. 생성 타입에는 세 값이 있지만 설명이 "RECRUITING 과 CLOSED 만 받으며 그 밖의
 * 값은 400" 이라고 적고 있다(`listMyBootcampBookmarks`).
 */
const BOOTCAMP_STATUSES: readonly ListMyBootcampBookmarksStatus[] = ['RECRUITING', 'CLOSED'];

/** 백엔드가 `keyword` 를 2~100자로 받는다. 범위를 벗어난 값은 없는 것으로 친다. */
function pickKeyword(value: string | undefined): string | undefined {
  const keyword = value?.trim();
  return keyword && keyword.length >= 2 && keyword.length <= 100 ? keyword : undefined;
}

/** 주소의 문자열을 그대로 믿지 않고 아는 값만 통과시킨다. 탭이 쓰지 않는 필터도 버린다. */
export function parseMyScrapsQuery(
  searchParams: Record<string, string | undefined>,
): MyScrapsQuery {
  const tab = pick(searchParams.tab, MY_SCRAP_TABS) ?? DEFAULT_MY_SCRAPS_QUERY.tab;
  const page = Number(searchParams.page);
  const parsed: MyScrapsQuery = {
    tab,
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_MY_SCRAPS_QUERY.page,
  };

  const keys = TAB_FILTER_KEYS[tab] as readonly (keyof MyScrapsQuery)[];
  if (keys.includes('employmentType')) {
    parsed.employmentType = pick(searchParams.employmentType, EMPLOYMENT_TYPES);
    parsed.experienceType = pick(searchParams.experienceType, EXPERIENCE_TYPES);
    parsed.jobField = searchParams.jobField?.trim() || undefined;
    parsed.jobRole = searchParams.jobRole?.trim() || undefined;
  }
  if (keys.includes('tuitionType')) {
    parsed.tuitionType = pick(searchParams.tuitionType, TUITION_TYPES);
    parsed.status = pick(searchParams.status, BOOTCAMP_STATUSES);
  }
  if (keys.includes('keyword')) {
    parsed.keyword = pickKeyword(searchParams.keyword);
  }

  return parsed;
}

export { BOOTCAMP_STATUSES, EMPLOYMENT_TYPES, EXPERIENCE_TYPES, TUITION_TYPES };
