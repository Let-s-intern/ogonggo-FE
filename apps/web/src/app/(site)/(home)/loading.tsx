import { CardGridSkeleton } from '@/shared/ui/CardGridSkeleton';
import { ForBusinessBanner } from '@/widgets/for-business-banner';
import { HomeHero } from '@/widgets/home-hero';

/** `인기 공고`는 조회수 상위 네 건이다(`widgets/popular-jobs/ui/PopularJobs.tsx`의 `TOP_COUNT`). */
const POPULAR_CARD_COUNT = 4;

/** `전체 공고` 한 페이지 건수. `widgets/job-list/ui/JobList.tsx` 의 `PAGE_SIZE` 와 같은 값이다. */
const JOB_CARD_COUNT = 12;

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
 * 목록 화면과 달리 `ListPageSkeleton`을 쓰지 않는다. 홈은 인기 공고가 히어로 박스 안에 있어서
 * 구성이 다르고, 쓰는 곳이 이 파일 하나뿐이라 컴포넌트로 빼지 않았다.
 *
 * 히어로는 `HeroSkeleton` 이 아니라 진짜 `HomeHero` 에 스켈레톤 카드를 자식으로 넣는다. 박스 높이가
 * 인기 공고 구역 높이만큼 달라지는데, 같은 위젯이 같은 값으로 그리면 헤드라인과 여백이 어긋날 수
 * 없다. 히어로는 데이터가 필요 없는 정적 위젯이라 로딩 중에 이미 최종 모습이다(맨 아래
 * `FOR BUSINESS` 배너도 같은 이유로 진짜 위젯이다).
 *
 * 히어로 안 카드 네 장은 오늘의 추천 공고 탭이다. 첫 탭은 오공고 PICK 이고 PICK 이 없으면 인기 공고로
 * 대신하므로(`widgets/popular-jobs/ui/PopularJobs.tsx`) 카드가 비는 일이 없다.
 * 2쪽 이상은 이 탭 구역도 없는데 이 파일은 쪽 번호를 모른다 — 1쪽 모양이다.
 *
 * 맥동이 두 덩어리(인기 공고, 전체 공고)에 따로 붙는다. 같은 시점에 만들어진 요소들이라
 * `animate-pulse`는 같은 위상으로 돈다.
 */
export default function Loading() {
  return (
    <main className="ogonggo-fallback flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full flex-col items-center" role="status">
        <span className="sr-only">불러오는 중</span>

        <HomeHero screen="jobs">
          <PopularSkeleton />
        </HomeHero>

        <div className="flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-10">
          {/* 전체 공고 — lg 이상은 왼쪽 열(제목 + 필터)과 오른쪽 열(칩·직무·정렬 줄, 카드 3열, 페이지네이션)의
              두 칸이다(`JobList.tsx`). 그 아래는 제목(모바일은 정렬 포함), 칩 줄(md 이상), 검색·직무·필터
              줄을 쌓고 카드 그리드, 페이지네이션이 이어진다. md 는 칩 줄이 한 줄을 다 쓰고 그 아래에
              검색·직무·필터와 정렬이 선다. */}
          <div
            aria-hidden="true"
            className="ogonggo-skeleton flex w-full animate-pulse flex-col gap-4 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 lg:contents">
              <div className="flex w-full items-center justify-between md:w-auto lg:col-start-1 lg:row-start-1">
                <div className="h-[26px] w-20 rounded bg-gray-100" />
                {/* 모바일은 정렬이 제목 줄 오른쪽 끝이다. */}
                <div className="h-9 w-36 rounded-full bg-gray-100 md:hidden" />
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 lg:col-start-2 lg:row-start-1 lg:flex-nowrap">
                {/* 직무 칩 — `전체` 와 다섯 개, 한 칸 `h-7`. 폭은 칩 글자 길이에 맞춰 잰 값(약 370px)이다. */}
                <div className="hidden h-7 w-full items-center gap-2 md:flex lg:w-auto">
                  {[44, 60, 48, 48, 60, 48].map((width, index) => (
                    <div
                      key={index}
                      className="h-7 shrink-0 rounded-full bg-gray-100"
                      style={{ width }}
                    />
                  ))}
                </div>
                {/* 검색은 lg 이상에서 왼쪽 열의 검색창이 맡는다. 필터 버튼도 lg 미만에만 있다. */}
                <div className="h-9 w-full rounded-full bg-gray-100 md:w-[220px] lg:hidden" />
                <div className="h-9 w-24 rounded-full bg-gray-100" />
                <div className="h-9 w-20 rounded-full bg-gray-100 lg:hidden" />
                <div className="hidden h-9 w-40 rounded-full bg-gray-100 md:ml-auto md:block" />
              </div>
            </div>
            {/* 왼쪽 필터 열 — 검색창, 채용 형태(전체 + 7), 요구 경력(전체 + 4), 초기화 버튼. */}
            <div className="hidden flex-col gap-6 lg:col-start-1 lg:row-start-2 lg:flex">
              <div className="h-9 w-full rounded-full bg-gray-100" />
              {[8, 5].map((rows) => (
                <div key={rows} className="flex flex-col gap-3">
                  <div className="mb-3 h-5 w-16 rounded bg-gray-100" />
                  {Array.from({ length: rows }, (_, index) => (
                    <div key={index} className="h-5 w-24 rounded bg-gray-100" />
                  ))}
                </div>
              ))}
              <div className="h-9 w-full rounded-full bg-gray-100" />
            </div>
            <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2">
              <CardGridSkeleton
                count={JOB_CARD_COUNT}
                gapClass="gap-x-4 gap-y-8"
                columnsClass="md:grid-cols-4 lg:grid-cols-3"
              />
              {/* 페이지네이션 — 링크 한 칸이 `h-8 w-8`이다. */}
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index} className="h-8 w-8 rounded-md bg-gray-100" />
                ))}
              </div>
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

