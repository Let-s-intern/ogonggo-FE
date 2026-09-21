import {
  listMyRecruitmentApplications,
  type PageInfo,
  type RecruitmentApplicationItemResponseApplicationStatus,
  type SuccessResponseRecruitmentApplicationPageResponse,
} from '@ogonggo/api';
import {
  AUTHOR_NICKNAME_FALLBACK,
  KIND_LABELS,
  OPERATION_TYPE_LABELS,
} from '@/entities/side-study/model/labels';
import type { MyPageListRow } from '@/widgets/mypage-list';
import type { MyApplicationsQuery } from './query';

/** 한 페이지 건수. 스크랩 표와 같다. */
const PAGE_SIZE = 10;

/**
 * 표 한 행. 상태 셀렉트와 삭제가 쓸 것이 더 붙는다.
 *
 * `postId` 는 실연동 탭(사이드·스터디) 에만 있다. 하드코딩한 두 탭은 바꿀 곳도 지울 곳도 없어
 * 이 값이 없고, 그것이 그 행의 컨트롤을 비활성으로 그리는 근거다.
 */
export interface MyApplicationRow extends MyPageListRow {
  postId?: number;
  applicationStatus: string;
}

export interface MyApplicationsPage {
  rows: MyApplicationRow[];
  pageInfo: PageInfo;
  /** 사이드·스터디 탭의 건수 배지. 응답의 `countsByRecruitmentType` 에서 나온다. */
  count: number;
}

export type { RecruitmentApplicationItemResponseApplicationStatus };

/**
 * 사이드·스터디 지원 내역(PRD 3 절). `listMyRecruitmentApplications`
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
    applicationStatus: query.applicationStatus,
    keyword: query.keyword,
    sort: query.sort,
  })) as unknown as SuccessResponseRecruitmentApplicationPageResponse;

  const page = response.data;
  const counts = page?.countsByRecruitmentType ?? {};

  return {
    count: (counts.SIDE_PROJECT ?? 0) + (counts.STUDY ?? 0),
    pageInfo: page?.pageInfo ?? {
      pageNum: query.page,
      pageSize: PAGE_SIZE,
      totalElements: 0,
      totalPages: 0,
    },
    rows: (page?.items ?? []).map((item) => ({
      postId: item.postId,
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
