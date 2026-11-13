import type { Metadata } from 'next';
import { NoticeListPage } from '@/views/notice-list';
import { buildNoticeListHref, parseNoticeListQuery } from '@/widgets/notice-list';

type NoticeSearchParams = { page?: string; category?: string; keyword?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<NoticeSearchParams>;
}): Promise<Metadata> {
  const { page, category } = parseNoticeListQuery(await searchParams);
  // 검색 결과는 같은 목록의 다른 모습이라 검색어는 정식 주소에 넣지 않는다.
  return { title: '공지사항', alternates: { canonical: buildNoticeListHref(page, { category }) } };
}

/**
 * 이 Next 버전에서 `searchParams` 는 Promise 로 온다 — `/side-studies` 와 같다. 값 검증은
 * `parseNoticeListQuery` 가 한 곳에서 맡는다(`widgets/notice-list/lib/query.ts`).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<NoticeSearchParams>;
}) {
  const query = parseNoticeListQuery(await searchParams);

  return <NoticeListPage {...query} />;
}
