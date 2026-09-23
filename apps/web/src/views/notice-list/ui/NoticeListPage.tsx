import { NoticeList, type NoticeListQuery } from '@/widgets/notice-list';

export type NoticeListPageProps = NoticeListQuery;

/**
 * `/notices` — 히어로도 배너도 없다. 다른 목록(`/bootcamps`, `/side-studies`) 은 모집 정보를
 * 파는 화면이라 히어로와 `FOR BUSINESS` 배너를 달지만, 공지사항은 읽으러 온 사람이 보는
 * 글 목록이다. 본문 폭(`max-w-6xl`) 과 여백만 다른 화면과 맞춘다.
 */
export function NoticeListPage(query: NoticeListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <NoticeList {...query} />
      </div>
    </main>
  );
}
