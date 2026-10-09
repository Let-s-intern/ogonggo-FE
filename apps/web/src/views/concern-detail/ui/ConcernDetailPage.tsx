import { ConcernDetailView } from '@/widgets/concern-detail';

export interface ConcernDetailPageProps {
  concernId: number;
}

/**
 * 바깥 레이아웃은 다른 상세 화면(`views/side-study-detail/ui/SideStudyDetailPage.tsx`) 과 같은 값이다.
 * 하단 `FOR BUSINESS` 배너는 두지 않는다 — 고민글은 개인이 올리는 글이라 그 안내가 맞지 않는다.
 */
export function ConcernDetailPage({ concernId }: ConcernDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-4 pt-4 pb-40 md:px-6 md:py-10">
      <ConcernDetailView concernId={concernId} />
    </main>
  );
}
