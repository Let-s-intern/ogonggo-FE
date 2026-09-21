import type { Metadata } from 'next';
import { CompanyJobFormPage } from '@/views/mypage';

export const metadata: Metadata = { title: '채용 공고 수정' };

/**
 * 동적 라우트의 `params` 는 이 Next 버전에서 Promise 다 —
 * `app/(site)/mypage/posts/[postId]/edit/page.tsx` 와 같다. 숫자가 아닌 id 는 `NaN` 이 되고,
 * 공고 조회가 실패해 "불러오지 못했습니다" 로 떨어진다.
 */
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return <CompanyJobFormPage jobId={Number(jobId)} />;
}
