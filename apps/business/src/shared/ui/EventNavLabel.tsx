import type { ReactNode } from 'react';

/**
 * 메뉴에서 이벤트 화면(출시 기념 무료 홍보)을 다른 메뉴와 달리 보이게 하는 이름표(2026-11-10 사용자). 앞에 깜빡이는
 * 점을 두고, 글자에 파랑에서 청록으로 흐르는 빛을 입힌다. 움직임 줄이기 설정에서는 멈춘 그라데이션으로 보인다.
 */
export function EventNavLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-blue-400 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
      </span>
      <span className="bg-[linear-gradient(90deg,var(--color-blue-500),var(--color-teal-500),var(--color-blue-500))] bg-[length:200%_100%] bg-clip-text font-semibold text-transparent motion-safe:animate-[ogonggo-biz-shimmer_3s_linear_infinite]">
        {children}
      </span>
    </span>
  );
}
