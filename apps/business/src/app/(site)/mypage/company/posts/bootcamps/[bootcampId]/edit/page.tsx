import type { Metadata } from 'next';
import { CompanyBootcampFormPage } from '@/views/mypage';

export const metadata: Metadata = { title: '교육 · 부트캠프 공고 수정' };

/**
 * 동적 라우트의 `params` 는 이 Next 버전에서 Promise 다 —
 * `app/(site)/mypage/company/posts/jobs/[jobId]/edit/page.tsx` 와 같다. 숫자가 아닌 id 는
 * `NaN` 이 되고, 공고 조회가 실패해 "불러오지 못했습니다" 로 떨어진다.
 */
export default async function Page({ params }: { params: Promise<{ bootcampId: string }> }) {
  const { bootcampId } = await params;

  return <CompanyBootcampFormPage bootcampId={Number(bootcampId)} />;
}
