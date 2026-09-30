import { SideStudyDetailView } from '@/widgets/side-study-detail';

export interface SideStudyDetailPageProps {
  postId: number;
}

/**
 * 바깥 레이아웃은 채용공고·부트캠프 상세(`views/job-detail/ui/JobDetailPage.tsx`,
 * `views/bootcamp-detail/ui/BootcampDetailPage.tsx`)와 같은 값이다 — 세 상세 화면이 같은 폭·같은
 * 여백으로 보여야 한다. 하단 `FOR BUSINESS` 배너는 이 화면에만 두지 않는다 — 모집글은 기업·교육기관이
 * 아니라 개인이 올리는 글이라 그 안내가 맞지 않는다(2026-09-30).
 */
export function SideStudyDetailPage({ postId }: SideStudyDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-4 pt-4 pb-40 md:px-6 md:py-10">
      <SideStudyDetailView postId={postId} />
    </main>
  );
}
