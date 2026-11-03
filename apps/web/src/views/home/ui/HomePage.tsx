import { fetchAdExposures } from '@/entities/advertisement/api/adExposureApi';
import { AdBanner } from '@/entities/advertisement/ui/AdBanner';
import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { JobsHomeHero } from '@/widgets/home-hero';
import { JobList, type JobListQuery } from '@/widgets/job-list';
import { PopularJobs } from '@/widgets/popular-jobs';

export type HomePageProps = JobListQuery;

export async function HomePage(query: HomePageProps) {
  const [topBanners, bottomBanners] = await Promise.all([
    fetchAdExposures('MAIN_TOP_BANNER_RECRUIT'),
    fetchAdExposures('MAIN_BOTTOM_BANNER_RECRUIT'),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      {/* 히어로(헤드라인과 오늘의 추천 공고: 오공고 PICK·인턴 TOP4·신입 TOP4)는 첫 페이지에서만
          보인다(`docs/asset/v12 채용공고 상세/목록.webp`). 2페이지부터도 위에 두면 넘길 때마다 같은
          히어로를 지나 스크롤해야 목록이 나온다(2026-10-15, 사용자). */}
      {query.page === 1 ? (
        <JobsHomeHero>
          <PopularJobs />
        </JobsHomeHero>
      ) : null}
      <div className="flex w-full max-w-page-padded flex-col items-center gap-10 px-5 py-10">
        {/* 히어로(오늘의 추천 공고) 아래, 전체 공고 위의 가로 배너(`main_top_banner_recruit`). PC·MO 같은 자리다
            (`home-pc-*.png`, `home-mo.png`). 광고가 없으면 접힌다. */}
        <AdBanner ads={topBanners} />
        <JobList {...query} />
        {/* 페이지네이션 아래, FOR BUSINESS 위(`main_bottom_banner_recruit`). MO 시안에는 이 자리가 없어 PC 만이다. */}
        {bottomBanners.length > 0 ? (
          <div className="hidden w-full md:block">
            <AdBanner ads={bottomBanners} />
          </div>
        ) : null}
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
