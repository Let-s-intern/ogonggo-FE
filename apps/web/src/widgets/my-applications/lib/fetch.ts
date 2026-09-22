import {
  listMyRecruitmentApplications,
  type PageInfo,
  type ListMyRecruitmentApplicationsApplicationStatus,
  type SuccessResponseRecruitmentApplicationPageResponse,
} from '@ogonggo/api';
import { fetchApplicationBoardPage, type ApplicationStageId } from '@/features/application-board';
import {
  AUTHOR_NICKNAME_FALLBACK,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
} from '@/entities/side-study/model/labels';
import type { MyPageListRow } from '@/widgets/mypage-list';
import type { BookmarkApplicationTab, MyApplicationsQuery } from './query';

/** 한 페이지 건수. 스크랩 표와 같다. */
const PAGE_SIZE = 10;

/**
 * 표 한 행. 상태 셀렉트와 삭제가 쓸 것이 더 붙는다.
 *
 * `id` 는 단계를 옮기거나 지울 때 경로에 넣는 값이다 — 탭에 따라 공고·부트캠프·모집글의 id 다.
 */
export interface MyApplicationRow extends MyPageListRow {
  id: number;
  applicationStatus: ApplicationStageId;
}

export interface MyApplicationsPage {
  rows: MyApplicationRow[];
  pageInfo: PageInfo;
  /**
   * 탭 옆 건수 배지. **사이드·스터디 탭에만 있다** — 응답의 `countsByRecruitmentType` 이
   * 그 탭 전용이고, 북마크 두 탭에는 필터와 무관한 전체 건수를 주는 응답이 없다.
   */
  count?: number;
}

/**
 * 사이드·스터디 지원 내역. `listMyRecruitmentApplications`
 * (`GET /api/v1/me/recruitment-applications`) 하나로 그린다.
 *
 * 탭의 건수는 `countsByRecruitmentType` 에서 나오는데, 그 맵의 키는 탭이 아니라 **모집 구분**
 * (`SIDE_PROJECT`, `STUDY`) 이다. 사이드·스터디 탭 하나가 두 구분을 다 담으므로 둘을 더한다.
 * 키를 훑어 전부 더하지 않고 아는 둘만 더하는 이유는, 백엔드가 나중에 `TOTAL` 같은 키를
 * 덧붙이면 건수가 두 배가 되기 때문이다.
 *
 * `pageInfo.totalElements` 를 쓰지 않는 이유는 그 값이 필터를 건 뒤의 수라서다. 탭 옆 배지는
 * 필터와 무관한 전체 건수여야 한다.
 */
export async function fetchMyApplications(query: MyApplicationsQuery): Promise<MyApplicationsPage> {
  const response = (await listMyRecruitmentApplications({
    page: query.page,
    size: PAGE_SIZE,
    recruitmentStatus: query.recruitmentStatus,
    recruitmentType: query.recruitmentType,
    applicationStatus: sideStudyStatus(query.applicationStatus),
    keyword: query.keyword,
    sort: query.sort,
  })) as unknown as SuccessResponseRecruitmentApplicationPageResponse;

  const page = response.data;
  const counts = page?.countsByRecruitmentType ?? {};

  return {
    count: (counts.SIDE_PROJECT ?? 0) + (counts.STUDY ?? 0),
    pageInfo: page?.pageInfo ?? emptyPageInfo(query.page),
    rows: (page?.items ?? []).map((item) => ({
      id: item.postId,
      key: `application-${item.postId}`,
      href: `/side-studies/${item.postId}`,
      thumbnailUrl: item.author.profileImageUrl,
      caption: item.author.nickname ?? AUTHOR_NICKNAME_FALLBACK,
      title: item.title,
      meta: [
        KIND_LABELS[item.recruitmentType],
        OPERATION_TYPE_LABELS[item.progressMethod],
        `${item.activityDurationMonths}개월`,
      ],
      // 모집글은 상시 모집이 없다. 마감일이 늘 있어 `PERIOD` 로 고정이다.
      recruitmentType: 'PERIOD' as const,
      recruitmentEndAt: item.recruitmentEndDate,
      closedAt: item.recruitmentStatus === 'CLOSED' ? item.recruitmentEndDate : undefined,
      applicationStatus: item.applicationStatus,
    })),
  };
}

/**
 * 채용공고·교육 부트캠프 탭의 한 단계 한 쪽(PRD "셋 다 실연동이다").
 *
 * 목록을 부르는 일은 칸반과 같은 `fetchApplicationBoardPage` 가 한다 — 같은 북마크 목록을 두
 * 화면이 보는 것이라 부르는 곳이 갈리면 한쪽만 고쳐지는 날이 온다.
 *
 * **행의 단계는 요청한 단계다.** 응답 아이템에 `applicationStatus` 가 없어 되읽을 수 없고, 한
 * 요청이 한 단계만 담으므로 요청한 값이 곧 그 행의 단계다(`query.ts` 의 `DEFAULT_STAGE`).
 */
export async function fetchMyBookmarkApplications(
  tab: BookmarkApplicationTab,
  stage: ApplicationStageId,
  query: MyApplicationsQuery,
): Promise<MyApplicationsPage> {
  const params = {
    page: query.page,
    size: PAGE_SIZE,
    recruitmentStatus: query.recruitmentStatus,
    keyword: query.keyword,
  };
  /*
   * 단계 값은 `parseMyApplicationsQuery` 가 그 탭의 것만 통과시키는데 `tab` 이 유니온이라
   * 타입으로는 좁혀지지 않는다. `applicationBoardApi.ts` 의 같은 분기와 같은 방식이다.
   */
  const page =
    tab === 'jobs'
      ? await fetchApplicationBoardPage('jobs', stage as ApplicationStageId<'jobs'>, params)
      : await fetchApplicationBoardPage(
          'bootcamps',
          stage as ApplicationStageId<'bootcamps'>,
          params,
        );

  return {
    pageInfo: page.pageInfo,
    rows: page.items.map((item) => ({
      id: item.id,
      key: item.key,
      href: item.href,
      thumbnailUrl: item.thumbnailUrl,
      caption: item.caption,
      title: item.title,
      meta: item.meta,
      recruitmentType: item.recruitmentType,
      recruitmentEndAt: item.recruitmentEndAt,
      closedAt: item.closedAt,
      applicationStatus: stage,
    })),
  };
}

/** 사이드·스터디 지원 이력이 받는 네 단계인가. 그 탭의 단계에서 `스크랩` 만 빠진 것이다. */
function sideStudyStatus(
  stage: ApplicationStageId | undefined,
): ListMyRecruitmentApplicationsApplicationStatus | undefined {
  return stage === 'PREPARING' ||
    stage === 'COMPLETED' ||
    stage === 'IN_PROGRESS' ||
    stage === 'ENDED'
    ? stage
    : undefined;
}

function emptyPageInfo(page: number): PageInfo {
  return { pageNum: page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 };
}
