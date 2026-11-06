import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeBannerSlot } from '@/widgets/home-banner';
import { HomeHero, HomeJobsHeadline } from '@/widgets/home-hero';
import { JobList, type JobListQuery } from '@/widgets/job-list';
import { PopularJobs } from '@/widgets/popular-jobs';

export type HomePageProps = JobListQuery;

export function HomePage(query: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      {/* 히어로(헤드라인과 오늘의 추천 공고: 오공고 PICK·인턴 TOP4·신입 TOP4)는 첫 페이지에서만
          보인다(`docs/asset/v12 채용공고 상세/목록.webp`). 2페이지부터도 위에 두면 넘길 때마다 같은
          히어로를 지나 스크롤해야 목록이 나온다(2026-10-15, 사용자). */}
      {query.page === 1 ? (
        <HomeHero screen="jobs" headline={<HomeJobsHeadline />}>
          <PopularJobs />
        </HomeHero>
      ) : null}
      <div className="flex w-full max-w-page-padded flex-col items-center gap-10 px-5 py-10">
        {/* 배너 자리 둘(광고 구좌 시안 `home-pc-guest.png`, 이슈 #573). 위는 히어로 바로 아래라 히어로처럼 첫
            페이지에만 둔다. 노출 중인 배너가 없으면 자리째 그리지 않는다 — 빈 회색 상자를 두지 않는다. */}
        {query.page === 1 ? <HomeBannerSlot placement="HOME_TOP" /> : null}
        <JobList {...query} />
        <HomeBannerSlot placement="HOME_BOTTOM" />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
