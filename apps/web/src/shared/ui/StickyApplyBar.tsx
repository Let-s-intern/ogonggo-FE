import type { ReactNode } from 'react';

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
 * 하단 내비게이션(`data-bottom-nav`, 앱 설치 + 로그인)이 떠 있으면 그 바로 위에 올라앉는다. 화면 아래
 * 안전 영역은 내비게이션이 채우므로 이 바의 아래 여백에서는 뺀다.
 */
export function StickyApplyBar({ summary, children }: StickyApplyBarProps) {
  return (
    <div
      data-sticky-apply-bar
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:z-auto md:border-0 md:bg-transparent md:p-0 max-md:[body:has([data-bottom-nav])_&]:bottom-[calc(64px+env(safe-area-inset-bottom))] max-md:[body:has([data-bottom-nav])_&]:pb-3"
    >
      {summary ? (
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-gray-500 md:hidden">
          {summary}
        </div>
      ) : null}
      {children}
    </div>
  );
}
