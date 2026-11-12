import {
  isNoticeListMode,
  NoticeHero,
  NoticeHome,
  NoticeList,
  type NoticeListQuery,
} from '@/widgets/notice-list';

export type NoticeListPageProps = NoticeListQuery;

/**
 * `/notices`(공지사항 시안, 이슈 #656). 위쪽 히어로와 검색은 늘 있고, 아래는 쿼리로 갈린다 — 카테고리나 검색어가
 * 없으면 추천 카드와 카테고리 칸(`NoticeHome`), 있으면 그 목록(`NoticeList`). 다른 목록 화면의 `FOR BUSINESS`
 * 배너는 달지 않는다. 공지사항은 읽으러 온 사람이 보는 글 목록이다.
 */
export function NoticeListPage(query: NoticeListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-page-padded flex-col items-center gap-16 px-5 pt-10 pb-24 md:gap-24">
        <NoticeHero keyword={query.keyword} />
        {isNoticeListMode(query) ? <NoticeList {...query} /> : <NoticeHome />}
      </div>
    </main>
  );
}
