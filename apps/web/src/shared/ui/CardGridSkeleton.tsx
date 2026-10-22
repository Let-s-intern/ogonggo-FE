import { cn } from '@ogonggo/ui';

export interface CardGridSkeletonProps {
  /** 카드 수. 한 페이지 건수는 MSW 핸들러가 정한다. */
  count: number;
  /**
   * 그리드 간격. 목록 화면과 홈의 `전체 공고`는 `gap-x-4 gap-y-8`, 홈의 `인기 공고`만
   * `gap-4`다(`widgets/popular-jobs/ui/PopularJobsTabs.tsx`). 문자열 리터럴로 받는 이유는
   * Tailwind v4가 소스에 그대로 적힌 클래스만 만들기 때문이다.
   */
  gapClass: 'gap-x-4 gap-y-8' | 'gap-4';
  /**
   * 넓은 화면의 열 수. 기본은 md 부터 4열이다. 홈의 `전체 공고` 는 lg 부터 왼쪽 필터 열이 생겨 3열이다
   * (`widgets/job-list/ui/JobList.tsx`). 이 값도 문자열 리터럴인 이유는 `gapClass` 와 같다.
   */
  columnsClass?: 'md:grid-cols-4' | 'md:grid-cols-4 lg:grid-cols-3';
  /**
   * 사이드·스터디 카드인지(`entities/side-study/ui/SideStudyCard.tsx`). 데스크톱은 테두리 카드,
   * 모바일은 오른쪽에 작은 썸네일이 붙는 한 줄 목록이라 다른 카드와 모양이 갈린다.
   */
  framed?: boolean;
}

/**
 * 카드 4열 그리드의 스켈레톤. 채용공고·부트캠프·사이드·스터디 카드가 여백과 글자 크기를
 * 공유해서(`entities/job/ui/JobCard.tsx`의 주석 참고) 한 벌로 셋 다 덮는다.
 *
 * 카드 한 장은 `aspect-[8/5]` 썸네일 + 메타 줄 + 회사명 줄 + 제목 두 줄이다. 사이드·스터디
 * (`framed`)는 v14 에서 모양이 갈라졌다 — 데스크톱은 테두리 안에 8:5 썸네일 → 제목 두 줄 →
 * 모집 직무 → 구분선 아래 작성자 줄, 모바일은 선으로 나뉜 한 줄 목록이다.
 *
 * 카드 높이를 실제와 맞추는 기준은 한 장이 아니라 행이다 — `ul`이 그리드라 같은 행의 `li`는
 * 가장 높은 카드에 맞춰 늘어난다. 그래서 제목은 최대인 두 줄(40px)로 그린다. 한 행의 제목이
 * 전부 한 줄인 경우에만 그 행이 20px 짧아진다.
 */
export function CardGridSkeleton({
  count,
  gapClass,
  columnsClass = 'md:grid-cols-4',
  framed = false,
}: CardGridSkeletonProps) {
  return (
    <ul
      className={
        framed
          ? 'flex flex-col divide-y divide-gray-200 border-b border-gray-200 md:grid md:grid-cols-4 md:gap-5 md:divide-y-0 md:border-b-0'
          : cn('grid grid-cols-2', columnsClass, gapClass)
      }
    >
      {Array.from({ length: count }, (_, index) =>
        framed ? (
          <li
            key={index}
            className="flex flex-col gap-3 px-4 py-6 md:rounded-2xl md:border md:border-gray-100 md:p-4"
          >
            {/* 모바일 첫 줄 — 배지·메타. 데스크톱은 이 줄이 썸네일 위에 겹친다. */}
            <div className="h-6 w-32 rounded bg-gray-100 md:hidden" />
            <div className="hidden aspect-[8/5] w-full rounded-lg bg-gray-100 md:block" />
            <div className="flex items-start gap-4 md:flex-col md:gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-3 md:w-full">
                {/* 제목 — 모바일 세 줄(60px), 데스크톱 두 줄(48px). */}
                <div className="flex h-15 flex-col justify-between md:h-12">
                  <div className="h-4 rounded bg-gray-100" />
                  <div className="h-4 rounded bg-gray-100 md:w-2/3" />
                  <div className="h-4 w-2/3 rounded bg-gray-100 md:hidden" />
                </div>
                {/* 모집 직무 줄 */}
                <div className="h-5 w-32 rounded bg-gray-100" />
              </div>
              <div className="h-20 w-28 shrink-0 rounded-xl bg-gray-100 md:hidden" />
            </div>
            {/* 구분선 아래 작성자·댓글·조회수 줄 — 32px 원형 프로필이 높이를 정한다. */}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-100" />
              <div className="ml-auto h-4 w-16 rounded bg-gray-100" />
            </div>
          </li>
        ) : (
          <li key={index} className="flex flex-col gap-2">
            <div className="aspect-[8/5] w-full rounded-lg bg-gray-100 shadow-sm" />
            {/* 메타 줄 — 배지가 들어 있어 20px이다(`text-xs`의 16px이 아니다). */}
            <div className="h-5 w-full rounded bg-gray-100" />
            <div className="h-5 w-24 rounded bg-gray-100" />
            {/* 제목은 `line-clamp-2`라 최대 40px. 두 줄로 보이게 하되 바깥 높이는 40px에 묶어
                둔다 — 막대 두 개를 그냥 쌓으면 카드가 8px 길어진다. */}
            <div className="flex h-10 flex-col justify-between">
              <div className="h-4 rounded bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
          </li>
        ),
      )}
    </ul>
  );
}
