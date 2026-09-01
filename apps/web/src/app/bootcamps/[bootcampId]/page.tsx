import { BootcampDetailPage } from '@/views/bootcamp-detail';

/**
 * 동적 라우트의 `params`는 이 Next 버전에서 Promise다 — `app/jobs/[jobId]/page.tsx`와 같다.
 * `bootcampId`가 숫자가 아니면 `NaN`이 되고, 그때도 존재하지 않는 id 조회와 같은 404로
 * 처리된다(`widgets/bootcamp-detail/ui/BootcampDetailView.tsx`).
 */
export default async function Page({ params }: { params: Promise<{ bootcampId: string }> }) {
  const { bootcampId } = await params;

  return <BootcampDetailPage bootcampId={Number(bootcampId)} />;
}
