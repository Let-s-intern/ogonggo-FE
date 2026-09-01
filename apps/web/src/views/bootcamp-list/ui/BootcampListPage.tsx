import { BootcampList, type BootcampListQuery } from '@/widgets/bootcamp-list';
import { HomeHero } from '@/widgets/home-hero';

export type BootcampListPageProps = BootcampListQuery;

/**
 * `교육부트캠프.png` — 히어로 박스 + 목록. 홈(`views/home`)과 같은 바깥 레이아웃을 쓴다
 * (히어로는 `max-w-6xl`보다 넓은 `mx-10` 박스, 본문은 `max-w-6xl`).
 *
 * 홈과 달리 인기 섹션·광고 자리·`FOR BUSINESS` 배너가 없다 — 목업에서 카드 그리드 아래가
 * 바로 푸터다.
 */
export function BootcampListPage(query: BootcampListPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white">
      <HomeHero
        badge="부트캠프 · KDT · 무료 교육까지"
        headlineLines={['실무를 배울 수 있는', '교육만 골라 모았어요']}
      />
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
        <BootcampList {...query} />
      </div>
    </main>
  );
}
