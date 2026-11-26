import type { ReactNode } from 'react';

/**
 * 헤더 `산업 리포트` 글자와 그 오른쪽 위에서 은은하게 반짝이는 별 둘. 렛츠커리어 올인원패스 메뉴의 별
 * (`MembershipNavLabel`)과 같은 방식이다 — 속이 찬 4각 별이 크기·회전·투명도로 깜빡이고 둘이 엇갈린다.
 * 글자 위의 샤인 효과는 가져오지 않았다(약하게, 그리고 글자 색은 메뉴 상태가 정한다).
 *
 * 별은 글자 상자에 `absolute` 로 얹혀서 메뉴 폭·높이에 들어가지 않는다 — 별이 있어도 메뉴와 옆 항목의 자리는
 * 그대로다. 장식이라 `aria-hidden` 이고 누를 수 없다(`pointer-events-none`). 움직이는 것은 `motion-safe` 일 때뿐이고
 * 움직임을 줄인 환경에서는 옅은 별이 가만히 있다(`opacity-60`). 키프레임은 `app/globals.css` 의 `ogonggo-nav-sparkle`.
 */
export function ReportNavLabel({ children }: { children: ReactNode }) {
  return (
    <span className="relative">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 -right-3.5 icon-[mdi--star-four-points] size-3 text-blue-500 opacity-60 motion-safe:animate-nav-sparkle"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 -right-5 icon-[mdi--star-four-points] size-2 text-blue-400 opacity-60 motion-safe:animate-nav-sparkle-late"
      />
    </span>
  );
}
