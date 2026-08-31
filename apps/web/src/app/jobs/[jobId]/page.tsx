import { JobDetailPage } from '@/views/job-detail';

/**
 * 이 Next 버전에서 동적 라우트의 `params`는 Promise로 온다 — 동기 접근은 더 이상 없음
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md).
 * `jobId`가 숫자가 아니면 `NaN`이 되고, `getJob(NaN)`은 존재하지 않는 id 조회와 같은 404로
 * 처리된다 (widgets/job-detail/ui/JobDetailView.tsx) — 별도 검증이 필요 없다.
 */
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return <JobDetailPage jobId={Number(jobId)} />;
}
