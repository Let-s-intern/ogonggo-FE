'use client';

import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';
import { COLLECTED } from '../model/collected';

const STATS = [
  { value: COLLECTED.companies, unit: '개', label: '수집한 회사' },
  { value: COLLECTED.postings, unit: '건', label: '모은 채용공고' },
] as const;

/**
 * 숫자가 0에서 올라가며 세어지는 구간.
 *
 * 두 숫자는 실시간 집계가 아니라 스냅샷 값이다(`model/collected.ts`). 라이브 카운터로 오해받지
 * 않게 제목에 "지금까지"를 넣는다 — 없는 규모를 주장하지 않는 것이 이 페이지에서 제일 중요하다.
 */
export function AboutStats() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const numbers = gsap.utils.toArray<HTMLElement>('[data-stat-value]');

        for (const node of numbers) {
          const target = Number(node.dataset.statValue);
          /* counter 객체를 트윈하고 onUpdate에서 그려 넣는다. 텍스트 노드는 직접 트윈이 안 된다 */
          const counter = { current: 0 };

          gsap.to(counter, {
            current: target,
            duration: 1.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: node, start: 'top 85%' },
            onUpdate: () => {
              node.textContent = Math.round(counter.current).toLocaleString('ko-KR');
            },
          });
        }
      });

      media.add('(prefers-reduced-motion: reduce)', () => {
        /* 세지 않고 최종 값만 박아 둔다 */
        for (const node of gsap.utils.toArray<HTMLElement>('[data-stat-value]')) {
          node.textContent = Number(node.dataset.statValue).toLocaleString('ko-KR');
        }
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="bg-gradient-to-b from-white/80 via-white/62 to-white/45 px-6 py-32"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="about-label text-sm tracking-widest text-blue-600">지금까지</h2>

        <div className="mt-14 flex flex-col justify-center gap-16 sm:flex-row sm:gap-24">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="about-display text-6xl text-blue-950 tabular-nums sm:text-7xl">
                {/* 초기값 0. 스크롤이 닿으면 GSAP이 textContent를 갈아 끼운다 */}
                <span data-stat-value={stat.value}>0</span>
                <span className="ml-1 text-3xl text-blue-500 sm:text-4xl">{stat.unit}</span>
              </p>
              <p className="about-label mt-4 text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-xs text-gray-500">
          크롤러가 실제로 수집한 데이터 기준입니다. 실시간 집계가 아닙니다.
        </p>
      </div>
    </section>
  );
}
