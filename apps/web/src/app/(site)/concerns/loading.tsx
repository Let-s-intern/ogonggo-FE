import { HeroSkeleton } from '@/shared/ui/HeroSkeleton';
import { ConcernListBanner } from '@/widgets/concern-list';

/** 한 페이지 고민 수. 목록 요청의 `size`(`widgets/concern-list/ui/ConcernListItems.tsx`) 와 같은 값이다. */
const ROW_COUNT = 10;

/** 인기 고민 카드 수. API 가 최대 3건을 준다. */
const POPULAR_COUNT = 3;

/**
 * `app/concerns/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸 데이터 요청이 끝나기
 * 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * `<main>` 클래스는 `views/concern-list/ui/ConcernListPage.tsx`와 같은 값이다 — 로딩이 끝날 때 배경·정렬·
 * 최소 높이가 바뀌지 않아야 한다. `ogonggo-fallback`은 300ms 지연 노출이다(`app/globals.css`). 목록이 카드
 * 격자가 아니라 줄이라 `ListPageSkeleton`을 쓰지 않고 자기 모양을 그린다.
 *
 * 배너만 맥동하지 않는다. 데이터가 필요 없는 정적 위젯이라 로딩 중에 이미 최종 모습으로 둔다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full flex-col items-center" role="status">
        <span className="sr-only">불러오는 중</span>

        <HeroSkeleton />

        <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
          <div
            aria-hidden="true"
            className="ogonggo-skeleton flex w-full animate-pulse flex-col gap-10"
          >
            {/* 상단 줄 — 오른쪽 버튼(`h-11`), 그 아래 칩들(`h-9`)과 정렬. */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <div className="h-11 w-32 rounded-md bg-gray-100" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-9 w-20 rounded-full bg-gray-100" />
                  ))}
                </div>
                <div className="h-9 w-36 rounded-full bg-gray-100" />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="h-7 w-52 rounded bg-gray-100" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                {Array.from({ length: POPULAR_COUNT }, (_, index) => (
                  <div key={index} className="h-32 rounded-lg border border-gray-200 bg-white" />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div>
                {Array.from({ length: ROW_COUNT }, (_, index) => (
                  <div key={index} className="border-b border-gray-100 px-2 py-5">
                    <div className="h-5 w-24 rounded bg-gray-100" />
                    <div className="mt-3 h-5 w-3/4 rounded bg-gray-100" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
                    <div className="mt-3 h-4 w-40 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
              {/* 페이지네이션 — 링크 한 칸이 `h-8 w-8`이다. */}
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index} className="h-8 w-8 rounded-md bg-gray-100" />
                ))}
              </div>
            </div>
          </div>

          <ConcernListBanner />
        </div>
      </div>
    </main>
  );
}
