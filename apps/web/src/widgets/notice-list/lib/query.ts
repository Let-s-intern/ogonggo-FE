/**
 * `/notices/updates`(오공고 업데이트 목록)의 URL 쿼리 상태. 목록 요청(`fetchNoticePage`)의 `page` · `keyword` 로
 * 옮겨진다(`../ui/NoticeList.tsx`).
 */
export interface NoticeListQuery {
  page: number;
  keyword?: string;
}

export const NOTICE_UPDATES_PATH = '/notices/updates';

export const DEFAULT_NOTICE_LIST_QUERY: NoticeListQuery = {
  page: 1,
};

/** 기본값(`page=1`, 검색어 없음)은 URL 에서 생략한다 — `buildSideStudyListHref` 와 같은 방식이다. */
export function buildNoticeListHref({ page, keyword }: NoticeListQuery): string {
  const params = new URLSearchParams();
  if (keyword) {
    params.set('keyword', keyword);
  }
  if (page > DEFAULT_NOTICE_LIST_QUERY.page) {
    params.set('page', String(page));
  }
  const search = params.toString();
  return search ? `${NOTICE_UPDATES_PATH}?${search}` : NOTICE_UPDATES_PATH;
}

/** `?page=` 문자열을 그대로 믿지 않는다. 1 이상의 정수가 아니면 1 페이지다. 검색어는 앞뒤 공백만 지운다. */
export function parseNoticeListQuery(searchParams: {
  page?: string;
  keyword?: string;
}): NoticeListQuery {
  const page = Number(searchParams.page);
  const keyword = searchParams.keyword?.trim();

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_NOTICE_LIST_QUERY.page,
    keyword: keyword ? keyword : undefined,
  };
}
