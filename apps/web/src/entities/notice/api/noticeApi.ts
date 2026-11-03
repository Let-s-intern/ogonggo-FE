import { listPublicAnnouncements, type PageInfo } from '@ogonggo/api';
import type { NoticeCategory, NoticeSummary } from '../model/types';

export interface NoticePageParams {
  page?: number;
  size: number;
  category?: NoticeCategory;
  keyword?: string;
  /** `true` 면 고정 글(공지 홈 `추천`)만. */
  pinned?: boolean;
  /** `LATEST` 면 고정 글을 앞세우지 않고 게시일 최신순. */
  sort?: 'LATEST';
}

export interface NoticePage {
  items: NoticeSummary[];
  pageInfo: PageInfo;
}

/**
 * `listPublicAnnouncements`(`GET /api/v1/announcements`). `category` · `keyword` · `pinned` · `sort` 는 생성 타입에 없는
 * 요청 중인 쿼리라 캐스팅해 싣는다 — 생성 URL 빌더가 받은 키를 모두 쿼리로 옮긴다. 응답 봉투 언랩은 다른 목록과 같다.
 */
export async function fetchNoticePage({
  page = 1,
  size,
  category,
  keyword,
  pinned,
  sort,
}: NoticePageParams): Promise<NoticePage> {
  const params = {
    page,
    size,
    category,
    keyword: keyword || undefined,
    pinned: pinned || undefined,
    sort,
  } as Parameters<typeof listPublicAnnouncements>[0];
  const response = (await listPublicAnnouncements(params)) as unknown as { data?: NoticePage };

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: page, pageSize: size, totalElements: 0, totalPages: 0 },
    }
  );
}
