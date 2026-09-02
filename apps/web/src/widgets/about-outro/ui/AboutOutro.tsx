'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';

/**
 * 마지막 화면. 스크롤이 이 구간에 들어오면 문구가 커지면서 자리를 잡는다.
 *
 * 배경 영상은 여기 없다 — `AboutBackdrop`이 페이지 전체에 하나로 깔고, 이 구간은 히어로 다음으로
 * 옅게 덮어 배경이 다시 드러나게 한다. 첫 화면과 끝 화면이 같은 밝기로 묶인다.
 *
 * 마지막에 데모로 넘어가는 링크가 하나 있다. 처음에는 기존 웹과 상호 링크를 두지 않기로
 * 했지만(이슈 #18), 티저를 본 사람이 실제 화면을 볼 수 있어야 한다는 판단으로 바꿨다. 나가는
 * 링크만 있고 기존 웹에서 이 페이지로 들어오는 링크는 여전히 없다.
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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-white/45 via-white/35 to-white/55 px-6 text-center"
    >
      {/* 글자 뒤만 희게 깔아 대비를 만든다. 구간 전체를 덮으면 배경이 다시 탁해진다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgba(255,255,255,0.72),rgba(255,255,255,0)_70%)]"
      />

      <p
        data-outro-line
        className="about-display relative text-4xl text-blue-950 opacity-0 sm:text-6xl"
      >
        곧 만나요
      </p>
      <p
        data-outro-line
        className="relative mt-8 max-w-md leading-relaxed text-gray-600 opacity-0"
      >
        오늘의 공고는 준비 중입니다. 취업 준비에 드는 시간을 공고 찾는 데 쓰지 않아도 되게
        만들고 있습니다.
      </p>
      <Link
        data-outro-line
        href="/"
        className="about-label relative mt-10 rounded-full bg-blue-500 px-7 py-3.5 text-sm text-white opacity-0 shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-600"
      >
        데모 확인하기
      </Link>

      <p
        data-outro-line
        className="about-label relative mt-16 text-xs tracking-widest text-gray-500 opacity-0"
      >
        오늘의 공고 · BY LETS CAREER
      </p>
    </section>
  );
}
