import { HomeHero } from '@/widgets/home-hero';
import { SideStudyList, type SideStudyListQuery } from '@/widgets/side-study-list';

export type SideStudyListPageProps = SideStudyListQuery;

/**
 * `사이드 스터디 디자인변경.png`(v3) — 히어로 + 목록. 바깥 레이아웃은 `views/bootcamp-list`와
 * 같다(히어로는 `max-w-6xl`보다 넓은 `mx-10` 박스, 본문은 `max-w-6xl`).
 *
 * 목업 아래의 `FOR BUSINESS` 배너는 두지 않는다. 기업·교육기관에 공고 등록을 권하는 배너라
 * 개인이 모집글을 올리는 이 게시판과 맞지 않는다. 배너 위의 가로 선도 함께 뺐다.
 */
export function SideStudyListPage(query: SideStudyListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="side-studies" />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <SideStudyList {...query} />
      </div>
    </main>
  );
}
