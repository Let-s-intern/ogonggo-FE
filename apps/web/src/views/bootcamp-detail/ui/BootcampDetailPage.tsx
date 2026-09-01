import { BootcampDetailView } from '@/widgets/bootcamp-detail';

export interface BootcampDetailPageProps {
  bootcampId: number;
}

/**
 * 바깥 레이아웃은 채용공고 상세(`views/job-detail/ui/JobDetailPage.tsx`)와 같은 값이다 —
 * 두 상세 화면이 같은 폭·같은 여백으로 보여야 한다. 하단 `FOR BUSINESS` 배너는 2.5에서
 * 붙인다.
 */
export function BootcampDetailPage({ bootcampId }: BootcampDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-6 py-10">
      <BootcampDetailView bootcampId={bootcampId} />
    </main>
  );
}
