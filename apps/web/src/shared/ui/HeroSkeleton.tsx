import { HERO_IMAGES, type HeroScreen } from '@/shared/lib/heroImages';

export interface HeroSkeletonProps {
  /** 어느 화면의 히어로 자리인지. 홈만 20px 더 높다. */
  screen: HeroScreen;
}

/**
 * 히어로 박스(`widgets/home-hero/ui/HomeHero.tsx`)의 자리만 잡는 스켈레톤.
 *
 * v3에서 히어로가 이미지 한 장이 되면서 높이가 이미지 비율로 정해진다. 안쪽 요소의
 * line-height를 따라가던 예전 방식 대신 `HERO_IMAGES`의 크기를 그대로 써서 비율을 맞춘다 —
 * `aspect-ratio`를 인라인 스타일로 주는 이유는 Tailwind v4가 소스에 그대로 적힌 클래스만
 * 만들어서, 화면마다 다른 비율을 클래스로 쓸 수 없기 때문이다.
 *
 * 맥동은 Tailwind `animate-pulse`이고, 같이 붙은 `ogonggo-skeleton`은
 * `prefers-reduced-motion: reduce`에서 그 맥동을 끄기 위한 표식이다(`app/globals.css`).
 */
export function HeroSkeleton({ screen }: HeroSkeletonProps) {
  const { width, height } = HERO_IMAGES[screen];

  return (
    <div
      aria-hidden="true"
      className="ogonggo-skeleton mx-10 mt-6 animate-pulse self-stretch rounded-xl bg-blue-50"
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  );
}
