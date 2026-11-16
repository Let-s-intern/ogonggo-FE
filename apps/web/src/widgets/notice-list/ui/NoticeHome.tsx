import Link from 'next/link';
import {
  listPublicAnnouncementCategories,
  listPublicAnnouncements,
  type SuccessResponseListUserAnnouncementCategoryResponse,
  type SuccessResponsePageResponseUserAnnouncementSummaryResponse,
  type UserAnnouncementCategoryResponse,
  type UserAnnouncementSummaryResponse,
} from '@ogonggo/api';
import { formatDateDots } from '@/shared/lib/localDate';
import { buildNoticeListHref } from '../lib/query';
import {
  isNewNotice,
  NewNoticeMark,
  NOTICE_CATEGORY_META,
  NoticeCategoryIcon,
  NoticeThumbnail,
} from '@/entities/notice';

/** 추천 카드 수. 시안은 세 장이 보이고 오른쪽으로 더 넘긴다. */
const RECOMMENDED_SIZE = 6;

/**
 * 추천 카드 — 상단 고정 공지(`pinned=true`, BE LC-3614). 운영자가 콘솔에서 고정한 공지가 추천이다.
 * 언랩은 다른 목록과 같다. 생성 타입은 `{ data, status, headers }` 를 선언하지만 `httpClient` 는 응답 봉투를 그대로 준다.
 */
async function fetchRecommended(): Promise<UserAnnouncementSummaryResponse[]> {
  const response = (await listPublicAnnouncements({
    page: 1,
    size: RECOMMENDED_SIZE,
    pinned: true,
  })) as unknown as SuccessResponsePageResponseUserAnnouncementSummaryResponse;
  return response.data?.items ?? [];
}

/** 카테고리 칸들(`GET /api/v1/announcements/categories`). 카테고리마다 공지 수와 최근 3건이다. */
async function fetchCategories(): Promise<UserAnnouncementCategoryResponse[]> {
  const response =
    (await listPublicAnnouncementCategories()) as unknown as SuccessResponseListUserAnnouncementCategoryResponse;
  return response.data ?? [];
}

function RecommendedCard({ notice }: { notice: UserAnnouncementSummaryResponse }) {
  return (
    <li className="w-[280px] shrink-0 snap-start md:w-[422px]">
      <Link href={`/notices/${notice.id}`} className="group flex flex-col gap-4">
        <NoticeThumbnail category={notice.category} thumbnailUrl={notice.thumbnailUrl} />
        <div className="flex flex-col gap-2">
          <p className="line-clamp-1 text-lg font-bold text-gray-900 group-hover:underline md:text-xl">
            {notice.title}
          </p>
          {notice.summary ? (
            <p className="line-clamp-2 text-sm break-keep text-gray-500 md:text-base">
              {notice.summary}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function CategoryColumn({ digest }: { digest: UserAnnouncementCategoryResponse }) {
  const meta = NOTICE_CATEGORY_META[digest.category];
  const hasNew = digest.recentAnnouncements.some((notice) => isNewNotice(notice.createdAt));
  const href = buildNoticeListHref(1, { category: digest.category });

  return (
    <section className="flex min-w-0 flex-col">
      <Link href={href} className="group flex items-center gap-6 border-b border-gray-200 pb-5">
        <NoticeCategoryIcon
          category={digest.category}
          className="h-20 w-20 rounded-2xl md:h-24 md:w-24"
          iconClassName="h-9 w-9"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 group-hover:underline md:text-xl">
            {meta.label}
            {hasNew ? <NewNoticeMark /> : null}
          </h3>
          <p className="text-sm break-keep text-gray-600">{meta.description}</p>
          <p className="text-xs text-gray-400">{digest.count.toLocaleString('ko-KR')}개</p>
        </div>
      </Link>
      {digest.recentAnnouncements.length === 0 ? (
        <p className="py-6 text-sm text-gray-400">아직 올라온 글이 없어요.</p>
      ) : (
        <ul className="flex flex-col pt-2">
          {digest.recentAnnouncements.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/notices/${notice.id}`}
                className="flex items-center gap-2 py-2.5 hover:bg-gray-50"
              >
                {isNewNotice(notice.createdAt) ? <NewNoticeMark /> : null}
                <span className="min-w-0 flex-1 truncate text-base text-gray-900">
                  {notice.title}
                </span>
                <time dateTime={notice.createdAt} className="shrink-0 text-xs text-gray-400">
                  {formatDateDots(notice.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * `/notices` 첫 화면(이슈 #656, 공지사항 시안) — 추천 카드와 `전체 카테고리`. 검색어나 카테고리가 있으면 이 대신
 * `NoticeList` 가 그린다.
 *
 * 추천이 없으면(고정 공지가 없으면) 그 구역째 그리지 않는다.
 */
export async function NoticeHome() {
  const [recommended, categories] = await Promise.all([fetchRecommended(), fetchCategories()]);

  return (
    <div className="flex w-full flex-col gap-16 md:gap-24">
      {recommended.length > 0 ? (
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">추천</h2>
          <ul className="-mx-5 flex snap-x scroll-px-5 gap-5 overflow-x-auto px-5 pb-2">
            {recommended.map((notice) => (
              <RecommendedCard key={notice.id} notice={notice} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-gray-900 md:text-2xl">전체 카테고리</h2>
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
          {categories.map((digest) => (
            <CategoryColumn key={digest.category} digest={digest} />
          ))}
        </div>
      </section>
    </div>
  );
}
