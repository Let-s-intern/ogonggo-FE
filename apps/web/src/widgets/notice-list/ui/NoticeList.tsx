import Link from 'next/link';
import { fetchNoticePage } from '@/entities/notice/api/noticeApi';
import { NoticeNewBadge, NoticeTagChip } from '@/entities/notice/ui/NoticeBadges';
import {
  isNewNotice,
  OGONGGO_UPDATE_CATEGORY,
  type NoticeSummary,
} from '@/entities/notice/model/types';
import { NoticeSearchForm } from '@/features/notice-search/ui/NoticeSearchForm';
import { formatDateDots } from '@/shared/lib/localDate';
import { ChevronIcon } from '@/shared/ui/icons';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { buildNoticeListHref, NOTICE_UPDATES_PATH, type NoticeListQuery } from '../lib/query';

export type NoticeListProps = NoticeListQuery;

/** 한 페이지 건수. 백엔드 기본값과 같은 값이지만 목 핸들러와 어긋나지 않도록 명시해 보낸다. */
const PAGE_SIZE = 10;

const EMPTY_THUMBNAIL = <div role="presentation" className="h-full w-full bg-gray-50" />;

/**
 * 오공고 업데이트 한 줄(`notice-update-list-pc.png`) — 썸네일, 태그, 제목과 새 글 `N`, 요약, 게시일.
 * 받은 순서(고정 먼저, 그 안에서 최신순)를 그대로 그린다.
 */
function NoticeRow({ notice }: { notice: NoticeSummary }) {
  return (
    <li className="border-b border-gray-200 last:border-b-0">
      <Link href={`/notices/${notice.id}`} className="group flex items-center gap-4 py-6 md:gap-8">
        <div className="aspect-[275/144] w-28 shrink-0 overflow-hidden rounded-xl bg-gray-50 md:w-[275px]">
          <Thumbnail
            src={notice.thumbnailUrl}
            alt=""
            fallback={EMPTY_THUMBNAIL}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 md:gap-2">
          {notice.tags && notice.tags.length > 0 ? (
            <div className="flex gap-1">
              {notice.tags.map((tag) => (
                <NoticeTagChip key={tag} tag={tag} />
              ))}
            </div>
          ) : null}
          <p className="flex max-w-full items-center gap-2 text-base font-bold text-gray-900 group-hover:underline md:text-xl">
            <span className="truncate">{notice.title}</span>
            {isNewNotice(notice.createdAt) ? <NoticeNewBadge /> : null}
          </p>
          {notice.summary ? (
            <p className="max-w-full truncate text-sm text-gray-500 md:text-base">
              {notice.summary}
            </p>
          ) : null}
          <time dateTime={notice.createdAt} className="text-xs text-gray-400 md:mt-2 md:text-sm">
            {formatDateDots(notice.createdAt)}
          </time>
        </div>
      </Link>
    </li>
  );
}

/** `/notices/updates` 본문 — 공지 홈으로 가는 링크, 카테고리 이름·설명, 검색, 글 목록, 번호 페이지네이션. */
export async function NoticeList({ page, keyword }: NoticeListProps) {
  const { items, pageInfo } = await fetchNoticePage({
    category: OGONGGO_UPDATE_CATEGORY.category,
    keyword,
    page,
    size: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/notices"
        className="flex items-center gap-1 self-start text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronIcon direction="left" className="h-4 w-4" />
        오공고 공지사항
      </Link>
      <div className="flex w-full flex-col gap-8 md:px-10 md:pt-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{OGONGGO_UPDATE_CATEGORY.label}</h1>
          <p className="text-base text-gray-500 md:text-lg">
            {OGONGGO_UPDATE_CATEGORY.description}
          </p>
        </header>
        <NoticeSearchForm action={NOTICE_UPDATES_PATH} defaultValue={keyword} />
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">
            {keyword ? '검색 결과가 없어요.' : '아직 올라온 글이 없어요.'}
          </p>
        ) : (
          <ul className="w-full">
            {items.map((notice) => (
              <NoticeRow key={notice.id} notice={notice} />
            ))}
          </ul>
        )}
        <NumberedPagination
          pageInfo={pageInfo}
          buildHref={(nextPage) => buildNoticeListHref({ page: nextPage, keyword })}
        />
      </div>
    </div>
  );
}
