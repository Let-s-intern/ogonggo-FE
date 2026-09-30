import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';
import { JobList, type JobListQuery } from '@/widgets/job-list';
import { PopularJobs } from '@/widgets/popular-jobs';

export type HomePageProps = JobListQuery;

export function HomePage(query: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="jobs" />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        {/* 인기 공고는 첫 페이지에서만 보인다. 2페이지부터도 위에 고정해 두면 넘길 때마다 같은
            네 건을 지나야 목록이 나온다.

            home.png 는 인기 공고와 전체 공고 사이에 배너 광고 자리가 있다. 광고 내용이 정해지지
            않아 빈 회색 상자만 보여서 그리지 않는다(2026-09-30, 사용자). 내용이 생기면 여기 둔다. */}
        {query.page === 1 ? <PopularJobs /> : null}
        <JobList {...query} />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
