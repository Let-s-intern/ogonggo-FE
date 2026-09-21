import {
  listMyBootcamps,
  listMyJobs,
  type CompanyJobSummaryResponsePublicationStatus,
  type CompanyJobSummaryResponseReviewStatus,
  type PageInfo,
  type SuccessResponsePageResponseCompanyBootcampSummaryResponse,
  type SuccessResponsePageResponseCompanyJobSummaryResponse,
} from '@ogonggo/api';
import { OPERATION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import { getCompanyLogoUrl } from '@/entities/job/model/company-logo';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import { parseLocalDate } from '@/shared/lib/localDate';
import type { MyPageListRow } from '@/widgets/mypage-list';
import type { CompanyPostsQuery } from './query';

/** 한 페이지 건수. 마이페이지 표 넷과 같다. */
const PAGE_SIZE = 10;

/**
 * 표 한 행. 공통 부분은 `MyPageListRow` 가 갖고, 기업용 응답에만 있는 것을 더한다.
 *
 * **`publicationStatus`·`reviewStatus` 는 두 탭의 타입이 같은 문자열 유니온이다.** 생성
 * 타입이 `CompanyJobSummaryResponse...`·`CompanyBootcampSummaryResponse...` 로 갈려 있지만
 * 값이 같아 한쪽 이름으로 받는다 — 같은 열에 그리는 값이라 행 타입을 둘로 가르면 표도
 * 둘이 된다.
 */
export interface CompanyPostRow extends MyPageListRow {
  /** 삭제·마감이 쓰는 원본 id. 어느 경로로 부를지는 탭이 정한다(`mutate.ts`). */
  id: number;
  /**
   * 모집 인원. **채용공고에는 없다** — `CompanyJobSummaryResponse` 에 인원 필드가 없고
   * (`recruitmentHeadcount` 는 상세에만 있다), 부트캠프는 `capacity` 로 온다.
   */
  capacity?: number;
  recruitmentStartAt?: string;
  publicationStatus: CompanyJobSummaryResponsePublicationStatus;
  reviewStatus?: CompanyJobSummaryResponseReviewStatus;
}

export interface CompanyPostsPage {
  rows: CompanyPostRow[];
  pageInfo: PageInfo;
}

const emptyPage = (page: number): PageInfo => ({
  pageNum: page,
  pageSize: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
});

/** 메타 줄의 교육 기간. 표의 모집 기간 칸과 달리 요일·시각 없이 짧게 적는다. */
function formatProgramPeriod(startDate: string, endDate: string): string {
  const format = (value: string) => {
    const date = parseLocalDate(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}.${month}.${day}`;
  };
  return `교육 ${format(startDate)} ~ ${format(endDate)}`;
}

/**
 * 탭이 고른 API 를 부르고 응답을 표 행으로 옮긴다(v5 PRD 2 절).
 *
 * 응답 언랩은 마이페이지 목록 화면 넷과 같다 — 생성 타입은 `{ data, status, headers }` 를
 * 선언하지만 `httpClient` 는 응답 봉투를 그대로 준다.
 */
export async function fetchCompanyPosts(query: CompanyPostsQuery): Promise<CompanyPostsPage> {
  return query.tab === 'jobs' ? fetchJobs(query) : fetchBootcamps(query);
}

async function fetchJobs(query: CompanyPostsQuery): Promise<CompanyPostsPage> {
  const response = (await listMyJobs({
    page: query.page,
    size: PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseCompanyJobSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPage(query.page),
    rows: (page?.items ?? []).map((job) => ({
      id: job.id,
      key: `job-${job.id}`,
      // 게시된 공고에만 상세 화면이 있다. 초안·숨김·보관은 링크를 걸지 않는다 —
      // 눌러서 404 를 보여 주는 것이 "아직 공개되지 않았다" 를 말해 주지 않는다.
      href: job.publicationStatus === 'PUBLISHED' ? `/jobs/${job.id}` : undefined,
      thumbnailUrl: getCompanyLogoUrl(job.companyName),
      caption: job.companyName,
      title: job.title,
      // 목업의 `사이드 프로젝트 · 온라인 · 3개월` 자리다(task 1.1).
      meta: [
        EMPLOYMENT_TYPE_LABELS[job.employmentType],
        EXPERIENCE_TYPE_LABELS[job.experienceType],
        job.region,
      ].filter((part): part is string => Boolean(part)),
      recruitmentType: job.recruitmentType,
      recruitmentStartAt: job.recruitmentStartAt,
      recruitmentEndAt: job.recruitmentEndAt,
      closedAt: job.closedAt,
      publicationStatus: job.publicationStatus,
      reviewStatus: job.reviewStatus,
    })),
  };
}

async function fetchBootcamps(query: CompanyPostsQuery): Promise<CompanyPostsPage> {
  const response = (await listMyBootcamps({
    page: query.page,
    size: PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseCompanyBootcampSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPage(query.page),
    rows: (page?.items ?? []).map((bootcamp) => ({
      id: bootcamp.id,
      key: `bootcamp-${bootcamp.id}`,
      href: bootcamp.publicationStatus === 'PUBLISHED' ? `/bootcamps/${bootcamp.id}` : undefined,
      thumbnailUrl: bootcamp.representativeImageUrl,
      caption: bootcamp.companyName,
      title: bootcamp.title,
      // 부트캠프 탭은 프로그램 유형 · 진행 방식 · 교육 기간이다(task 1.1).
      meta: [
        bootcamp.programType,
        OPERATION_TYPE_LABELS[bootcamp.operationType],
        formatProgramPeriod(bootcamp.programStartDate, bootcamp.programEndDate),
      ].filter((part): part is string => Boolean(part)),
      recruitmentType: bootcamp.recruitmentType,
      recruitmentStartAt: bootcamp.recruitmentStartAt,
      recruitmentEndAt: bootcamp.recruitmentEndAt,
      closedAt: bootcamp.closedAt,
      capacity: bootcamp.capacity,
      publicationStatus: bootcamp.publicationStatus,
      reviewStatus: bootcamp.reviewStatus,
    })),
  };
}

/** 빈 목록·오류 문구에 그대로 나가는 탭 이름. */
export const TAB_NOUNS: Record<CompanyPostsQuery['tab'], string> = {
  jobs: '채용 공고',
  bootcamps: '교육 · 부트캠프',
};
