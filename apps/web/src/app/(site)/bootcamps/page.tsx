import type { Metadata } from 'next';
import { BootcampListPage } from '@/views/bootcamp-list';
import { parseBootcampListQuery } from '@/widgets/bootcamp-list';

interface BootcampSearchParams {
  page?: string;
  sort?: string;
  tab?: string;
  q?: string;
}

/**
 * 목록 공유 미리보기의 제목·설명. 이미지는 옆의 `opengraph-image.tsx` 가 만든다. 하위 화면의
 * `openGraph` 는 루트 것과 합쳐지지 않고 통째로 바뀌어 사이트 이름과 형식을 다시 적는다.
 */
export const metadata: Metadata = {
  title: '교육·부트캠프',
  description: '부트캠프·KDT·무료 교육까지, 실무를 배울 수 있는 교육만 골라 모았어요.',
  openGraph: {
    type: 'website',
    siteName: '오늘의 공고',
    title: '교육·부트캠프 | 오늘의 공고',
    description: '부트캠프·KDT·무료 교육까지, 실무를 배울 수 있는 교육만 골라 모았어요.',
    locale: 'ko_KR',
  },
};

/**
 * 이 Next 버전에서 `searchParams`는 Promise로 온다 — 홈(`app/page.tsx`)과 같다. 값 검증은
 * `parseBootcampListQuery`가 한 곳에서 맡는다(`widgets/bootcamp-list/lib/query.ts`).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<BootcampSearchParams>;
}) {
  const query = parseBootcampListQuery(await searchParams);

  return <BootcampListPage {...query} />;
}
