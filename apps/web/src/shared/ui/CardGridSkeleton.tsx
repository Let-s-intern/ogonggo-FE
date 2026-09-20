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
   * 카드 아래쪽에 해시태그·댓글·조회수 줄이 한 줄 더 있는지. 사이드·스터디 카드만 있다
   * (`entities/side-study/ui/SideStudyCard.tsx`).
   */
  hasCardFooter?: boolean;
  /**
   * 큰 썸네일 없이 테두리 안에 작성자 썸네일과 글자만 있는 카드인지. 사이드·스터디 카드가
   * 그렇다(`entities/side-study/ui/SideStudyCard.tsx`).
   */
  framed?: boolean;
}

/**
 * 카드 4열 그리드의 스켈레톤. 채용공고·부트캠프·사이드·스터디 카드가 여백과 글자 크기를
 * 공유해서(`entities/job/ui/JobCard.tsx`의 주석 참고) 한 벌로 셋 다 덮는다.
 *
 * 카드 한 장은 `aspect-[8/5]` 썸네일 + 메타 줄 + 회사명 줄 + 제목 두 줄이다. 사이드·스터디
 * (`framed`)만 v3에서 모양이 갈라졌다 — 큰 썸네일 대신 48px 작성자 썸네일이 메타·닉네임 두
 * 줄과 한 행을 이루고, 제목 아래 모집 배지 줄이 하나 더 있다.
 *
 * 카드 높이를 실제와 맞추는 기준은 한 장이 아니라 행이다 — `ul`이 그리드라 같은 행의 `li`는
 * 가장 높은 카드에 맞춰 늘어난다. 그래서 제목은 최대인 두 줄(40px)로 그린다. 한 행의 제목이
 * 전부 한 줄인 경우에만 그 행이 20px 짧아진다.
 */
export function CardGridSkeleton({
  count,
  gapClass,
  hasCardFooter = false,
  framed = false,
}: CardGridSkeletonProps) {
  return (
    <ul className={cn('grid grid-cols-2 md:grid-cols-4', gapClass)}>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className={cn(
            'flex flex-col',
            framed ? 'gap-3 rounded-lg border border-gray-100 p-4' : 'gap-2',
          )}
        >
          {framed ? (
            /* 작성자 썸네일 48px + 그 오른쪽의 메타(16px)·닉네임(20px) 두 줄. 행 높이는
               썸네일이 정한다. */
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-md bg-gray-100" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-4 w-20 rounded bg-gray-100" />
                <div className="h-5 w-24 rounded bg-gray-100" />
              </div>
            </div>
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
          {/* 모집 배지 줄 — `Badge` 기본값(`px-2 py-1` + `text-xs`)이라 24px이다. */}
          {framed ? <div className="h-6 w-20 rounded-sm bg-gray-100" /> : null}
          {hasCardFooter ? <div className="h-4 w-full rounded bg-gray-100" /> : null}
        </li>
      ))}
    </ul>
  );
}
