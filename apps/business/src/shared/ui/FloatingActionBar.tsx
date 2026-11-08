import { cn } from '@ogonggo/ui';
import type { ReactNode } from 'react';

/**
 * 모바일에서 화면 아래에 떠 있는 둥근 판의 모양. 이 컴포넌트와 상세 화면의 신청하기 바
 * (`StickyApplyBar`)가 같은 판을 쓴다. 화면 폭 전체를 덮는 띠로 두면 푸터처럼 읽혀 버튼보다 띠가 먼저
 * 보였다. 하단 내비게이션이 떠 있으면 가운데 동그라미(약 84px) 위로 오른다. 데스크톱 모양은 쓰는 쪽이
 * `md:` 로 덮는다.
 */
export const FLOATING_BAR =
  'fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(17,24,39,0.12)] max-md:[body:has([data-bottom-nav])_&]:bottom-[calc(84px+0.75rem+env(safe-area-inset-bottom))]';

export interface FloatingActionBarProps {
  /** 버튼 위(데스크톱은 왼쪽)에 한 줄로 띄울 말. 모자란 칸이나 저장 실패 이유다. */
  error?: string | null;
  /** 오류가 없을 때 흐리게 띄울 말. 임시저장 시각이다. */
  status?: string;
  /**
   * 데스크톱에서의 자리. `floating` 은 내용 칸 아래에 붙어 떠 있는 작은 판(`sticky`)이고, 내용 끝에
   * 닿으면 제자리에 멈춘다. `inline` 은 띄우지 않고 놓인 자리에 버튼만 가운데 정렬로 둔다 — 내용이 짧아
   * 끝까지 내릴 일이 없는 화면(공고달력 직무 선택)에 쓴다.
   */
  desktop?: 'floating' | 'inline';
  className?: string;
  children: ReactNode;
}

/**
 * 화면 아래에 떠 있는 버튼 줄. 긴 내용의 맨 끝까지 내려가지 않아도 저장·확인할 수 있게 한다
 * (기업 공고 폼 둘과 모집글 폼의 `임시저장` · `등록`, 공고달력 직무 선택의 `공고보기` · `초기화`).
 *
 * 모바일은 화면 가장자리에서 띄운 둥근 판이다(`FLOATING_BAR`). `data-sticky-apply-bar` 를 달아 의견
 * 버튼(`ServiceFeedbackButton`)이 이 판 위로 비켜나게 한다.
 * 내용 끝이 가리지 않도록 부르는 쪽이 아래 여백을 둔다.
 *
 * 데스크톱 `floating` 은 버튼 크기에 맞춘 판을 가운데에 띄운다. 폼 폭만큼 넓히면 버튼 둘만 든 빈
 * 카드가 하나 더 있는 것처럼 보였다. 가운데라 오른쪽 아래 의견 버튼과도 겹치지 않는다.
 *
 * 오류 문구도 이 줄에 둔다. 폼 맨 끝에 두면 중간에서 버튼을 누른 사람은 왜 저장되지 않았는지 보지 못한다.
 */
export function FloatingActionBar({
  error,
  status,
  desktop = 'floating',
  className,
  children,
}: FloatingActionBarProps) {
  return (
    <div
      data-sticky-apply-bar
      className={cn(
        FLOATING_BAR,
        'flex flex-col gap-2',
        desktop === 'floating'
          ? 'md:sticky md:inset-x-auto md:bottom-6 md:z-20 md:mx-auto md:w-fit md:max-w-full md:flex-row md:items-center md:gap-4 md:p-2'
          : 'md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        className,
      )}
    >
      {error ? (
        <p role="alert" className="text-center text-sm text-error md:pl-3 md:text-left">
          {error}
        </p>
      ) : status ? (
        <p role="status" className="text-center text-xs text-gray-400 md:pl-3 md:text-left">
          {status}
        </p>
      ) : null}
      <div className={cn('flex gap-2', desktop === 'inline' && 'md:justify-center md:gap-3')}>
        {children}
      </div>
    </div>
  );
}
