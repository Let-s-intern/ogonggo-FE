import {
  cancelMyRecruitmentPostBookmarkPreparation,
  listMyBootcampBookmarks,
  listMyJobBookmarks,
  listMyRecruitmentApplications,
  listMyRecruitmentPostBookmarks,
  prepareMyRecruitmentPostBookmark,
  replaceMyBootcampBookmarkApplicationStatus,
  replaceMyJobBookmarkApplicationStatus,
  updateRecruitmentPostApplicationStatus,
  type PageInfo,
  type SuccessResponsePageResponseRecruitmentPostSummaryResponse,
  type SuccessResponsePageResponseUserBootcampSummaryResponse,
  type SuccessResponsePageResponseUserJobSummaryResponse,
  type SuccessResponseRecruitmentApplicationPageResponse,
} from '@ogonggo/api';
import {
  OPERATION_TYPE_LABELS as BOOTCAMP_OPERATION_TYPE_LABELS,
  TUITION_TYPE_LABELS,
} from '@/entities/bootcamp/model/labels';
import { getCompanyLogoUrl } from '@/entities/job/model/company-logo';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import {
  AUTHOR_NICKNAME_FALLBACK,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
} from '@/entities/side-study/model/labels';
import type { ApplicationBoardTab, ApplicationStageId } from '../model/stages';

/** 칸 하나에 놓이는 카드 한 장. 리스트 뷰의 행도 같은 값을 쓴다. */
export interface ApplicationBoardItem {
  /** 공고·부트캠프·모집글의 id. 단계를 옮길 때 경로에 넣는 값이 이것이다. */
  id: number;
  key: string;
  href: string;
  thumbnailUrl?: string;
  /** 제목 위 작은 줄. 회사명 또는 모집글 작성자다. */
  caption: string;
  title: string;
  /** 제목 아래 줄. 화면에서 가운뎃점으로 이어진다. */
  meta: string[];
  recruitmentType: 'PERIOD' | 'ALWAYS_OPEN';
  recruitmentEndAt?: string;
  closedAt?: string;
  /**
   * 활동 기간. 리스트 보기의 활동 단계 행이 마감일시 대신 이것을 그린다(PRD "리스트 보기").
   *
   * **부트캠프에만 있다.** `UserBootcampSummaryResponse` 의 `programStartDate`·`programEndDate`
   * 가 그것이고, 사이드·스터디 지원 이력(`RecruitmentApplicationItemResponse`) 에는 대응하는
   * 칸이 없다 — 있는 것은 `activityDurationMonths`(`3개월`) 뿐이라 이미 `meta` 에 들어가 있다.
   * 채용공고에는 활동 단계 자체가 없다.
   */
  activityStartDate?: string;
  activityEndDate?: string;
}

export interface ApplicationBoardPage {
  items: ApplicationBoardItem[];
  pageInfo: PageInfo;
}

/**
 * 필터 줄이 거는 값(PRD "필터 줄").
 *
 * **`applicationStatus` 는 여기 없다.** 그것은 칸 자체라 `fetchApplicationBoardPage` 의
 * `stageId` 로 들어간다. 필터 줄의 `지원 상태` 드롭다운은 어느 칸을 보일지를 고르는 것이므로
 * 요청이 아니라 화면에서 갈린다.
 */
export interface ApplicationBoardFilters {
  /** `마감 상태` 드롭다운. 부트캠프만 백엔드 파라미터 이름이 `status` 다. */
  recruitmentStatus?: 'RECRUITING' | 'CLOSED';
  /**
   * `공고 검색`.
   *
   * task 파일은 이 파라미터가 아직 없다고 적었지만 **생성 클라이언트의 세 목록 모두에 있다**
   * (BE `3467f4a`). 비활성으로 두지 않고 그대로 보낸다 —
   * `.claude/tasks/memos/결정-지원신청-관리-push1-2026-09-22.md` 1 절.
   */
  keyword?: string;
}

/**
 * 백엔드가 `keyword` 를 2~100자로 받는다. 범위를 벗어난 값은 없는 것으로 친다 —
 * 한 글자 쳤을 때 400 을 받는 것보다 안 거른 목록을 보이는 편이 낫다.
 */
function pickKeyword(keyword: string | undefined): string | undefined {
  const trimmed = keyword?.trim();
  return trimmed && trimmed.length >= 2 && trimmed.length <= 100 ? trimmed : undefined;
}

export interface ApplicationBoardPageParams extends ApplicationBoardFilters {
  page: number;
  size: number;
}

