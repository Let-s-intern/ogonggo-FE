import { RouteModal } from '@/shared/ui/RouteModal';
import { BootcampDetailView } from '@/widgets/bootcamp-detail';

/**
 * 지원 · 신청 관리 칸반에서 연 부트캠프 상세 모달(`../../../layout.tsx` 주석). 부트캠프 상세는
 * 모달 배치가 따로 없어 상세 화면의 본문을 그대로 담는다.
 */
export default async function Page({ params }: { params: Promise<{ bootcampId: string }> }) {
  const { bootcampId } = await params;

  return (
    <RouteModal label="부트캠프 상세">
      <BootcampDetailView bootcampId={Number(bootcampId)} />
    </RouteModal>
  );
}
