import type { Metadata } from 'next';
import { MyPostFormPage } from '@/views/mypage';

export const metadata: Metadata = { title: '모집글 수정' };

/**
 * 동적 라우트의 `params` 는 이 Next 버전에서 Promise 다 —
 * `app/(site)/side-studies/[postId]/page.tsx` 와 같다. 숫자가 아닌 id 는 `NaN` 이 되고,
 * 폼 조회가 실패해 "불러오지 못했습니다" 로 떨어진다.
 */
export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  return <MyPostFormPage postId={Number(postId)} />;
}
