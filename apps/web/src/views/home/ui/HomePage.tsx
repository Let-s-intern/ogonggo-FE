import type { GetJobsSort } from '@ogonggo/api';
import { JobList } from '@/widgets/job-list';

export interface HomePageProps {
  page: number;
  sort: GetJobsSort;
}

export function HomePage({ page, sort }: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-gray-50 px-4 py-10">
      <JobList page={page} sort={sort} />
    </main>
  );
}
