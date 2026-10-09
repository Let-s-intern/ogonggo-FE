import type { Metadata } from 'next';
import { ConcernListPage } from '@/views/concern-list';
import { parseConcernListQuery } from '@/widgets/concern-list';

interface ConcernSearchParams {
  page?: string;
  sort?: string;
  category?: string;
}

export const metadata: Metadata = {
  title: '취준 고민',
  description: '공고부터 면접까지, 취준생들의 이야기를 살펴보세요.',
};

/**
 * 이 Next 버전에서 `searchParams`는 Promise로 온다 — `/side-studies`와 같다. 값 검증은
 * `parseConcernListQuery`가 한 곳에서 맡는다(`widgets/concern-list/lib/query.ts`). 모르는 값은 버려
 * 기본값(전체, 최신순, 1쪽)으로 그려진다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ConcernSearchParams>;
}) {
  const query = parseConcernListQuery(await searchParams);

  return <ConcernListPage {...query} />;
}
