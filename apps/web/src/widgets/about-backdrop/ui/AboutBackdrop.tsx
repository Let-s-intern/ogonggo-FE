'use client';

import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';

/**
 * 페이지 전체 뒤에 깔리는 하나짜리 배경 영상.
 *
 * 구간마다 `<video>`를 따로 두면 경계에서 영상이 끊기고 재생 위치도 서로 어긋난다. 화면에
 * 고정된 영상 하나를 두고 각 구간이 그 위를 서로 다른 농도의 흰색으로 덮으면, 스크롤하는
 * 동안 배경이 한 번도 끊기지 않는다. 내려받는 파일도 하나뿐이다.
 *
 * `fixed`라 스크롤해도 제자리에 있고, 그 위로 내용이 지나간다. 구간 사이가 자연스럽게
 * 이어지는 것은 각 구간이 위아래 가장자리의 흰색 농도를 이웃과 맞춘 그라디언트를 쓰기
 * 때문이다(`views/about/ui/AboutPage.tsx`의 구간별 배경 참고).
 *
 * 영상 출처와 라이선스는 `widgets/about-hero/ui/AboutHero.tsx` 주석에 적어 두었다.
 */
export function AboutBackdrop() {
  const video = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        /* 아주 느린 확대. 10초 루프가 되감기는 순간을 덜 눈에 띄게 한다. */
        gsap.fromTo(
          video.current,
          { scale: 1.06 },
          { scale: 1.2, duration: 24, repeat: -1, yoyo: true, ease: 'sine.inOut' },
        );
      });

      media.add('(prefers-reduced-motion: reduce)', () => {
        video.current?.pause();
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden bg-white">
      {/*
        `saturate`와 `contrast`를 올린다. 원본을 그대로 깔면 흰색을 덮었을 때 파랑이 회색으로
        내려앉아 화면이 탁해 보였다. 색을 살려두고 덮어야 맑게 남는다.
      */}
      <video
        ref={video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/about-hero-poster.jpg"
        className="h-full w-full scale-105 object-cover [filter:saturate(1.35)_contrast(1.08)_brightness(1.04)]"
      >
        <source src="/about-hero-loop.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
