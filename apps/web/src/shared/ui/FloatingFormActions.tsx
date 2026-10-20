import type { ReactNode } from 'react';

export interface FloatingFormActionsProps {
  /** 버튼 위에 한 줄로 띄울 말. 모자란 칸이나 저장 실패 이유다. */
  error?: string | null;
  /** 오류가 없을 때 버튼 위에 흐리게 띄울 말. 임시저장 시각이다. */
  status?: string;
  children: ReactNode;
}

/**
 * 폼 아래에 떠 있는 버튼 줄(기업 공고 폼 둘의 `임시저장` · `공고 등록`). 긴 폼의 맨 끝까지 내려가지
 * 않아도 저장할 수 있게 한다.
 *
 * 모바일은 화면 아래에 붙는다(`StickyApplyBar` 와 같은 자리 규칙). 하단 내비게이션이 떠 있으면 그
 * 바로 위로 오르고, `data-sticky-apply-bar` 를 달아 의견 버튼(`ServiceFeedbackButton`)이 이 줄 위로
 * 비켜나게 한다. 폼 끝이 가리지 않도록 부르는 쪽이 아래 여백을 둔다.
 *
 * 데스크톱은 폼 칸 안에서 아래에 붙어 떠 있다(`sticky`). 폼 끝에 닿으면 제자리에 멈춘다.
 *
 * 오류 문구도 이 줄에 둔다. 폼 맨 끝에 두면 중간에서 버튼을 누른 사람은 왜 저장되지 않았는지 보지 못한다.
 *
 * 버튼은 가운데 정렬이다. 오른쪽 끝에 두면 폼 칸 가운데로 읽어 내려온 눈이 버튼을 찾아 옆으로 가야 한다.
 */
export function FloatingFormActions({ error, status, children }: FloatingFormActionsProps) {
  return (
    <div
      data-sticky-apply-bar
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] max-md:[body:has([data-bottom-nav])_&]:bottom-[calc(64px+env(safe-area-inset-bottom))] max-md:[body:has([data-bottom-nav])_&]:pb-3 md:sticky md:inset-x-auto md:bottom-6 md:z-20 md:rounded-md md:border md:px-5 md:py-4 md:shadow-lg"
    >
      {error ? (
        <p role="alert" className="pb-2 text-center text-sm text-error md:pb-3">
          {error}
        </p>
      ) : status ? (
        <p role="status" className="pb-2 text-center text-xs text-gray-400 md:pb-3">
          {status}
        </p>
      ) : null}
      <div className="flex gap-2 md:justify-center md:gap-3">{children}</div>
    </div>
  );
}