/**
 * 한 탭의 한 단계를 한 페이지 부른다(PRD "탭 셋이 각각 자기 단계로 그려진다").
 *
 * **단계 하나가 요청 하나다.** 목록 응답의 아이템에 단계 칸이 없어 한 번 불러 나눌 수 없다 —
 * `UserJobSummaryResponse`·`UserBootcampSummaryResponse`·`RecruitmentPostSummaryResponse`
 * 어디에도 `applicationStatus` 가 없다. 칸마다 `더보기` 가 따로라 페이지도 어차피 칸별이다.
 * 근거는 `.claude/tasks/memos/결정-지원신청-관리-push1-2026-09-22.md` 3 절.
 *
 * **사이드·스터디만 출처가 둘이다.** `SCRAPPED` 는 북마크 목록이고 나머지 넷은 지원 이력
 * (`listMyRecruitmentApplications`) 이다. 백엔드에서 두 테이블이고
 * `RecruitmentPostBookmarkService.prepare()` 가 북마크를 지우며 지원 이력을 만든다.
 *
 * 응답 언랩은 목록 화면들과 같다 — 생성 타입은 `{ data, status, headers }` 를 선언하지만
 * `httpClient` 는 응답 봉투를 그대로 준다.
 */
export async function fetchApplicationBoardPage<Tab extends ApplicationBoardTab>(
  tab: Tab,
  stageId: ApplicationStageId<Tab>,
  params: ApplicationBoardPageParams,
): Promise<ApplicationBoardPage> {
  switch (tab) {
    case 'jobs':
      return fetchJobStage(stageId as ApplicationStageId<'jobs'>, params);
    case 'bootcamps':
      return fetchBootcampStage(stageId as ApplicationStageId<'bootcamps'>, params);
    default:
      return fetchSideStudyStage(stageId as ApplicationStageId<'side-studies'>, params);
  }
}

