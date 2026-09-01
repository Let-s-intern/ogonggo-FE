import { HomeHero } from '@/widgets/home-hero';
import { SideStudyList, type SideStudyListQuery } from '@/widgets/side-study-list';

export type SideStudyListPageProps = SideStudyListQuery;

/**
 * `사이드스터디.png` — 히어로 박스 + 목록. 바깥 레이아웃은 `views/bootcamp-list`와 같다
 * (히어로는 `max-w-6xl`보다 넓은 `mx-10` 박스, 본문은 `max-w-6xl`). 목업에서도 카드 그리드
 * 아래가 바로 푸터다.
 */
export function SideStudyListPage(query: SideStudyListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero
        badge="사이드 프로젝트 · 스터디 모집 게시판"
        headlineLines={['혼자 말고,', '함께할 사람을 찾아보세요']}
      />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <SideStudyList {...query} />
      </div>
    </main>
  );
}
