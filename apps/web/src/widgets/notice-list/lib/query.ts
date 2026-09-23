/**
 * `/notices` 목록이 페이지네이션에서 쓰는 URL 쿼리 상태. 목록 요청(`listPublicNotices`) 의
 * `page` 로 옮겨진다(`../ui/NoticeList.tsx`).
 *
 * 다른 목록(`/bootcamps`, `/side-studies`) 은 탭·정렬도 같이 실어 나르는데 공지 목록에는 그런
 * 컨트롤이 없다. 백엔드가 받는 파라미터도 `page`·`size` 둘뿐이고 `size` 는 화면이 고정한다.
 */
export interface NoticeListQuery {
  page: number;
}

export const DEFAULT_NOTICE_LIST_QUERY: NoticeListQuery = {
  page: 1,
};

/** 기본값(`page=1`) 은 URL 에서 생략한다 — `buildSideStudyListHref` 와 같은 방식이다. */
export function buildNoticeListHref(page: number): string {
  return page > DEFAULT_NOTICE_LIST_QUERY.page ? `/notices?page=${page}` : '/notices';
}

/** `?page=` 문자열을 그대로 믿지 않는다. 1 이상의 정수가 아니면 1 페이지다. */
export function parseNoticeListQuery(searchParams: { page?: string }): NoticeListQuery {
  const page = Number(searchParams.page);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_NOTICE_LIST_QUERY.page,
  };
}
