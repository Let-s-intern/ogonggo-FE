import {
  createBootcampBookmark,
  createJobBookmark,
  createRecruitmentPostBookmark,
  deleteBootcampBookmark,
  deleteJobBookmark,
  deleteRecruitmentPostBookmark,
  listMyBootcampBookmarks,
  listMyJobBookmarks,
  listMyRecruitmentPostBookmarks,
  type PageInfo,
  type SuccessResponsePageResponseRecruitmentPostSummaryResponse,
  type SuccessResponsePageResponseUserBootcampSummaryResponse,
  type SuccessResponsePageResponseUserJobSummaryResponse,
} from '@ogonggo/api';

/**
 * 북마크할 수 있는 세 종류. 이름은 스크랩 화면의 탭과 같다
 * (`widgets/my-scraps/lib/query.ts` 의 `MyScrapTab`) — 같은 것을 두 이름으로 부르면 토스트의
 * `보기` 가 어느 탭으로 가는지부터 헷갈린다. 기능은 위젯을 임포트하지 않으므로(`features/README.md`)
 * 값은 여기 따로 적는다. 둘이 어긋나면 `unbookmark.ts` 가 `MyScrapTab` 을 넘기는 자리에서 깨진다.
 */
export const BOOKMARK_KINDS = ['jobs', 'bootcamps', 'side-studies'] as const;
export type BookmarkKind = (typeof BOOKMARK_KINDS)[number];

/**
 * 종류별 등록·해제·내 목록 호출을 가르는 유일한 자리(PRD "한 곳에 모은다").
 *
 * **세 경로가 `/me/` 아래로 통일돼 있지 않다.** 채용공고와 부트캠프는
 * `POST/DELETE /api/v1/{job|bootcamp}-bookmarks/{id}` 인데 모집글은
 * `PUT/DELETE /api/v1/recruitment-posts/{postId}/bookmarks/me` 이고, 내 목록만 셋 다 다른
 * 컬렉션(`/api/v1/recruitment-post-bookmarks`) 이다. 백엔드가 그런 것이고 고치지 않는다 —
 * 부르는 쪽이 종류만 알면 되도록 이 파일이 전부 흡수한다.
 */

/** 등록. 이미 북마크돼 있으면 409 로 실패한다 — 그것을 성공으로 볼지는 부르는 쪽이 정한다. */
export async function createBookmark(kind: BookmarkKind, id: number): Promise<void> {
  switch (kind) {
    case 'jobs':
      await createJobBookmark(id);
      return;
    case 'bootcamps':
      await createBootcampBookmark(id);
      return;
    case 'side-studies':
      await createRecruitmentPostBookmark(id);
      return;
  }
}

/** 해제. 북마크가 없는 상태에서 불러도 오류가 아니다(백엔드가 멱등으로 처리한다). */
export async function deleteBookmark(kind: BookmarkKind, id: number): Promise<void> {
  switch (kind) {
    case 'jobs':
      await deleteJobBookmark(id);
      return;
    case 'bootcamps':
      await deleteBootcampBookmark(id);
      return;
    case 'side-studies':
      await deleteRecruitmentPostBookmark(id);
      return;
  }
}

/** 내 목록 한 페이지에서 뽑은 id 와, 다음 페이지가 있는지 판단할 페이지 정보. */
export interface MyBookmarkIdPage {
  ids: number[];
  pageInfo: PageInfo;
}

/**
 * 내 목록 한 페이지를 부르고 id 만 남긴다.
 *
 * **필터 파라미터를 받지 않는다.** 이 응답은 화면에 그릴 목록이 아니라 "내가 북마크한 것" 의
 * 전부여야 한다. 필터를 걸면 그 조건에서 빠진 북마크가 목록·상세에서 빈 아이콘이 된다.
 *
 * 응답 언랩은 스크랩 화면과 같다(`widgets/my-scraps/lib/fetch.ts`) — 생성 타입은
 * `{ data, status, headers }` 를 선언하지만 `httpClient` 는 응답 봉투를 그대로 준다.
 */
export async function fetchMyBookmarkIdPage(
  kind: BookmarkKind,
  params: { page: number; size: number },
): Promise<MyBookmarkIdPage> {
  switch (kind) {
    case 'jobs': {
      const response = (await listMyJobBookmarks(
        params,
      )) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;
      return toIdPage(response.data?.items, response.data?.pageInfo, params);
    }
    case 'bootcamps': {
      const response = (await listMyBootcampBookmarks(
        params,
      )) as unknown as SuccessResponsePageResponseUserBootcampSummaryResponse;
      return toIdPage(response.data?.items, response.data?.pageInfo, params);
    }
    case 'side-studies': {
      const response = (await listMyRecruitmentPostBookmarks(
        params,
      )) as unknown as SuccessResponsePageResponseRecruitmentPostSummaryResponse;
      return toIdPage(response.data?.items, response.data?.pageInfo, params);
    }
  }
}

function toIdPage(
  items: readonly { id: number }[] | undefined,
  pageInfo: PageInfo | undefined,
  params: { page: number; size: number },
): MyBookmarkIdPage {
  return {
    ids: (items ?? []).map((item) => item.id),
    pageInfo: pageInfo ?? {
      pageNum: params.page,
      pageSize: params.size,
      totalElements: 0,
      totalPages: 0,
    },
  };
}
