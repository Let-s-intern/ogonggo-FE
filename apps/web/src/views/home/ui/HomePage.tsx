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
        {/* home.png: 인기 공고와 전체 공고 사이의 배너 광고 자리. 광고 콘텐츠는 이 기능 범위
            밖이라 자리만 잡아둔다(PRD 10절). */}
        <div className="h-40 w-full rounded-l bg-gray-100" aria-hidden="true" />
        <JobList {...query} />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
