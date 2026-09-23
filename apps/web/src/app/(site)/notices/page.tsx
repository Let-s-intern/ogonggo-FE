import type { Metadata } from 'next';
import { NoticeListPage } from '@/views/notice-list';
import { parseNoticeListQuery } from '@/widgets/notice-list';

export const metadata: Metadata = { title: '공지사항' };

/**
 * 이 Next 버전에서 `searchParams` 는 Promise 로 온다 — `/side-studies` 와 같다. 값 검증은
 * `parseNoticeListQuery` 가 한 곳에서 맡는다(`widgets/notice-list/lib/query.ts`).
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = parseNoticeListQuery(await searchParams);

  return <NoticeListPage {...query} />;
}
