import Link from 'next/link';
import { listPublicNotices } from '@ogonggo/api';
import type {
  PageInfo,
  SuccessResponsePageResponseUserNoticeSummaryResponse,
  UserNoticeSummaryResponse,
} from '@ogonggo/api';
import { formatDateDots } from '@/shared/lib/localDate';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { buildNoticeListHref, type NoticeListQuery } from '../lib/query';

export type NoticeListProps = NoticeListQuery;

/** 한 페이지 건수. 백엔드 기본값과 같은 값이지만 목 핸들러와 어긋나지 않도록 명시해 보낸다. */
const PAGE_SIZE = 10;

/**
 * `listPublicNotices`(`GET /api/v1/notices`). 정렬은 보내지 않는다 — 백엔드가 고정 공지를 먼저
 * 두고 그 안에서 최신순으로 준다(스펙 설명과 `core/notice/persistence/NoticeRepositories.kt` 의
 * `pinned.desc(), id.desc()`). 받은 순서를 그대로 그리므로 화면에서 다시 정렬하지 않는다.
 *
 * 언랩은 다른 목록과 같다. 생성 타입은 `{ data, status, headers }` 를 선언하지만 `httpClient`
 * 는 응답 봉투를 그대로 준다.
 */
async function fetchNoticePage({
  page,
}: NoticeListQuery): Promise<{ items: UserNoticeSummaryResponse[]; pageInfo: PageInfo }> {
  const response = (await listPublicNotices({
    page,
    size: PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseUserNoticeSummaryResponse;

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    }
  );
}

/**
 * 공지 한 줄 — 고정 표시, 제목, 작성일. 표가 아니라 목록인 이유는 칸이 셋뿐이고 좁은 화면에서
 * 제목만 남기면 되기 때문이다. 고정 자리는 고정이 아닐 때도 폭을 잡아 두어 제목 시작 x 가
 * 줄마다 흔들리지 않는다.
 */
function NoticeRow({ notice }: { notice: UserNoticeSummaryResponse }) {
  return (
    <li className="border-b border-gray-100">
      <Link
        href={`/notices/${notice.id}`}
        className="flex items-center gap-4 px-2 py-5 hover:bg-gray-50"
      >
        <span className="w-10 shrink-0 text-center text-xs font-bold text-blue-500">
          {notice.pinned ? '고정' : ''}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {notice.title}
        </span>
        <time dateTime={notice.createdAt} className="shrink-0 text-sm text-gray-400">
          {formatDateDots(notice.createdAt)}
        </time>
      </Link>
    </li>
  );
}

/** `/notices` 목록 본문 — 제목 + 공지 줄 + 번호 페이지네이션. */
export async function NoticeList(query: NoticeListProps) {
  const { items, pageInfo } = await fetchNoticePage(query);

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">등록된 공지사항이 없습니다.</p>
      ) : (
        <ul className="w-full border-t border-gray-200">
          {items.map((notice) => (
            <NoticeRow key={notice.id} notice={notice} />
          ))}
        </ul>
      )}
      <NumberedPagination pageInfo={pageInfo} buildHref={buildNoticeListHref} />
    </div>
  );
}
