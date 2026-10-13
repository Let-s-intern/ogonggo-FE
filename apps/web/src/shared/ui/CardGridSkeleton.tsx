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
   * 카드 아래쪽에 해시태그·댓글·조회수 줄이 한 줄 더 있는지. 사이드·스터디 카드만 있다
   * (`entities/side-study/ui/SideStudyCard.tsx`).
   */
  hasCardFooter?: boolean;
  /**
   * 테두리 안에 작성자 썸네일 줄이 맨 위에 있고 그 아래에 8:5 글 썸네일이 오는 카드인지.
   * 사이드·스터디 카드가 그렇다(`entities/side-study/ui/SideStudyCard.tsx`).
   */
  framed?: boolean;
}

/**
 * 카드 4열 그리드의 스켈레톤. 채용공고·부트캠프·사이드·스터디 카드가 여백과 글자 크기를
 * 공유해서(`entities/job/ui/JobCard.tsx`의 주석 참고) 한 벌로 셋 다 덮는다.
 *
 * 카드 한 장은 `aspect-[8/5]` 썸네일 + 메타 줄 + 회사명 줄 + 제목 두 줄이다. 사이드·스터디
 * (`framed`)만 v3에서 모양이 갈라졌다 — 48px 작성자 썸네일이 메타·닉네임 두 줄과 한 행을
 * 이루고, 그 아래에 8:5 글 썸네일, 제목 아래 모집 배지 줄이 하나 더 있다.
 *
 * 카드 높이를 실제와 맞추는 기준은 한 장이 아니라 행이다 — `ul`이 그리드라 같은 행의 `li`는
 * 가장 높은 카드에 맞춰 늘어난다. 그래서 제목은 최대인 두 줄(40px)로 그린다. 한 행의 제목이
 * 전부 한 줄인 경우에만 그 행이 20px 짧아진다.
 */
export function CardGridSkeleton({
  count,
  gapClass,
  columnsClass = 'md:grid-cols-4',
  hasCardFooter = false,
  framed = false,
}: CardGridSkeletonProps) {
  return (
    <ul className={cn('grid grid-cols-2', columnsClass, gapClass)}>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className={cn(
            'flex flex-col',
            framed ? 'gap-2 rounded-lg border border-gray-100 p-4 md:gap-3' : 'gap-2',
          )}
        >
          {framed ? (
            <>
              {/* 작성자 썸네일 48px + 그 오른쪽의 메타(16px)·닉네임(20px) 두 줄. 행 높이는
                  썸네일이 정한다. 모바일은 카드처럼 40px 썸네일 아래로 두 줄을 내린다. */}
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
                <div className="h-10 w-10 shrink-0 rounded-md bg-gray-100 md:h-12 md:w-12" />
                <div className="flex w-full flex-col md:flex-1 md:gap-1">
                  <div className="h-4 w-20 rounded bg-gray-100" />
                  <div className="h-5 w-24 rounded bg-gray-100" />
                </div>
              </div>
              {/* 글 썸네일 — 카드 폭을 채우는 8:5 상자. 사진이 없는 글도 상자를 둔다. */}
              <div className="aspect-[8/5] w-full rounded-lg bg-gray-100" />
            </>
          ) : (
            <>
              <div className="aspect-[8/5] w-full rounded-lg bg-gray-100 shadow-sm" />
              {/* 메타 줄 — 배지가 들어 있어 20px이다(`text-xs`의 16px이 아니다). */}
              <div className="h-5 w-full rounded bg-gray-100" />
              <div className="h-5 w-24 rounded bg-gray-100" />
            </>
          )}
          {/* 제목은 `line-clamp-2`라 최대 40px. 두 줄로 보이게 하되 바깥 높이는 40px에 묶어
              둔다 — 막대 두 개를 그냥 쌓으면 카드가 8px 길어진다. */}
          <div className="flex h-10 flex-col justify-between">
            <div className="h-4 rounded bg-gray-100" />
            <div className="h-4 w-2/3 rounded bg-gray-100" />
          </div>
          {/* 모집 배지 줄 — `Badge` 기본값(`px-2 py-1` + `text-xs`)이라 24px이다. 모바일은 카드가
              모집 직무(16px)를 배지 위에 쌓는다. */}
          {framed ? (
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 rounded bg-gray-100 md:hidden" />
              <div className="h-6 w-20 rounded-sm bg-gray-100" />
            </div>
          ) : null}
          {/* 해시태그·댓글·조회수 줄. 모바일 카드는 해시태그와 숫자를 두 줄로 쌓는다. */}
          {hasCardFooter ? (
            <div className="flex flex-col gap-1">
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-100 md:hidden" />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
