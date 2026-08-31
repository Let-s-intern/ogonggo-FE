import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { JobDetailView } from '@/widgets/job-detail';

export interface JobDetailPageProps {
  jobId: number;
}

/**
 * `ForBusinessBanner`는 `views/home/ui/HomePage.tsx`가 이미 재사용하는 것과 같은 위젯을 페이지
 * 하단에 그대로 재사용한다(PRD 10절, Push 4 완료가 선행 조건인 이유) — 새로 만들지 않는다.
 */
export function JobDetailPage({ jobId }: JobDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-6 py-10">
      <JobDetailView jobId={jobId} />
      <div className="w-full max-w-6xl px-6">
        <ForBusinessBanner />
      </div>
    </main>
  );
}
