'use client';

import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';
import { SHOWCASE_COMPANIES } from '../model/companies';

/**
 * 한 줄에 회사명을 두 벌 이어 붙인다. 한 벌이 정확히 화면 밖으로 나간 순간 처음으로 되돌리면
 * 끊긴 자리가 안 보인다 — `xPercent: -50`을 반복하는 이유다.
 */
function Row({ reverse, speed, muted }: { reverse: boolean; speed: number; muted?: boolean }) {
  const names = [...SHOWCASE_COMPANIES, ...SHOWCASE_COMPANIES];

  return (
    <div
      data-marquee-row
      data-marquee-reverse={reverse ? 'true' : 'false'}
      data-marquee-speed={speed}
      className={`about-display flex w-max items-center gap-8 text-2xl whitespace-nowrap sm:gap-12 sm:text-4xl ${
        muted ? 'text-blue-950/35' : 'text-blue-950/70'
      }`}
    >
      {names.map((name, index) => (
        <span key={`${name}-${index}`} className="flex items-center gap-8 sm:gap-12">
          {name}
          {/* 이름 사이 구분점. 글자가 아니라 기호라 스크린 리더가 읽을 필요가 없다. */}
          <span aria-hidden="true" className="text-blue-500/40">
            ·
          </span>
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
 * 핫링크로 걸면 깨진다. 실제 로고 파일을 갖추려면 회사마다 브랜드 페이지에서 내려받아
 * 저장해야 하는데, 위키미디어 공용에서 라이선스가 확인되는 것은 열여섯 중 다섯뿐이라
 * 절반이 빈 로고월이 된다.
 *
 * 처음에는 이름을 알약 칩에 하나씩 담았는데 배경 영상 위에서 흰 알약이 줄줄이 떠 있는 모양이
 * 지저분했다. 칩을 걷어내고 큰 글자만 흐르게 하면 배경이 그대로 비쳐 한 화면으로 읽힌다.
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
    <section className="bg-gradient-to-b from-white/40 via-white/70 to-white/80 py-20">
      <p className="about-label px-6 text-center text-xs tracking-[0.2em] text-blue-600">
        지금까지 이런 회사들의 공고를 모았습니다
      </p>
      {/* 겹치는 그라디언트로 양 끝을 흐린다 — 띠가 화면 밖에서 잘리는 게 아니라 사라지게 */}
      <div ref={root} className="relative mt-10 overflow-hidden">
        <div className="flex flex-col gap-3">
          <Row reverse={false} speed={44} />
          <Row reverse={true} speed={56} muted />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/85 to-white/0 sm:w-56"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/85 to-white/0 sm:w-56"
        />
      </div>
    </section>
  );
}
