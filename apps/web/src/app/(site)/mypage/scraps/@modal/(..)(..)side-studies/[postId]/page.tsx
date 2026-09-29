import { RouteModal } from '@/shared/ui/RouteModal';
import { SideStudyDetailView } from '@/widgets/side-study-detail';

/**
 * 지원 · 신청 관리 칸반에서 연 사이드 스터디 상세 모달(`../../../layout.tsx` 주석). 사이드
 * 스터디 상세는 모달 배치가 따로 없어 상세 화면의 본문을 그대로 담는다.
 */
export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  return (
    <RouteModal label="사이드 스터디 상세">
      <SideStudyDetailView postId={Number(postId)} />
    </RouteModal>
  );
}
