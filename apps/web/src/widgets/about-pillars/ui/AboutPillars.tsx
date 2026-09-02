'use client';

import { useRef } from 'react';
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '@/shared/lib/gsap';
import { PILLARS } from '../model/pillars';

/**
 * 세 갈래를 스크롤에 맞춰 하나씩 올린다. 카드가 아니라 가로줄로 나눠 둔다 — 목록형 카드는
 * 사용자 웹 쪽 화면들이 이미 쓰고 있어서, 소개 페이지까지 같은 모양이면 밋밋하다.
 */
export function AboutPillars() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set('[data-pillar]', { y: 40 });
      gsap.set('[data-pillar-index]', { x: -24 });

      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-pillar]');

        for (const row of rows) {
          gsap.to(row, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: row,
              /* 줄의 위쪽이 화면 아래 80% 지점에 닿을 때. 화면 한복판까지 기다리면 스크롤이
                 빠를 때 이미 다 지나간 뒤에 뜬다. */
              start: 'top 80%',
            },
          });

          /* 번호는 줄보다 살짝 늦게, 더 크게 움직여 깊이가 생긴다 */
          const index = row.querySelector('[data-pillar-index]');
          if (index) {
            gsap.to(index, {
              opacity: 1,
              x: 0,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: { trigger: row, start: 'top 80%' },
              delay: 0.15,
            });
          }
        }
      });

      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-pillar]', { opacity: 1, y: 0 });
        gsap.set('[data-pillar-index]', { opacity: 1, x: 0 });
      });

      return () => {
        media.revert();
        /* 이 컴포넌트가 만든 트리거만 정리된다 — useGSAP의 scope 안에서 만들어졌기 때문 */
        ScrollTrigger.refresh();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="bg-gradient-to-b from-white/80 via-white/92 to-white/80 px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <h2 className="about-label text-sm tracking-widest text-blue-600">무엇을 모으나</h2>

        <div className="mt-16 flex flex-col">
          {PILLARS.map((pillar, index) => (
            <div
              key={pillar.label}
              data-pillar
              className="flex flex-col gap-4 border-t border-gray-200 py-12 opacity-0 sm:flex-row sm:gap-10"
            >
              <span
                data-pillar-index
                className="about-display text-5xl text-blue-200 opacity-0 sm:text-6xl"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <p className="about-label text-sm text-blue-600">{pillar.label}</p>
                <p className="about-strong mt-3 text-2xl text-blue-950 sm:text-3xl">{pillar.headline}</p>
                <p className="mt-4 max-w-xl leading-relaxed text-gray-600">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
