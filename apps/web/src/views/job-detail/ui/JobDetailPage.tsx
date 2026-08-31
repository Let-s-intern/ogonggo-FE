import { JobDetailView } from '@/widgets/job-detail';

export interface JobDetailPageProps {
  jobId: number;
}

export function JobDetailPage({ jobId }: JobDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-gray-50 px-4 py-10">
      <JobDetailView jobId={jobId} />
    </main>
  );
}
