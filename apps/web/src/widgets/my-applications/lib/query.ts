import type {
  ListMyRecruitmentApplicationsRecruitmentStatus,
  ListMyRecruitmentApplicationsRecruitmentType,
  ListMyRecruitmentApplicationsSort,
} from '@ogonggo/api';
import {
  stagesOf,
  type ApplicationStage,
  type ApplicationStageId,
} from '@/features/application-board';

/**
 * `/mypage/applications`(`신청 현황`) 의 URL 쿼리 상태.
 *
 * **세 탭이 모두 실연동이다.** v4 때 채용공고·부트캠프 탭을 채우던 하드코딩은 v7 에서 지웠다 —
 * 북마크가 단계를 갖게 되면서 되읽을 곳이 생겼다(PRD "백엔드는 이미 있다").
 */
export const MY_APPLICATION_TABS = ['jobs', 'bootcamps', 'side-studies'] as const;
export type MyApplicationTab = (typeof MY_APPLICATION_TABS)[number];

/** 북마크에서 단계를 읽는 두 탭. 사이드·스터디만 지원 이력이 따로 있다. */
export type BookmarkApplicationTab = Exclude<MyApplicationTab, 'side-studies'>;

export interface MyApplicationsQuery {
  tab: MyApplicationTab;
  page: number;
  recruitmentStatus?: ListMyRecruitmentApplicationsRecruitmentStatus;
  /** 사이드 프로젝트인지 스터디인지. 그 둘을 한 탭에 담는 사이드·스터디 탭 전용이다. */
  recruitmentType?: ListMyRecruitmentApplicationsRecruitmentType;
  /** `지원 상태` 드롭다운. 값은 탭마다 다르다(`stagesOf`). */
  applicationStatus?: ApplicationStageId;
  keyword?: string;
  /** 사이드·스터디 탭 전용. 북마크 목록은 정렬이 `RECENTLY_SAVED` 하나뿐이라 고를 것이 없다. */
  sort?: ListMyRecruitmentApplicationsSort;
}

export const DEFAULT_MY_APPLICATIONS_QUERY: MyApplicationsQuery = { tab: 'jobs', page: 1 };

/**
 * 아무것도 고르지 않았을 때 그리는 단계.
 *
 * **북마크 두 탭은 한 번에 한 단계만 그릴 수 있다.** 북마크 목록 응답에 `applicationStatus`
 * 가 없어(`UserJobSummaryResponse`·`UserBootcampSummaryResponse`) 여러 단계를 섞어 받으면
 * 어느 행이 어느 단계인지 알 수 없다 — 단계가 곧 요청 파라미터다. 그래서 첫 화면은
 * `지원 준비 중`(부트캠프는 `신청 전`) 이고, 다른 단계는 `지원 상태` 에서 고른다.
 *
 * 사이드·스터디는 `undefined` 다. 지원 이력 응답(`RecruitmentApplicationItemResponse`) 에는
 * 행마다 `applicationStatus` 가 있어 네 단계를 섞어 그릴 수 있다.
 */
const DEFAULT_STAGE: Record<MyApplicationTab, ApplicationStageId | undefined> = {
  jobs: 'PREPARING',
  bootcamps: 'PREPARING',
  'side-studies': undefined,
};

/** 지금 그리는 단계. 북마크 두 탭은 언제나 값이 있고 사이드·스터디는 고른 때만 있다. */
export function stageOf(query: MyApplicationsQuery): ApplicationStageId | undefined {
  return query.applicationStatus ?? DEFAULT_STAGE[query.tab];
}

/**
 * `지원 상태` 드롭다운에 올릴 단계. 그 탭의 단계에서 `스크랩` 만 뺀다 — 스크랩은 지원 상태가
 * 아니라 그 앞이고, 그 목록은 `스크랩한 공고`(`/mypage/scraps`) 화면이 그린다.
 */
export function applicationStagesOf(
  tab: MyApplicationTab,
): readonly ApplicationStage<ApplicationStageId>[] {
  const stages: readonly ApplicationStage<ApplicationStageId>[] = stagesOf(tab);
  return stages.filter((stage) => stage.id !== 'SCRAPPED');
}

/** 탭마다 쓸 수 있는 필터가 다르다. 사이드·스터디만 모집 구분과 정렬이 있다. */
function filterKeysFor(tab: MyApplicationTab): readonly (keyof MyApplicationsQuery)[] {
  return tab === 'side-studies'
    ? ['recruitmentStatus', 'recruitmentType', 'applicationStatus', 'keyword', 'sort']
    : ['recruitmentStatus', 'applicationStatus', 'keyword'];
}

export const RECRUITMENT_STATUSES: readonly ListMyRecruitmentApplicationsRecruitmentStatus[] = [
  'RECRUITING',
  'CLOSED',
];
export const RECRUITMENT_TYPES: readonly ListMyRecruitmentApplicationsRecruitmentType[] = [
  'SIDE_PROJECT',
  'STUDY',
];
/** 생성 타입에 정렬 값이 `LATEST` 하나뿐이다. 목업의 `최근 저장순` 이 이것이다. */
export const SORTS: readonly ListMyRecruitmentApplicationsSort[] = ['LATEST'];

/** 지금 걸려 있는 필터가 있는가. 필터 줄의 `전체` 칩 색이 이걸로 갈린다. */
export function hasMyApplicationsFilter(query: MyApplicationsQuery): boolean {
  return filterKeysFor(query.tab).some((key) => query[key] !== undefined);
}

/**
 * 기본값과 그 탭이 쓰지 않는 필터는 주소에서 뺀다. 탭을 옮기면 필터를 전부 지운다 —
 * 단계 값이 탭마다 달라 그대로 들고 가면 없는 단계를 고른 주소가 된다.
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
  for (const key of filterKeysFor(merged.tab)) {
    const value = merged[key];
    if (value !== undefined) {
      params.set(key, String(value));
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

/**
 * 주소의 문자열을 그대로 믿지 않고 아는 값만 통과시킨다.
 *
 * `applicationStatus` 는 **그 탭의 단계 목록에 있는 값만** 받는다. 탭마다 단계가 달라,
 * 부트캠프의 `IN_PROGRESS` 를 채용공고 탭 주소에 적으면 백엔드가 400 을 준다.
 */
export function parseMyApplicationsQuery(
  searchParams: Record<string, string | undefined>,
): MyApplicationsQuery {
  const tab = pick(searchParams.tab, MY_APPLICATION_TABS) ?? DEFAULT_MY_APPLICATIONS_QUERY.tab;
  const page = Number(searchParams.page);
  const stageIds = applicationStagesOf(tab).map((stage) => stage.id);
  const parsed: MyApplicationsQuery = {
    tab,
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_MY_APPLICATIONS_QUERY.page,
    recruitmentStatus: pick(searchParams.recruitmentStatus, RECRUITMENT_STATUSES),
    applicationStatus: pick(searchParams.applicationStatus, stageIds),
    keyword: pickKeyword(searchParams.keyword),
  };

  if (tab === 'side-studies') {
    parsed.recruitmentType = pick(searchParams.recruitmentType, RECRUITMENT_TYPES);
    parsed.sort = pick(searchParams.sort, SORTS);
  }

  return parsed;
}