async function fetchJobStage(
  stageId: ApplicationStageId<'jobs'>,
  params: ApplicationBoardPageParams,
): Promise<ApplicationBoardPage> {
  const response = (await listMyJobBookmarks({
    page: params.page,
    size: params.size,
    applicationStatus: stageId,
    recruitmentStatus: params.recruitmentStatus,
    keyword: pickKeyword(params.keyword),
    sort: 'RECENTLY_SAVED',
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPageInfo(params),
    items: (page?.items ?? []).map((job) => ({
      id: job.id,
      key: `job-${job.id}`,
      href: `/jobs/${job.id}`,
      thumbnailUrl: getCompanyLogoUrl(job.companyName),
      caption: job.companyName,
      title: job.title,
      meta: [
        EMPLOYMENT_TYPE_LABELS[job.employmentType],
        EXPERIENCE_TYPE_LABELS[job.experienceType],
        job.region,
      ].filter((part): part is string => Boolean(part)),
      recruitmentType: job.recruitmentType,
      recruitmentEndAt: job.recruitmentEndAt,
      closedAt: job.closedAt,
    })),
  };
}

async function fetchBootcampStage(
  stageId: ApplicationStageId<'bootcamps'>,
  params: ApplicationBoardPageParams,
): Promise<ApplicationBoardPage> {
  /*
   * 부트캠프만 마감 상태의 파라미터 이름이 `status` 다. 생성 타입에는 `DRAFT` 도 있지만
   * 설명이 "RECRUITING 과 CLOSED 만 받으며 그 밖의 값은 400" 이라 필터 타입에서 뺐다.
   */
  const response = (await listMyBootcampBookmarks({
    page: params.page,
    size: params.size,
    applicationStatus: stageId,
    status: params.recruitmentStatus,
    keyword: pickKeyword(params.keyword),
    sort: 'RECENTLY_SAVED',
  })) as unknown as SuccessResponsePageResponseUserBootcampSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPageInfo(params),
    items: (page?.items ?? []).map((bootcamp) => ({
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
      activityStartDate: bootcamp.programStartDate,
      activityEndDate: bootcamp.programEndDate,
    })),
  };
}

async function fetchSideStudyStage(
  stageId: ApplicationStageId<'side-studies'>,
  params: ApplicationBoardPageParams,
): Promise<ApplicationBoardPage> {
  return stageId === 'SCRAPPED'
    ? fetchSideStudyBookmarks(params)
    : fetchSideStudyApplications(stageId, params);
}

async function fetchSideStudyBookmarks(
  params: ApplicationBoardPageParams,
): Promise<ApplicationBoardPage> {
  const response = (await listMyRecruitmentPostBookmarks({
    page: params.page,
    size: params.size,
    recruitmentStatus: params.recruitmentStatus,
    keyword: pickKeyword(params.keyword),
    sort: 'RECENTLY_SAVED',
  })) as unknown as SuccessResponsePageResponseRecruitmentPostSummaryResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPageInfo(params),
    items: (page?.items ?? []).map((post) => ({
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

async function fetchSideStudyApplications(
  stageId: Exclude<ApplicationStageId<'side-studies'>, 'SCRAPPED'>,
  params: ApplicationBoardPageParams,
): Promise<ApplicationBoardPage> {
  /* 지원 이력은 정렬 이름이 다르다 — 북마크의 `RECENTLY_SAVED` 에 해당하는 값이 `LATEST` 다. */
  const response = (await listMyRecruitmentApplications({
    page: params.page,
    size: params.size,
    applicationStatus: stageId,
    recruitmentStatus: params.recruitmentStatus,
    keyword: pickKeyword(params.keyword),
    sort: 'LATEST',
  })) as unknown as SuccessResponseRecruitmentApplicationPageResponse;

  const page = response.data;
  return {
    pageInfo: page?.pageInfo ?? emptyPageInfo(params),
    items: (page?.items ?? []).map((item) => ({
      id: item.postId,
      key: `post-${item.postId}`,
      href: `/side-studies/${item.postId}`,
      thumbnailUrl: item.author.profileImageUrl,
      caption: item.author.nickname ?? AUTHOR_NICKNAME_FALLBACK,
      title: item.title,
      meta: [
        KIND_LABELS[item.recruitmentType],
        OPERATION_TYPE_LABELS[item.progressMethod],
        `${item.activityDurationMonths}개월`,
      ],
      recruitmentType: 'PERIOD' as const,
      recruitmentEndAt: item.recruitmentEndDate,
      closedAt: item.recruitmentStatus === 'CLOSED' ? item.recruitmentEndDate : undefined,
    })),
  };
}

function emptyPageInfo(params: ApplicationBoardPageParams): PageInfo {
  return {
    pageNum: params.page,
    pageSize: params.size,
    totalElements: 0,
    totalPages: 0,
  };
}

/**
 * 한 건의 단계를 옮긴다.
 *
 * **채용공고·부트캠프는 호출 하나다.** `PUT .../application-status` 가 도착 단계를 그대로 받고,
 * 출발 단계가 무엇이든 상관하지 않는다(BE `9e80b9f` 이후). 그래서 `from` 도 쓰지 않는다.
 *
 * **사이드·스터디만 출발 단계를 본다.** 스크랩은 북마크 테이블이고 나머지 넷은 지원 이력이라
 * 같은 도착 단계라도 부를 것이 갈린다 — `스크랩 → 지원 준비 중` 은 `prepare`(북마크를 지우고
 * 이력을 만든다) 이고 `지원 완료 → 지원 준비 중` 은 이력 상태만 고치는 것이다.
 *
 * **부르기 전에 `canMoveStage` 로 막는다.** 여기서는 막지 않는다 — 막힌 전이를 요청하면
 * 백엔드가 409 를 주는데, 그 왕복은 누른 사람에게 아무것도 알려 주지 않는다.
 */
export async function moveApplicationStage(
  tab: ApplicationBoardTab,
  id: number,
  from: ApplicationStageId,
  to: ApplicationStageId,
): Promise<void> {
  switch (tab) {
    case 'jobs':
      await replaceMyJobBookmarkApplicationStatus(id, {
        applicationStatus: to as ApplicationStageId<'jobs'>,
      });
      return;
    case 'bootcamps':
      await replaceMyBootcampBookmarkApplicationStatus(id, {
        applicationStatus: to as ApplicationStageId<'bootcamps'>,
      });
      return;
    case 'side-studies':
      await moveSideStudyStage(
        id,
        from as ApplicationStageId<'side-studies'>,
        to as ApplicationStageId<'side-studies'>,
      );
      return;
  }
}

async function moveSideStudyStage(
  id: number,
  from: ApplicationStageId<'side-studies'>,
  to: ApplicationStageId<'side-studies'>,
): Promise<void> {
  if (to === 'SCRAPPED') {
    await cancelMyRecruitmentPostBookmarkPreparation(id);
    return;
  }
  if (from === 'SCRAPPED') {
    // 표가 스크랩에서 여는 도착 단계는 `지원 준비 중` 하나다(`stages.ts`).
    await prepareMyRecruitmentPostBookmark(id);
    return;
  }
  await updateRecruitmentPostApplicationStatus(id, { applicationStatus: to });
}
