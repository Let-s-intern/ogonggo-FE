import type { Metadata } from 'next';
import { CompanyPostsPage } from '@/views/mypage';
import { parseCompanyPostsQuery } from '@/widgets/company-posts';

export const metadata: Metadata = { title: '작성한 공고' };

/**
 * 탭과 페이지가 주소에 있다. 이 Next 버전에서 `searchParams` 는 Promise 로 온다 —
 * 일반 회원 목록 화면 넷과 같다(`app/(site)/mypage/posts/page.tsx`).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CompanyPostsPage {...parseCompanyPostsQuery(await searchParams)} />;
}
