import type { Metadata } from 'next';
import { NoticeListPage } from '@/views/notice-list';
import { buildNoticeListHref, parseNoticeListQuery } from '@/widgets/notice-list';

type SearchParams = Promise<{ page?: string; keyword?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { page } = parseNoticeListQuery(await searchParams);
  // 검색 결과는 정규 주소에 싣지 않는다. 페이지만 남긴다.
  return { title: '오공고 업데이트', alternates: { canonical: buildNoticeListHref({ page }) } };
}

/**
 * 이 Next 버전에서 `searchParams` 는 Promise 로 온다 — `/side-studies` 와 같다. 값 검증은
 * `parseNoticeListQuery` 가 한 곳에서 맡는다(`widgets/notice-list/lib/query.ts`).
 */
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const query = parseNoticeListQuery(await searchParams);

  return <NoticeListPage {...query} />;
}
