'use client';

import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';
import { SHOWCASE_COMPANIES } from '../model/companies';

/**
 * 한 줄에 회사명을 두 벌 이어 붙인다. 한 벌이 정확히 화면 밖으로 나간 순간 처음으로 되돌리면
 * 끊긴 자리가 안 보인다 — `xPercent: -50`을 반복하는 이유다.
 */
function Row({ reverse, speed }: { reverse: boolean; speed: number }) {
  const names = [...SHOWCASE_COMPANIES, ...SHOWCASE_COMPANIES];

  return (
    <div
      data-marquee-row
      data-marquee-reverse={reverse ? 'true' : 'false'}
      data-marquee-speed={speed}
      className="flex w-max gap-4"
    >
      {names.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold whitespace-nowrap text-gray-700 shadow-sm"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

/**
 * 수집 중인 회사 이름이 양방향으로 흐르는 띠.
 *
 * 로고 이미지가 아니라 텍스트를 쓴다. 크롤러가 모아 둔 `logoUrl`은 정식 로고 API가 아니라
 * 구글 이미지 캐시 썸네일이라(`entities/job/model/company-logo.ts` 주석) 공개 페이지에
 * 핫링크로 걸면 깨진다. 그리고 남의 로고를 늘어놓으면 없는 제휴 관계처럼 보인다. 회사명을
 * 글로 적는 건 "이런 회사 공고를 모읍니다"라는 사실 서술이라 그 문제가 없다.
 */
export function AboutMarquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-marquee-row]');

        for (const row of rows) {
          const reverse = row.dataset.marqueeReverse === 'true';
          const speed = Number(row.dataset.marqueeSpeed) || 30;

          /* 반대 방향 줄은 절반만큼 왼쪽에서 시작해 오른쪽으로 흐른다 */
          gsap.set(row, { xPercent: reverse ? -50 : 0 });
          gsap.to(row, {
            xPercent: reverse ? 0 : -50,
            duration: speed,
            repeat: -1,
            ease: 'none',
          });
        }
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section className="border-y border-gray-200 bg-blue-00 py-16">
      <p className="px-6 text-center text-sm text-gray-500">
        지금까지 이런 회사들의 공고를 모았습니다
      </p>
      {/* 겹치는 그라디언트로 양 끝을 흐린다 — 띠가 화면 밖에서 잘리는 게 아니라 사라지게 */}
      <div ref={root} className="relative mt-8 overflow-hidden">
        <div className="flex flex-col gap-4">
          <Row reverse={false} speed={38} />
          <Row reverse={true} speed={46} />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-blue-00 to-transparent sm:w-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-blue-00 to-transparent sm:w-40"
        />
      </div>
    </section>
  );
}
