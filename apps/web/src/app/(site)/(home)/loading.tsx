import { CardGridSkeleton } from '@/shared/ui/CardGridSkeleton';
import { HeroSkeleton } from '@/shared/ui/HeroSkeleton';
import { ForBusinessBanner } from '@/widgets/for-business-banner';

/** `인기 공고`는 조회수 상위 네 건이다(`widgets/popular-jobs/ui/PopularJobs.tsx`의 `TOP_COUNT`). */
const POPULAR_CARD_COUNT = 4;

/** `전체 공고` 한 페이지 건수. MSW 핸들러의 `DEFAULT_SIZE`와 같은 값이다. */
const JOB_CARD_COUNT = 10;

/**
 * `app/(home)/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * `page.tsx`를 `(home)` 라우트 그룹으로 옮긴 이유가 이 파일이다. 괄호 폴더는 URL에 들어가지
 * 않으므로 주소는 그대로 `/`이고, 대신 홈이 루트 `app/loading.tsx`의 폴백 범위에서 빠져 자기
 * 모양을 아는 스켈레톤을 가질 수 있다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md).
 * 루트 layout은 그대로 하나뿐이라 그룹 간 전체 새로고침 문제(같은 문서 Caveats)는 없다.
 *
 * 목록 화면과 달리 `ListPageSkeleton`을 쓰지 않는다. 홈은 그 구성 위에 인기 공고 섹션과 광고
 * 자리가 하나씩 더 있고, 쓰는 곳이 이 파일 하나뿐이라 컴포넌트로 빼지 않았다. 겹치는 두
 * 조각(`HeroSkeleton`, `CardGridSkeleton`)만 나눠 쓴다.
 *
 * 맥동이 네 덩어리에 따로 붙는다. 하나로 감싸지 못하는 것은 맨 아래 `FOR BUSINESS` 배너가
 * 진짜 위젯이기 때문이다 — 데이터가 필요 없는 정적 위젯이라 로딩 중에 이미 최종 모습으로 둘
 * 수 있고, 그러면 그 부분은 높이가 어긋날 여지가 없다. 같은 시점에 만들어진 요소들이라
 * `animate-pulse`는 넷이 같은 위상으로 돈다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full flex-col items-center" role="status">
        <span className="sr-only">불러오는 중</span>

        <HeroSkeleton />

        <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
          {/* 인기 공고 — 제목 줄(`text-lg` 28px, 오른쪽 탭 버튼도 `py-1 text-sm`이라 28px)과
              카드 한 줄. 카드 그리드만 `gap-4`다. */}
          <section aria-hidden="true" className="ogonggo-skeleton w-full animate-pulse">
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="h-7 w-24 rounded bg-gray-100" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="h-7 w-20 rounded-full bg-gray-100" />
                  ))}
                </div>
              </div>
              <CardGridSkeleton count={POPULAR_CARD_COUNT} gapClass="gap-4" />
            </div>
          </section>

          {/* 광고 자리 — 실제 화면에도 같은 크기의 회색 박스가 있다
              (`views/home/ui/HomePage.tsx`). 채울 내용이 없어 클래스를 그대로 쓴다. */}
          <div
            aria-hidden="true"
            className="ogonggo-skeleton h-40 w-full animate-pulse rounded-lg bg-gray-100"
          />

          {/* 전체 공고 — 제목 + 검색·필터 줄(`h-9`라 36px), 카드 그리드, 페이지네이션. */}
          <div
            aria-hidden="true"
            className="ogonggo-skeleton flex w-full animate-pulse flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="h-7 w-20 rounded bg-gray-100" />
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-9 w-56 rounded-md bg-gray-100" />
                <div className="h-9 w-24 rounded-full bg-gray-100" />
                <div className="h-9 w-20 rounded-full bg-gray-100" />
              </div>
            </div>
            <CardGridSkeleton count={JOB_CARD_COUNT} gapClass="gap-x-4 gap-y-8" />
            {/* 페이지네이션 — 링크 한 칸이 `h-8 w-8`이다. */}
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} className="h-8 w-8 rounded-md bg-gray-100" />
              ))}
            </div>
          </div>

          <div className="w-full">
            <ForBusinessBanner />
          </div>
        </div>
      </div>
    </main>
  );
}
