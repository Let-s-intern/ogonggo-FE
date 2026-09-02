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
}

/**
 * 카드 4열 그리드의 스켈레톤. 채용공고·부트캠프·사이드·스터디 카드가 여백과 글자 크기를
 * 공유해서(`entities/job/ui/JobCard.tsx`의 주석 참고) 한 벌로 셋 다 덮는다.
 *
 * 카드 한 장은 `aspect-[8/5]` 썸네일 + 메타 줄 + 회사명·닉네임 줄 + 제목 두 줄이다. 실측
 * 271.5px(사이드·스터디는 아래 한 줄이 더 붙어 295.5px)이고, 목록 화면 둘에서 실제 카드와
 * 0px로 일치했다.
 *
 * 카드 높이를 실제와 맞추는 기준은 한 장이 아니라 행이다 — `ul`이 그리드라 같은 행의 `li`는
 * 가장 높은 카드에 맞춰 늘어난다. 그래서 제목은 최대인 두 줄(40px)로 그린다. 한 행의 제목이
 * 전부 한 줄인 경우에만 그 행이 20px 짧아진다.
 */
export function CardGridSkeleton({ count, gapClass, hasCardFooter = false }: CardGridSkeletonProps) {
  return (
    <ul className={cn('grid grid-cols-2 md:grid-cols-4', gapClass)}>
      {Array.from({ length: count }, (_, index) => (
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
          {hasCardFooter ? <div className="h-4 w-full rounded bg-gray-100" /> : null}
        </li>
      ))}
    </ul>
  );
}
