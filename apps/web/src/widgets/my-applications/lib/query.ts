import type {
  ListMyRecruitmentApplicationsApplicationStatus,
  ListMyRecruitmentApplicationsRecruitmentStatus,
  ListMyRecruitmentApplicationsRecruitmentType,
  ListMyRecruitmentApplicationsSort,
} from '@ogonggo/api';

/**
 * `/mypage/applications` 의 URL 쿼리 상태(PRD 3 절).
 *
 * 탭 셋 중 **사이드·스터디만 실연동**이고 나머지 둘은 하드코딩이다. 그래서 필터는 그 탭에만
 * 있다 — 하드코딩한 값을 거르는 드롭다운은 고장으로 읽힌다.
 */
export const MY_APPLICATION_TABS = ['jobs', 'bootcamps', 'side-studies'] as const;
export type MyApplicationTab = (typeof MY_APPLICATION_TABS)[number];

export interface MyApplicationsQuery {
  tab: MyApplicationTab;
  page: number;
  /** 사이드·스터디 탭 전용. `listMyRecruitmentApplications` 가 받는 다섯이다. */
  recruitmentStatus?: ListMyRecruitmentApplicationsRecruitmentStatus;
  recruitmentType?: ListMyRecruitmentApplicationsRecruitmentType;
  applicationStatus?: ListMyRecruitmentApplicationsApplicationStatus;
  keyword?: string;
  sort?: ListMyRecruitmentApplicationsSort;
}

export const DEFAULT_MY_APPLICATIONS_QUERY: MyApplicationsQuery = { tab: 'jobs', page: 1 };

/** 필터가 있는 탭은 사이드·스터디 하나뿐이다. */
const FILTER_KEYS = [
  'recruitmentStatus',
  'recruitmentType',
  'applicationStatus',
  'keyword',
  'sort',
] as const satisfies readonly (keyof MyApplicationsQuery)[];

export const RECRUITMENT_STATUSES: readonly ListMyRecruitmentApplicationsRecruitmentStatus[] = [
  'RECRUITING',
  'CLOSED',
];
export const RECRUITMENT_TYPES: readonly ListMyRecruitmentApplicationsRecruitmentType[] = [
  'SIDE_PROJECT',
  'STUDY',
];
export const APPLICATION_STATUSES: readonly ListMyRecruitmentApplicationsApplicationStatus[] = [
  'PREPARING',
  'COMPLETED',
  'IN_PROGRESS',
  'ENDED',
];
/** 생성 타입에 정렬 값이 `LATEST` 하나뿐이다. 목업의 `최근 저장순` 이 이것이다. */
export const SORTS: readonly ListMyRecruitmentApplicationsSort[] = ['LATEST'];

/** 지금 걸려 있는 필터가 있는가. 필터 줄의 `전체` 칩 색이 이걸로 갈린다. */
export function hasMyApplicationsFilter(query: MyApplicationsQuery): boolean {
  return FILTER_KEYS.some((key) => query[key] !== undefined);
}

/**
 * 기본값과 그 탭이 쓰지 않는 필터는 주소에서 뺀다. 탭을 옮기면 필터를 전부 지운다 —
 * `buildMyScrapsHref` 와 같은 이유다.
 */
export function buildMyApplicationsHref(
  base: MyApplicationsQuery,
  overrides: Partial<MyApplicationsQuery> = {},
): string {
  if (overrides.tab !== undefined && overrides.tab !== base.tab) {
    return buildMyApplicationsHref({ tab: overrides.tab, page: 1 });
  }

  const changedKeys = (Object.keys(overrides) as (keyof MyApplicationsQuery)[]).filter(
    (key) => key !== 'page' && overrides[key] !== base[key],
  );
  const merged: MyApplicationsQuery = {
    ...base,
    ...(changedKeys.length > 0 ? { page: 1 } : {}),
    ...overrides,
  };

  const params = new URLSearchParams();
  if (merged.tab !== DEFAULT_MY_APPLICATIONS_QUERY.tab) {
    params.set('tab', merged.tab);
  }
  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  if (merged.tab === 'side-studies') {
    for (const key of FILTER_KEYS) {
      const value = merged[key];
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
  }

  const search = params.toString();
  return search ? `/mypage/applications?${search}` : '/mypage/applications';
}

/** 필터를 전부 지운 주소. 필터 줄의 `전체` 칩이 간다. */
export function buildMyApplicationsResetHref(query: MyApplicationsQuery): string {
  return buildMyApplicationsHref({ tab: query.tab, page: 1 });
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
export function parseMyApplicationsQuery(
  searchParams: Record<string, string | undefined>,
): MyApplicationsQuery {
  const tab = pick(searchParams.tab, MY_APPLICATION_TABS) ?? DEFAULT_MY_APPLICATIONS_QUERY.tab;
  const page = Number(searchParams.page);
  const parsed: MyApplicationsQuery = {
    tab,
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_MY_APPLICATIONS_QUERY.page,
  };

  if (tab === 'side-studies') {
    parsed.recruitmentStatus = pick(searchParams.recruitmentStatus, RECRUITMENT_STATUSES);
    parsed.recruitmentType = pick(searchParams.recruitmentType, RECRUITMENT_TYPES);
    parsed.applicationStatus = pick(searchParams.applicationStatus, APPLICATION_STATUSES);
    parsed.keyword = pickKeyword(searchParams.keyword);
    parsed.sort = pick(searchParams.sort, SORTS);
  }

  return parsed;
}
