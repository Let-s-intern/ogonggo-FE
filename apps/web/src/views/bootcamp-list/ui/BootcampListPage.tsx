import { BootcampList, type BootcampListQuery } from '@/widgets/bootcamp-list';
import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';

export type BootcampListPageProps = BootcampListQuery;

/**
 * `교육부트캠프.png` — 히어로 박스 + 목록. 홈(`views/home`)과 같은 바깥 레이아웃을 쓴다
 * (히어로는 `max-w-6xl`보다 넓은 `mx-10` 박스, 본문은 `max-w-6xl`).
 *
 * 홈과 달리 인기 섹션과 광고 자리는 없다. 목록 아래의 가로 선과 `FOR BUSINESS` 배너는 v3
 * 사이드·스터디 목업(`사이드 스터디 디자인변경.png`)에 생긴 것을 목록 화면 둘에 같이 넣은
 * 것이다(PRD "결정 기록"). 부트캠프 목업에는 없다.
 */
export function BootcampListPage(query: BootcampListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="bootcamps" />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <BootcampList {...query} />
        <div className="w-full border-t border-gray-100" />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
