import type { Metadata } from 'next';
import { SideStudyListPage } from '@/views/side-study-list';
import { parseSideStudyListQuery } from '@/widgets/side-study-list';

interface SideStudySearchParams {
  page?: string;
  tab?: string;
}

/**
 * 목록 공유 미리보기의 제목·설명. 이미지는 옆의 `opengraph-image.tsx` 가 만든다. 하위 화면의
 * `openGraph` 는 루트 것과 합쳐지지 않고 통째로 바뀌어 사이트 이름과 형식을 다시 적는다.
 */
export const metadata: Metadata = {
  title: '사이드·스터디',
  description: '사이드 프로젝트·스터디 모집 게시판. 혼자 말고, 함께할 사람을 찾아보세요.',
  openGraph: {
    type: 'website',
    siteName: '오늘의 공고',
    title: '사이드·스터디 | 오늘의 공고',
    description: '사이드 프로젝트·스터디 모집 게시판. 혼자 말고, 함께할 사람을 찾아보세요.',
    locale: 'ko_KR',
  },
};

/**
 * 이 Next 버전에서 `searchParams`는 Promise로 온다 — `/bootcamps`와 같다. 값 검증은
 * `parseSideStudyListQuery`가 한 곳에서 맡는다(`widgets/side-study-list/lib/query.ts`).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SideStudySearchParams>;
}) {
  const query = parseSideStudyListQuery(await searchParams);

  return <SideStudyListPage {...query} />;
}
