import Link from 'next/link';
import { listPublicAnnouncements } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseUserAnnouncementSummaryResponse,
  UserAnnouncementSummaryResponse,
} from '@ogonggo/api';
import { formatDateDots } from '@/shared/lib/localDate';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { buildNoticeListHref, type NoticeListQuery } from '../lib/query';
import { isNewNotice, NewNoticeMark, NOTICE_CATEGORY_META } from '@/entities/notice';

export type NoticeListProps = NoticeListQuery;

/** 한 페이지 건수. 백엔드 기본값과 같은 값이지만 목 핸들러와 어긋나지 않도록 명시해 보낸다. */
const PAGE_SIZE = 10;

/**
 * `listPublicAnnouncements`(`GET /api/v1/announcements`). 정렬은 보내지 않는다 — 백엔드가 고정 공지를 먼저
 * 두고 그 안에서 최신순으로 준다(스펙 설명과 `core/notice/persistence/NoticeRepositories.kt` 의
 * `pinned.desc(), id.desc()`). 받은 순서를 그대로 그리므로 화면에서 다시 정렬하지 않는다.
 *
 * 언랩은 다른 목록과 같다. 생성 타입은 `{ data, status, headers }` 를 선언하지만 `httpClient`
 * 는 응답 봉투를 그대로 준다.
 */
async function fetchNoticePage({
  page,
  category,
  keyword,
}: NoticeListQuery): Promise<{ items: UserAnnouncementSummaryResponse[]; pageInfo: PageInfo }> {
  const response = (await listPublicAnnouncements({
    page,
    size: PAGE_SIZE,
    category,
    keyword,
  })) as unknown as SuccessResponsePageResponseUserAnnouncementSummaryResponse;

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    }
  );
}

/**
 * 공지 한 줄 — 고정 표시, 제목(최근 글이면 `N`), 요약, 작성일. 표가 아니라 목록인 이유는 칸이 적고 좁은 화면에서
 * 제목만 남기면 되기 때문이다. 고정 자리는 고정이 아닐 때도 폭을 잡아 두어 제목 시작 x 가 줄마다 흔들리지 않는다.
 * 카테고리 목록이 아니면(검색 결과) 제목 앞에 카테고리 이름을 단다.
 */
function NoticeRow({
  notice,
  showCategory,
}: {
  notice: UserAnnouncementSummaryResponse;
  showCategory: boolean;
}) {
  return (
    <li className="border-b border-gray-100">
      <Link
        href={`/notices/${notice.id}`}
        className="flex items-center gap-4 px-2 py-5 hover:bg-gray-50"
      >
        <span className="w-10 shrink-0 text-center text-xs font-bold text-blue-500">
          {notice.pinned ? '고정' : ''}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            {showCategory ? (
              <span className="shrink-0 text-xs font-medium text-gray-500">
                {NOTICE_CATEGORY_META[notice.category].label}
              </span>
            ) : null}
            {isNewNotice(notice.createdAt) ? <NewNoticeMark /> : null}
            <span className="truncate text-sm font-medium text-gray-900">{notice.title}</span>
          </span>
          {notice.summary ? (
            <span className="truncate text-xs text-gray-500">{notice.summary}</span>
          ) : null}
        </span>
        <time dateTime={notice.createdAt} className="shrink-0 text-sm text-gray-400">
          {formatDateDots(notice.createdAt)}
        </time>
      </Link>
    </li>
  );
}

/**
 * `/notices?category=` 또는 `?keyword=` 목록(이슈 #656) — 제목 줄, 공지 줄, 번호 페이지네이션. 페이지를 넘겨도
 * 카테고리와 검색어를 그대로 싣는다.
 */
export async function NoticeList(query: NoticeListProps) {
  const { items, pageInfo } = await fetchNoticePage(query);
  const heading = query.keyword
    ? `'${query.keyword}' 검색 결과`
    : query.category
      ? NOTICE_CATEGORY_META[query.category].label
      : '공지사항';

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="min-w-0 truncate text-xl font-bold text-gray-900 md:text-2xl">{heading}</h2>
        <Link href="/notices" className="shrink-0 text-sm text-gray-500 hover:text-gray-700">
          전체 카테고리
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          {query.keyword ? '검색 결과가 없어요.' : '등록된 공지사항이 없습니다.'}
        </p>
      ) : (
        <ul className="w-full border-t border-gray-200">
          {items.map((notice) => (
            <NoticeRow key={notice.id} notice={notice} showCategory={!query.category} />
          ))}
        </ul>
      )}
      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) =>
          buildNoticeListHref(page, { category: query.category, keyword: query.keyword })
        }
      />
    </div>
  );
}
