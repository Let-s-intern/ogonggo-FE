import type {
  PageInfo,
  RecruitmentPostManagementItemResponseRecruitmentStatus,
  RecruitmentPostManagementItemResponseStatus,
} from '@ogonggo/api';
import { fetchMyPosts as fetchPage } from '@/entities/side-study/api/myRecruitmentPosts';
import { KIND_LABELS, OPERATION_TYPE_LABELS } from '@/entities/side-study/model/labels';
import type { MyPostsQuery } from './query';

/** 한 페이지 건수. 지원 내역·스크랩 표와 같다. */
const PAGE_SIZE = 10;

/**
 * 표 한 줄. `MyPageListRow` 를 쓰지 않는다 — 그 모양은 썸네일과 작성자 줄(`caption`) 을
 * 전제하는데, 이 표의 첫 칸에는 둘 다 없다(내가 쓴 글이라 작성자가 나 하나고, 목업에도
 * 썸네일이 없다). `RecruitmentPostManagementItemResponse` 에도 그 두 값이 없다.
 */
export interface MyPostRow {
  postId: number;
  title: string;
  /** 제목 아래 줄. 가운뎃점으로 잇는다. 임시저장 글은 비어 있을 수 있다. */
  meta: string[];
  status: RecruitmentPostManagementItemResponseStatus;
  /** 임시저장 글은 `undefined` 다(생성 타입 설명: `DRAFT` 의 `recruitmentStatus` 는 `null`). */
  recruitmentStatus?: RecruitmentPostManagementItemResponseRecruitmentStatus;
  recruitmentStartDate?: string;
  recruitmentEndDate?: string;
  capacity?: number;
  applicationCount: number;
  viewCount: number;
  /** 임시저장 글이면 `true`. 버튼 문구가 `이어서 작성하기` 로 갈린다. */
  continueWriting: boolean;
}

export interface MyPostsPage {
  rows: MyPostRow[];
  pageInfo: PageInfo;
}

/**
 * 작성한 모집글 목록(PRD 4 절). `listMyRecruitmentPosts` 하나로 그린다.
 *
 * 값을 화면에서 바로 쓸 모양으로 옮기는 것만 한다 — 인원·기간·조회수를 `-` 로 그릴지는
 * 행 컴포넌트가 `status` 를 보고 정한다.
 */
export async function fetchMyPostsPage(query: MyPostsQuery): Promise<MyPostsPage> {
  const page = await fetchPage({ page: query.page, size: PAGE_SIZE });

  return {
    pageInfo: page?.pageInfo ?? {
      pageNum: query.page,
      pageSize: PAGE_SIZE,
      totalElements: 0,
      totalPages: 0,
    },
    rows: (page?.items ?? []).map((item) => ({
      postId: item.postId,
      title: item.title,
      meta: [
        item.recruitmentType ? KIND_LABELS[item.recruitmentType] : undefined,
        item.progressMethod ? OPERATION_TYPE_LABELS[item.progressMethod] : undefined,
        item.activityDurationMonths ? `${item.activityDurationMonths}개월` : undefined,
      ].filter((value): value is string => value !== undefined),
      status: item.status,
      recruitmentStatus: item.recruitmentStatus,
      recruitmentStartDate: item.recruitmentStartDate,
      recruitmentEndDate: item.recruitmentEndDate,
      capacity: item.capacity,
      applicationCount: item.applicationCount,
      viewCount: item.viewCount,
      continueWriting: item.continueWriting,
    })),
  };
}
