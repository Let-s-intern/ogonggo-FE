import type { Metadata } from 'next';
import { MyPostsPage } from '@/views/mypage';
import { parseMyPostsQuery } from '@/widgets/my-posts';

export const metadata: Metadata = { title: '작성한 모집글' };

/**
 * 페이지와 필터가 전부 주소에 있다. 이 Next 버전에서 `searchParams` 는 Promise 로 온다 —
 * 지원·신청 내역(`app/(site)/mypage/applications/page.tsx`) 과 같다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MyPostsPage {...parseMyPostsQuery(await searchParams)} />;
}
