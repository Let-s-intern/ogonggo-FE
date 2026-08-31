import type { GetJobsSort } from '@ogonggo/api';
import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { JobList } from '@/widgets/job-list';

export interface HomePageProps {
  page: number;
  sort: GetJobsSort;
}

export function HomePage({ page, sort }: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white px-4 py-10">
      <JobList page={page} sort={sort} />
      <div className="w-full max-w-6xl">
        <ForBusinessBanner />
      </div>
    </main>
  );
}
