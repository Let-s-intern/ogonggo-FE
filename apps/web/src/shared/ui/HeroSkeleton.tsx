import type { CSSProperties } from 'react';
import { HERO_HEIGHT } from '@/shared/lib/heroContent';

/**
 * 히어로 박스(`widgets/home-hero/ui/HomeHero.tsx`)의 자리만 잡는 스켈레톤.
 *
 * 히어로가 합성 PNG 한 장이던 시절엔 이미지 비율로 높이가 정해져 화면마다 `HERO_IMAGES`의
 * 크기를 따라갔다. 지금은 CSS로 그린 문구라 세 화면의 구조(배지 한 줄 + 헤드라인 두 줄)가 같고,
 * 높이도 `HERO_HEIGHT` 하나로 같이 쓴다(`shared/lib/heroContent.ts`). 모바일은 196px 이다 — 390px 폭에서
 * 잰 히어로 높이다.
 *
 * 맥동은 Tailwind `animate-pulse`이고, 같이 붙은 `ogonggo-skeleton`은
 * `prefers-reduced-motion: reduce`에서 그 맥동을 끄기 위한 표식이다(`app/globals.css`).
 */
export function HeroSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="ogonggo-skeleton mx-4 mt-4 h-[196px] animate-pulse self-stretch rounded-3xl bg-blue-50 md:mx-10 md:mt-6 md:h-(--hero-height)"
      style={{ '--hero-height': `${HERO_HEIGHT}px` } as CSSProperties}
    />
  );
}
