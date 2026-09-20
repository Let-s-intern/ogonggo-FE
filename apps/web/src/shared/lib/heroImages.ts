/**
 * 히어로 이미지 세 장(`public/hero/`). 원본은 `docs/asset/v3 변경사항/hero/`의 2배 해상도
 * PNG이고, 둥근 모서리가 투명으로 들어가 있어 CSS 라운드를 따로 주지 않는다.
 *
 * `widgets/home-hero/ui/HomeHero.tsx`와 `shared/ui/HeroSkeleton.tsx`가 같은 값을 본다. 로딩
 * 자리와 실제 히어로의 높이가 어긋나면 안 되는데, `shared`는 `widgets`를 가져다 쓸 수 없어서
 * (FSD) 공통 자리가 여기다.
 *
 * `width`·`height`는 원본의 절반이다. 1440px 화면에서 히어로 박스(`mx-10`)가 차지하는 폭이
 * 1360px이라 표시 크기와 같다. 홈만 20px 더 높다.
 */
export const HERO_IMAGES = {
  jobs: { src: '/hero/jobs.png', width: 1360, height: 328 },
  bootcamps: { src: '/hero/bootcamps.png', width: 1360, height: 308 },
  'side-studies': { src: '/hero/side-studies.png', width: 1360, height: 308 },
} as const;

export type HeroScreen = keyof typeof HERO_IMAGES;
