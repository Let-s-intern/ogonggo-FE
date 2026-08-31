import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';
import { JobList, type JobListQuery } from '@/widgets/job-list';
import { PopularJobs } from '@/widgets/popular-jobs';

export type HomePageProps = JobListQuery;

export function HomePage(query: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <PopularJobs />
        <JobList {...query} />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
