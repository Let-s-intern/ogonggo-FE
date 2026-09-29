import { RouteModal } from '@/shared/ui/RouteModal';
import { JobDetailView } from '@/widgets/job-detail';

/** 지원 · 신청 관리 칸반에서 연 공고 상세 모달(`../../../layout.tsx` 주석). */
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return (
    <RouteModal label="공고 상세">
      <JobDetailView jobId={Number(jobId)} layout="modal" />
    </RouteModal>
  );
}
