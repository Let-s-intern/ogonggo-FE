import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';
import { JobList, type JobListQuery } from '@/widgets/job-list';
import { PopularJobs } from '@/widgets/popular-jobs';

export type HomePageProps = JobListQuery;

export function HomePage(query: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="jobs" headline="커리어 여정에 딱! 맞는 채용공고만 쏙! 보여드려요" />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        {/* 인기 공고는 첫 페이지에서만 보인다. 2페이지부터도 위에 고정해 두면 넘길 때마다 같은
            네 건을 지나야 목록이 나온다. 사이 배너 자리도 인기 공고와 전체 공고 사이라 같이 뺀다. */}
        {query.page === 1 ? (
          <>
            <PopularJobs />
            {/* home.png: 인기 공고와 전체 공고 사이의 배너 광고 자리. 광고 콘텐츠는 이 기능 범위
                밖이라 자리만 잡아둔다(PRD 10절). */}
            <div className="h-40 w-full rounded-lg bg-gray-100" aria-hidden="true" />
          </>
        ) : null}
        <JobList {...query} />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
