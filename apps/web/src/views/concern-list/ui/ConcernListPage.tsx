import { HomeHero } from '@/widgets/home-hero';
import { ConcernList, type ConcernListQuery } from '@/widgets/concern-list';

export type ConcernListPageProps = ConcernListQuery;

/**
 * `v13 취준고민/목록.webp` — 히어로 + 목록. 바깥 레이아웃은 `views/side-study-list` 와 같다(히어로는
 * `max-w-6xl` 보다 넓은 `mx-10` 박스, 본문은 `max-w-6xl`). 하단 `고민 올리기 / 다른 고민 둘러보기` 배너는
 * 목록 위젯 안에 있다.
 */
export function ConcernListPage(query: ConcernListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero screen="concerns" />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <ConcernList {...query} />
      </div>
    </main>
  );
}
