import { SideStudyDetailView } from '@/widgets/side-study-detail';

export interface SideStudyDetailPageProps {
  postId: number;
}

/**
 * 바깥 레이아웃은 채용공고·부트캠프 상세(`views/job-detail`, `views/bootcamp-detail`)와 같은
 * 값이다 — 세 상세 화면이 같은 폭·같은 여백으로 보여야 한다. 하단 `FOR BUSINESS` 배너는
 * 작업 2.5에서 붙인다.
 */
export function SideStudyDetailPage({ postId }: SideStudyDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-6 py-10">
      <SideStudyDetailView postId={postId} />
    </main>
  );
}
