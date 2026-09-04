import { cn } from '@ogonggo/ui';

export interface DetailPageSkeletonProps {
  /**
   * 헤더 카드 왼쪽 사각형의 크기. 채용공고·부트캠프는 회사 로고라 `h-16 w-16`,
   * 사이드·스터디는 작성자 썸네일이라 `h-12 w-12`다 — 이 16px 차이가 헤더 카드 높이
   * (267px / 251px)를 가르고, 그 아래 전부를 밀어 낸다.
   */
  avatarClass: 'h-16 w-16' | 'h-12 w-12';
  /** 정보 그리드의 행 수. 채용공고 2행(4칸), 부트캠프 3행(6칸), 사이드·스터디 4행이다. */
  infoRows: number;
  /** 정보 그리드 아래 본문 섹션 수(제목 + 문단). */
  sectionCount: number;
  /** 본문 문단 한 개를 몇 줄로 그릴지. 한 줄은 `text-sm`이라 20px이다. */
  sectionLines: number;
  /** 사이드바에서 CTA 아래에 오는 목록 블록 수(`비슷한 …`, `함께 보면 좋아요`). */
  sidebarListCount: number;
  /**
   * 본문(왼쪽) 열의 세로 간격. 채용공고 상세만 `gap-4`이고 나머지 둘은 `gap-8`이라
   * 호출부가 정한다. 문자열 리터럴로 받는 이유는 Tailwind v4가 소스에 그대로 적힌 클래스만
   * 만들기 때문이다 — 계산해 만든 이름은 CSS에 나오지 않는다.
   */
  bodyGapClass: 'gap-4' | 'gap-8';
  /**
   * 브레드크럼 자리를 그릴지. 상세 화면 셋은 켜고, 달력 모달처럼 브레드크럼이 없는 자리는
   * 끈다 — 켜 두면 로딩이 끝나는 순간 내용이 20px + `gap-4` 만큼 위로 튄다
   * (`widgets/job-detail/ui/JobDetailView.tsx` 의 같은 이름 프로퍼티와 짝이다).
   */
  showBreadcrumb?: boolean;
}

/** 자리만 채우는 회색 막대. 실제 요소의 line-height를 그대로 높이로 쓴다. */
function Bar({ className }: { className: string }) {
  return <div className={cn('rounded bg-gray-200', className)} />;
}

/**
 * 상세 화면 셋(`jobs/[jobId]`, `bootcamps/[bootcampId]`, `side-studies/[postId]`)이 같이 쓰는
 * 로딩 스켈레톤. 세 화면의 뼈대가 같은 값이라 한 벌만 둔다 — 브레드크럼 → 헤더 카드 →
 * 2단(정보 그리드 + 본문 섹션 / 사이드바)이고, 폭·여백·2단 비율
 * (`px-8`, `lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)]`, `lg:gap-15`)은
 * `widgets/job-detail/ui/JobDetailView.tsx`에서 그대로 가져온 것이다.
 *
 * 스켈레톤의 목적은 "로딩이 끝나는 순간 요소가 움직이지 않는 것"이므로, 회색 막대의 높이는
 * 취향이 아니라 실제 요소의 line-height다. 예를 들어 제목은 `text-2xl`이라 32px,
 * 브레드크럼은 `text-sm`이라 20px, 사이드바 CTA는 `Button` 기본 크기라 44px(`h-11`)이다.
 *
 * 맞출 수 없는 것이 하나 있다. 본문 문단은 글자 수에 따라 줄 수가 달라져서 데이터를 받기
 * 전에는 높이를 알 수 없다. 대신 2단 그리드가 두 열 중 높은 쪽을 따라간다는 점을 쓴다 —
 * 사이드바 높이는 데이터와 무관하게 정해져 있으므로(CTA 44px + 목록 블록 200px씩), 본문
 * 스켈레톤이 그 높이를 넘지 않으면 화면 전체 높이가 사이드바로 고정되고 아래의
 * `FOR BUSINESS` 배너 자리도 고정된다. `sectionCount`·`sectionLines`를 호출부가 정하는 이유다.
 *
 * 맥동은 Tailwind `animate-pulse`다(기존 스켈레톤과 같은 것). 같이 붙은 `ogonggo-skeleton`은
 * `prefers-reduced-motion: reduce`에서 그 맥동을 끄기 위한 표식이다(`app/globals.css`).
 */
export function DetailPageSkeleton({
  avatarClass,
  infoRows,
  sectionCount,
  sectionLines,
  sidebarListCount,
  bodyGapClass,
  showBreadcrumb = true,
}: DetailPageSkeletonProps) {
  return (
    <div className="w-full" role="status">
      <span className="sr-only">불러오는 중</span>
      <div
        aria-hidden="true"
        className="ogonggo-skeleton mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-4"
      >
        {/* 브레드크럼 — `flex items-center gap-1 text-sm`이라 높이 20px. */}
        {showBreadcrumb ? <Bar className="h-5 w-28" /> : null}

        {/* 헤더 카드 — `Card`(`rounded-lg border border-gray-200 bg-white p-4`)에
            `bg-gray-50 p-8`이 덧붙은 모양 그대로다. */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
          <div className="flex items-center gap-3">
            <div className={cn('shrink-0 rounded-md bg-gray-200', avatarClass)} />
            <div className="flex flex-col gap-1">
              <Bar className="h-6 w-40" />
              <Bar className="h-5 w-24" />
            </div>
          </div>
          {/* `h1 text-2xl`이라 32px. */}
          <Bar className="mt-6 h-8 w-3/4" />
          <hr className="my-6 border-gray-200" />
          <div className="flex items-center gap-3">
            {/* D-day 배지는 `px-3.5 py-1 text-base`라 32px, 옆 문구는 `text-sm`이라 20px. */}
            <div className="h-8 w-16 rounded-full bg-gray-200" />
            <Bar className="h-5 w-40" />
            <Bar className="ml-auto h-5 w-12" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 px-8 lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)] lg:gap-15">
          <div className={cn('flex flex-col', bodyGapClass)}>
            {/* 정보 그리드 — 한 칸이 라벨(`text-xs`, 16px) + 값(`text-sm`, 20px)이다. */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {Array.from({ length: infoRows * 2 }, (_, index) => (
                <div key={index}>
                  <Bar className="h-4 w-16" />
                  <Bar className="h-5 w-28" />
                </div>
              ))}
            </div>

            {Array.from({ length: sectionCount }, (_, index) => (
              <div key={index}>
                {/* 섹션 제목은 `text-lg`라 28px, 문단은 `mt-2` 뒤 `text-sm` 줄들이다. */}
                <Bar className="h-7 w-32" />
                <div className="mt-2 flex flex-col">
                  {Array.from({ length: sectionLines }, (_, lineIndex) => (
                    <Bar
                      key={lineIndex}
                      className={lineIndex === sectionLines - 1 ? 'h-5 w-2/3' : 'h-5 w-full'}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            {/* CTA — `Button` 기본 크기와 북마크 칸이 둘 다 `h-11`이다. */}
            <div className="h-11 w-full rounded-md bg-gray-200" />
            {Array.from({ length: sidebarListCount }, (_, index) => (
              <div key={index}>
                <Bar className="h-5 w-48" />
                <div className="mt-3 flex flex-col gap-3">
                  {Array.from({ length: 3 }, (_, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-md bg-gray-200" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Bar className="h-5 w-full" />
                        <Bar className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
