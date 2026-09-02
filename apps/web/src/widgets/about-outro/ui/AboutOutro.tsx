'use client';

import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';

/**
 * 마지막 화면. 스크롤이 이 구간에 들어오면 문구가 커지면서 자리를 잡는다.
 *
 * 링크가 하나도 없다. 이 페이지는 기존 웹과 상호 링크를 두지 않기로 했고(이슈 #18), 아직
 * 서비스가 열리지 않아 보낼 곳도 없다. 눌리지 않는 버튼을 놓아 두는 것보다 아예 없는 편이 낫다.
 */
export function AboutOutro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set('[data-outro-line]', { y: 32, scale: 0.95 });

      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        gsap.to('[data-outro-line]', {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        });
      });

      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-outro-line]', { opacity: 1, y: 0, scale: 1 });
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-950 px-6 text-center"
    >
      {/*
        히어로와 같은 영상을 다시 쓴다 — 브라우저 캐시에 이미 있어 추가 전송이 없고, 첫 화면과
        끝 화면이 같은 재료로 묶인다. 여기서는 훨씬 어둡고 흐리게 깔아 배경으로만 남긴다.
      */}
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/about-hero-poster.jpg"
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-2xl"
      >
        <source src="/about-hero-loop.mp4" type="video/mp4" />
      </video>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gray-950/60" />
      <p
        data-outro-line
        className="relative text-4xl font-extrabold text-white opacity-0 sm:text-6xl"
      >
        곧 만나요
      </p>
      <p
        data-outro-line
        className="relative mt-8 max-w-md leading-relaxed text-gray-500 opacity-0"
      >
        오늘의 공고는 준비 중입니다. 취업 준비에 드는 시간을 공고 찾는 데 쓰지 않아도 되게
        만들고 있습니다.
      </p>
      <p
        data-outro-line
        className="relative mt-20 text-xs tracking-widest text-gray-700 opacity-0"
      >
        오늘의 공고 · BY LETS CAREER
      </p>
    </section>
  );
}
