import { cn } from '@ogonggo/ui';
import type { ReactNode } from 'react';
import { FLOATING_BAR } from './FloatingActionBar';

export interface StickyApplyBarProps {
  /** 모바일 바 윗줄. 마감 일시와 D-day 배지다. 데스크톱에서는 헤더 카드가 같은 것을 보여 준다. */
  summary?: ReactNode;
  /** `ApplyCta`. */
  children: ReactNode;
}

/**
 * 상세 화면의 지원 버튼 자리. 모바일에서는 화면 아래에 붙고
 * (`docs/asset/v9 mobile/채용공고 상세  플로팅버튼.png`), 데스크톱에서는 사이드바 안의 제자리로
 * 돌아온다.
 *
 * 하나의 요소가 자리만 바꾼다. 모바일용과 데스크톱용을 따로 두고 한쪽을 숨기면 북마크 버튼이 둘
 * 생기고, 한쪽에서 누른 상태가 다른 쪽에 반영되지 않는다.
 *
 * 바가 본문 끝을 가리지 않도록 상세 화면의 `<main>` 이 모바일에서 아래 여백을 넉넉히 둔다.
 *
 * 모바일 판 모양은 다른 화면의 하단 버튼 줄과 같은 떠 있는 둥근 판이다(`FloatingActionBar` 의
 * `FLOATING_BAR`). v12 시안(`docs/asset/v12 채용공고 상세/모바일 상세 하단 고정바.png`)의 화면 폭 흰 바는
 * 푸터처럼 읽혀 바꿨다. 윗줄은 시안대로 12px `gray-600` 마감 문구와 D-day 배지다. 채용공고·부트캠프·사이드
 * 스터디 상세 셋이 한 모양을 쓴다.
 */
export function StickyApplyBar({ summary, children }: StickyApplyBarProps) {
  return (
    <div
      data-sticky-apply-bar
      className={cn(
        FLOATING_BAR,
        'md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none',
      )}
    >
      {summary ? (
        <div className="mb-2 flex items-center justify-center gap-3 text-xs text-gray-600 md:hidden">
          {summary}
        </div>
      ) : null}
      {children}
    </div>
  );
}