/**
 * 히어로 박스 안의 인기 공고(`widgets/popular-jobs/ui/PopularJobsTabs.tsx`). 제목 줄(제목 `26px`,
 * 탭 알약 `h-7`)과 카드 한 줄이다. 카드 목록의 클래스는 실제 목록과 같다 — 모바일은 가로 한 줄,
 * md 이상은 4열이다. 박스 배경이 파란 기운이라 막대는 흰색 반투명으로 그린다.
 */
function PopularSkeleton() {
  return (
    <div aria-hidden="true" className="ogonggo-skeleton flex w-full animate-pulse flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="h-[26px] w-24 rounded bg-white/70" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-7 w-20 rounded-full bg-white/70" />
          ))}
        </div>
      </div>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {Array.from({ length: POPULAR_CARD_COUNT }, (_, index) => (
          <li
            key={index}
            className="w-[72%] max-w-[320px] min-w-[240px] shrink-0 md:w-auto md:max-w-none md:min-w-0"
          >
            <FeaturedCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * `featured` 카드(`entities/job/ui/JobCard.tsx`)의 자리. 테두리 상자 안에 모바일은 제목(최대 세 줄,
 * 오른쪽 북마크 자리 `pr-8`)과 로고 한 줄, md 이상은 8:5 썸네일 + 메타 줄 + 회사명 줄 + 제목 두 줄이다.
 * 제목은 줄 수가 가변이라 최대인 줄 수로 그린다(`CardGridSkeleton` 과 같은 기준).
 */
function FeaturedCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:gap-2 md:p-3">
      <div className="flex h-15 flex-col justify-between pr-8 md:hidden">
        <div className="h-4 rounded bg-gray-100" />
        <div className="h-4 rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>
      <div className="mt-auto flex items-center gap-3 md:hidden">
        <div className="size-13 shrink-0 rounded-lg bg-gray-100" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="h-4 w-16 rounded bg-gray-100" />
          <div className="h-5 w-24 rounded bg-gray-100" />
        </div>
        <div className="h-5 w-12 shrink-0 rounded-full bg-gray-100" />
      </div>
      <div className="hidden aspect-[8/5] w-full rounded-lg bg-gray-100 md:block" />
      <div className="hidden h-5 w-full rounded bg-gray-100 md:block" />
      <div className="hidden h-5 w-24 rounded bg-gray-100 md:block" />
      <div className="hidden h-10 flex-col justify-between md:flex">
        <div className="h-4 rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
