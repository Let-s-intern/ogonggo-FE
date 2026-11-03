import { fetchAdExposures } from '@/entities/advertisement/api/adExposureApi';
import { AdBanner } from '@/entities/advertisement/ui/AdBanner';
import { BootcampList, type BootcampListQuery } from '@/widgets/bootcamp-list';
import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';

export type BootcampListPageProps = BootcampListQuery;

/**
 * `교육부트캠프.png` — 히어로 박스 + 목록. 홈(`views/home`)과 같은 바깥 레이아웃을 쓴다
 * (히어로는 `max-w-page-padded`보다 넓은 `mx-10` 박스, 본문은 `max-w-page-padded`).
 *
 * 홈과 달리 인기 섹션은 없다. 광고 자리는 목록 위·아래 가로 배너(`main_top_banner_edu` · `main_bottom_banner_edu`)와
 * 목록 맨 앞 적극 모집중(`BootcampList`)이다. 아래 배너는 홈과 같이 PC 만이다. 목록 아래의 가로 선과 `FOR BUSINESS` 배너는 v3
 * 사이드·스터디 목업(`사이드 스터디 디자인변경.png`)에 생긴 것을 목록 화면 둘에 같이 넣은
 * 것이다(PRD "결정 기록"). 부트캠프 목업에는 없다.
 */
export async function BootcampListPage(query: BootcampListPageProps) {
  const [topBanners, bottomBanners] = await Promise.all([
    fetchAdExposures('MAIN_TOP_BANNER_EDU'),
    fetchAdExposures('MAIN_BOTTOM_BANNER_EDU'),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="bootcamps" />
      <div className="flex w-full max-w-page-padded flex-col items-center gap-10 px-5 py-10">
        <AdBanner ads={topBanners} />
        <BootcampList {...query} />
        {bottomBanners.length > 0 ? (
          <div className="hidden w-full md:block">
            <AdBanner ads={bottomBanners} />
          </div>
        ) : null}
        <div className="w-full border-t border-gray-100" />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
