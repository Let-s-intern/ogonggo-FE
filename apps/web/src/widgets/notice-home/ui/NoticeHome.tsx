import Link from 'next/link';
import { fetchNoticePage } from '@/entities/notice/api/noticeApi';
import { NoticeNewBadge } from '@/entities/notice/ui/NoticeBadges';
import {
  isNewNotice,
  VISIBLE_NOTICE_CATEGORIES,
  type NoticeCategoryInfo,
  type NoticeSummary,
} from '@/entities/notice/model/types';
import { NoticeSearchForm } from '@/features/notice-search/ui/NoticeSearchForm';
import { formatDateDots } from '@/shared/lib/localDate';
import { Thumbnail } from '@/shared/ui/Thumbnail';

export interface NoticeHomeProps {
  keyword?: string;
}

/** 추천 캐러셀에 싣는 최대 건수. */
const RECOMMENDED_SIZE = 10;
/** 카테고리마다 보여 주는 최근 글 수(시안). */
const RECENT_SIZE = 3;
/** 검색 결과 한 번에 보여 주는 건수. 공지가 많지 않아 페이지를 나누지 않는다. */
const SEARCH_SIZE = 50;

const EMPTY_THUMBNAIL = <div role="presentation" className="h-full w-full bg-gray-50" />;

/** 추천 카드 한 장 — 썸네일, 제목, 요약. 시안처럼 PC 는 세 장 남짓, MO 는 한 장 남짓 보인다. */
function RecommendedCard({ notice }: { notice: NoticeSummary }) {
  return (
    <li className="w-[80%] shrink-0 snap-start md:w-[calc((100%-2.5rem)/3)]">
      <Link href={`/notices/${notice.id}`} className="group flex flex-col gap-3">
        <div className="aspect-[422/220] w-full overflow-hidden rounded-xl bg-gray-50">
          <Thumbnail
            src={notice.thumbnailUrl}
            alt=""
            fallback={EMPTY_THUMBNAIL}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="truncate text-lg font-bold text-gray-900 group-hover:underline">
            {notice.title}
          </p>
          {notice.summary ? (
            <p className="truncate text-sm text-gray-500">{notice.summary}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

/** 글 한 줄 — 새 글 `N`, 제목, 게시일. 카테고리 최근 글과 검색 결과가 같이 쓴다. */
function NoticeLine({ notice }: { notice: NoticeSummary }) {
  return (
    <li>
      <Link
        href={`/notices/${notice.id}`}
        className="flex items-center gap-2 py-2.5 text-gray-900 hover:text-gray-600"
      >
        {isNewNotice(notice.createdAt) ? <NoticeNewBadge /> : null}
        <span className="min-w-0 flex-1 truncate text-base">{notice.title}</span>
        <time dateTime={notice.createdAt} className="shrink-0 text-xs text-gray-400">
          {formatDateDots(notice.createdAt)}
        </time>
      </Link>
    </li>
  );
}

/** 카테고리 상징. 이미지 에셋이 없어 글자 타일로 둔다. */
function CategoryMark() {
  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-500 md:h-24 md:w-24"
    >
      NEW
    </div>
  );
}

/** `전체 카테고리` 의 한 칸 — 카테고리 머리(이름, 새 글 `N`, 설명, 글 수)와 최근 글 셋. */
async function CategorySection({ info }: { info: NoticeCategoryInfo }) {
  const { items: recent, pageInfo } = await fetchNoticePage({
    category: info.category,
    size: RECENT_SIZE,
    sort: 'LATEST',
  });
  const hasNew = recent.some((notice) => isNewNotice(notice.createdAt));

  return (
    <section className="flex flex-col">
      <Link
        href={info.href}
        className="group flex items-center gap-5 border-b border-gray-200 pb-5"
      >
        <CategoryMark />
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 group-hover:underline">
            {info.label}
            {hasNew ? <NoticeNewBadge /> : null}
          </h3>
          <p className="text-sm text-gray-500">{info.description}</p>
          <p className="text-xs text-gray-400">{pageInfo.totalElements}개</p>
        </div>
      </Link>
      {recent.length === 0 ? (
        <p className="py-6 text-sm text-gray-500">아직 올라온 글이 없어요.</p>
      ) : (
        <ul className="flex flex-col pt-3">
          {recent.map((notice) => (
            <NoticeLine key={notice.id} notice={notice} />
          ))}
        </ul>
      )}
    </section>
  );
}

async function SearchResults({ keyword }: { keyword: string }) {
  const { items, pageInfo } = await fetchNoticePage({ keyword, size: SEARCH_SIZE });

  return (
    <section className="flex w-full flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">
        &lsquo;{keyword}&rsquo; 검색 결과 {pageInfo.totalElements}개
      </h2>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">검색 결과가 없어요.</p>
      ) : (
        <ul className="flex flex-col border-t border-gray-200 pt-3">
          {items.map((notice) => (
            <NoticeLine key={notice.id} notice={notice} />
          ))}
        </ul>
      )}
      <Link href="/notices" className="self-start text-sm text-gray-500 hover:text-gray-700">
        공지사항 홈으로
      </Link>
    </section>
  );
}

/**
 * 공지사항 홈(`notice-home-pc.png`, `notice-home-mo.png`) — 머리말과 검색, `추천` 캐러셀, `전체 카테고리`.
 * 검색어가 있으면 추천과 카테고리 대신 검색 결과를 그린다.
 *
 * `추천` 은 고정 글이다(`pinned`). 새 필드를 만들지 않고 어드민이 이미 고르는 값을 쓴다.
 */
export async function NoticeHome({ keyword }: NoticeHomeProps) {
  return (
    <div className="flex w-full flex-col gap-16 md:gap-24">
      <header className="flex flex-col items-center gap-6 pt-6 md:pt-14">
        <span className="rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-500">
          오공고 공지사항
        </span>
        <h1 className="text-center text-xl font-bold text-gray-900 md:text-4xl">
          오공고의 새 소식을 전해드려요
        </h1>
        <div className="w-full max-w-[800px]">
          <NoticeSearchForm action="/notices" defaultValue={keyword} />
        </div>
      </header>

      {keyword ? <SearchResults keyword={keyword} /> : <NoticeHomeSections />}
    </div>
  );
}

async function NoticeHomeSections() {
  const { items: recommended } = await fetchNoticePage({ pinned: true, size: RECOMMENDED_SIZE });

  return (
    <>
      {recommended.length > 0 ? (
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-gray-900">추천</h2>
          <ul className="-mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-2">
            {recommended.map((notice) => (
              <RecommendedCard key={notice.id} notice={notice} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-6 border-t border-gray-200 pt-12 md:border-t-0 md:pt-0">
        <h2 className="text-2xl font-bold text-gray-900">전체 카테고리</h2>
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-10">
          {VISIBLE_NOTICE_CATEGORIES.map((info) => (
            <CategorySection key={info.category} info={info} />
          ))}
        </div>
      </section>
    </>
  );
}
