import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';
import { SideStudyList, type SideStudyListQuery } from '@/widgets/side-study-list';

export type SideStudyListPageProps = SideStudyListQuery;

/**
 * `사이드 스터디 디자인변경.png`(v3) — 히어로 + 목록 + `FOR BUSINESS` 배너. 바깥 레이아웃은
 * `views/bootcamp-list`와 같다(히어로는 `max-w-6xl`보다 넓은 `mx-10` 박스, 본문은 `max-w-6xl`).
 *
 * 목록과 배너 사이의 가로 선은 목업에 있는 것이다. 배너는 홈·상세가 쓰는 위젯 그대로다.
 * 목업에는 페이지네이션이 없지만 구현에는 있어서, 선과 배너는 페이지네이션 아래 즉
 * `SideStudyList` 바깥에 온다.
 */
export function SideStudyListPage(query: SideStudyListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="side-studies" />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <SideStudyList {...query} />
        <div className="w-full border-t border-gray-100" />
        <div className="w-full">
          <ForBusinessBanner />
        </div>
      </div>
    </main>
  );
}
