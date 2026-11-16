import { isNoticeCategory, type NoticeCategory } from '@/entities/notice';

/**
 * `/notices` 의 URL 쿼리 상태(이슈 #656). 목록 요청(`listPublicAnnouncements`) 의 `page`·`category`·`keyword` 로
 * 옮겨진다(`../ui/NoticeList.tsx`).
 *
 * `category` 도 `keyword` 도 없으면 공지사항 첫 화면(추천 카드와 카테고리 칸, `NoticeHome`)이고, 둘 중 하나라도
 * 있으면 그 카테고리 또는 검색 결과 목록이다. `size` 는 화면이 고정한다.
 */
export interface NoticeListQuery {
  page: number;
  category?: NoticeCategory;
  keyword?: string;
}

export const DEFAULT_NOTICE_LIST_QUERY: NoticeListQuery = {
  page: 1,
};

/** 백엔드 검색어 상한(`keyword` 100자). 넘으면 잘라 보낸다 — 400 으로 화면이 깨지지 않게 한다. */
const KEYWORD_MAX_LENGTH = 100;

/** 목록 화면인가. 아니면 첫 화면이다. */
export function isNoticeListMode(query: NoticeListQuery): boolean {
  return query.category !== undefined || query.keyword !== undefined;
}

/** 기본값(`page=1`) 은 URL 에서 생략한다 — `buildSideStudyListHref` 와 같은 방식이다. */
export function buildNoticeListHref(
  page: number,
  filter: Pick<NoticeListQuery, 'category' | 'keyword'> = {},
): string {
  const params = new URLSearchParams();
  if (filter.category) {
    params.set('category', filter.category);
  }
  if (filter.keyword) {
    params.set('keyword', filter.keyword);
  }
  if (page > DEFAULT_NOTICE_LIST_QUERY.page) {
    params.set('page', String(page));
  }
  const search = params.toString();
  return search ? `/notices?${search}` : '/notices';
}

/** 쿼리 문자열을 그대로 믿지 않는다. 모르는 카테고리와 빈 검색어는 없는 것으로, 페이지는 1 이상의 정수만. */
export function parseNoticeListQuery(searchParams: {
  page?: string;
  category?: string;
  keyword?: string;
}): NoticeListQuery {
  const page = Number(searchParams.page);
  const keyword = searchParams.keyword?.trim().slice(0, KEYWORD_MAX_LENGTH);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_NOTICE_LIST_QUERY.page,
    category: isNoticeCategory(searchParams.category) ? searchParams.category : undefined,
    keyword: keyword ? keyword : undefined,
  };
}
