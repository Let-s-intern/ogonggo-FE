import { RouteModal } from '@/shared/ui/RouteModal';
import { JobDetailView } from '@/widgets/job-detail';

/**
 * 공고 달력에서 연 공고 상세 모달. 달력의 막대·카드가 `/jobs/[id]` 로 가는 링크를 이 파일이
 * 가로챈다(`../../../layout.tsx` 주석). 내용은 상세 화면과 같은 `JobDetailView` 의 모달 배치다.
 */
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return (
    <RouteModal label="공고 상세">
      <JobDetailView jobId={Number(jobId)} layout="modal" />
    </RouteModal>
  );
}
