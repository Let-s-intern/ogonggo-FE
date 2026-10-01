import {
  listMyBootcampBookmarks,
  listMyJobBookmarks,
  listMyRecruitmentPostBookmarks,
  type PageInfo,
  type SuccessResponsePageResponseRecruitmentPostSummaryResponse,
  type SuccessResponsePageResponseUserBootcampSummaryResponse,
  type SuccessResponsePageResponseUserJobSummaryResponse,
} from '@ogonggo/api';
import { toJobInfo } from '@/entities/job/model/analytics';
import { getCompanyLogoUrl } from '@/entities/job/model/company-logo';
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
  formatRegion,
} from '@/entities/job/model/labels';
import {
  OPERATION_TYPE_LABELS as BOOTCAMP_OPERATION_TYPE_LABELS,
  TUITION_TYPE_LABELS,
} from '@/entities/bootcamp/model/labels';
import {
  AUTHOR_NICKNAME_FALLBACK,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
} from '@/entities/side-study/model/labels';
import type { DataLayerParams } from '@/shared/analytics/dataLayer';
import type { MyPageListRow } from '@/widgets/mypage-list';
import type { MyScrapsQuery, MyScrapTab } from './query';

/** 한 페이지 건수. 표가 한 화면에 들어가는 수다(목업의 행 높이 기준). */
const PAGE_SIZE = 10;

/**
 * 표 한 행. 공통 부분은 `MyPageListRow` 가 갖고, 스크랩 해제에 쓸 원본 id 만 더한다 —
 * 해제 경로는 탭이 정한다(`unbookmark.ts`).
 */
export interface MyScrapRow extends MyPageListRow {
  id: number;
  /** 채용공고 탭만 있다. 제목·해제를 누를 때 GTM 이벤트에 싣는 공고 정보(`toJobInfo`). */
  jobInfo?: DataLayerParams;
}

export interface MyScrapsPage {
  rows: MyScrapRow[];
  pageInfo: PageInfo;
}

const emptyPage = (page: number): PageInfo => ({
  pageNum: page,
  pageSize: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
});

/**
 * 탭이 고른 API 를 부르고 응답을 표 행으로 옮긴다(PRD 2 절).
 *
 * 응답 언랩은 목록 화면 넷과 같다 — 생성 타입은 `{ data, status, headers }` 를 선언하지만
 * `httpClient` 는 응답 봉투를 그대로 준다.
 */
export async function fetchMyScraps(query: MyScrapsQuery): Promise<MyScrapsPage> {
  switch (query.tab) {
    case 'jobs':
      return fetchJobScraps(query);
    case 'bootcamps':
      return fetchBootcampScraps(query);
    case 'side-studies':
      return fetchSideStudyScraps(query);
  }
}

async function fetchJobScraps(query: MyScrapsQuery): Promise<MyScrapsPage> {
  const response = (await listMyJobBookmarks({
    page: query.page,
    size: PAGE_SIZE,
    employmentType: query.employmentType,
    experienceType: query.experienceType,
    jobField: query.jobField,
    // 직무는 여러 개를 받게 바뀌었다(LC-3393). 이 화면은 하나만 고른다.
    jobRole: query.jobRole ? [query.jobRole] : undefined,
    keyword: query.keyword,
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPage(query.page),
    rows: (page?.items ?? []).map((job) => ({
      id: job.id,
      key: `job-${job.id}`,
      href: `/jobs/${job.id}`,
      thumbnailUrl: [job.coverImageUrl, job.logoUrl, getCompanyLogoUrl(job.companyName)],
      caption: job.companyName,
      title: job.title,
      meta: [
        EMPLOYMENT_TYPE_LABELS[job.employmentType],
        EXPERIENCE_TYPE_LABELS[job.experienceType],
        formatRegion(job.region),
      ].filter((part): part is string => Boolean(part)),
      recruitmentType: job.recruitmentType,
      recruitmentEndAt: job.recruitmentEndAt,
      closedAt: job.closedAt,
      jobInfo: toJobInfo(job),
    })),
  };
}

async function fetchBootcampScraps(query: MyScrapsQuery): Promise<MyScrapsPage> {
  const response = (await listMyBootcampBookmarks({
    page: query.page,
    size: PAGE_SIZE,
    category: query.category,
    keyword: query.keyword,
  })) as unknown as SuccessResponsePageResponseUserBootcampSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPage(query.page),
    rows: (page?.items ?? []).map((bootcamp) => ({
      id: bootcamp.id,
      key: `bootcamp-${bootcamp.id}`,
      href: `/bootcamps/${bootcamp.id}`,
      thumbnailUrl: bootcamp.representativeImageUrl,
      caption: bootcamp.companyName,
      title: bootcamp.title,
      meta: [
        bootcamp.programType,
        BOOTCAMP_OPERATION_TYPE_LABELS[bootcamp.operationType],
        TUITION_TYPE_LABELS[bootcamp.tuitionType],
      ].filter((part): part is string => Boolean(part)),
      recruitmentType: bootcamp.recruitmentType,
      recruitmentEndAt: bootcamp.recruitmentEndAt,
      closedAt: bootcamp.closedAt,
    })),
  };
}

async function fetchSideStudyScraps(query: MyScrapsQuery): Promise<MyScrapsPage> {
  const response = (await listMyRecruitmentPostBookmarks({
    page: query.page,
    size: PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseRecruitmentPostSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPage(query.page),
    rows: (page?.items ?? []).map((post) => ({
      id: post.id,
      key: `post-${post.id}`,
      href: `/side-studies/${post.id}`,
      thumbnailUrl: post.author.profileImageUrl,
      caption: post.author.nickname ?? AUTHOR_NICKNAME_FALLBACK,
      title: post.title,
      meta: [
        KIND_LABELS[post.recruitmentType],
        OPERATION_TYPE_LABELS[post.progressMethod],
        `${post.activityDurationMonths}개월`,
      ],
      // 모집글은 상시 모집이 없다. 마감일이 늘 있어 `PERIOD` 로 고정이다.
      recruitmentType: 'PERIOD' as const,
      recruitmentEndAt: post.recruitmentEndDate,
      closedAt: post.recruitmentStatus === 'CLOSED' ? post.recruitmentEndDate : undefined,
    })),
  };
}

/** 스크랩 해제 뒤 목록을 다시 읽을 때 쓰는 탭 이름. 로그·오류 문구에 그대로 나간다. */
export const TAB_NOUNS: Record<MyScrapTab, string> = {
  jobs: '채용 공고',
  bootcamps: '교육 · 부트캠프',
  'side-studies': '사이드 · 스터디',
};
