'use client';

import { useRef } from 'react';
import { MOTION_OK, gsap, useGSAP } from '@/shared/lib/gsap';

const HEADLINE_LINES = ['흩어진 공고를', '한 줄로 세웁니다'] as const;

/**
 * 글자 단위로 쪼개 stagger를 걸기 위한 분해. 스크린 리더가 글자를 하나씩 읽지 않도록 쪼갠
 * 조각은 `aria-hidden`으로 감추고, 읽을 문장은 바깥 컨테이너의 `aria-label`이 준다.
 */
function SplitLine({ text, lineIndex }: { text: string; lineIndex: number }) {
  return (
    <span className="block overflow-hidden py-1" aria-hidden="true">
      {[...text].map((char, index) => (
        <span key={`${lineIndex}-${index}`} data-hero-char className="inline-block">
          {/*
            일반 공백은 `inline-block` 안에서 접혀 폭이 0이 된다 — 실제로 "흩어진 공고를"이
            "흩어진공고를"로 붙어 나왔다. 줄바꿈 없는 공백(U+00A0)은 접히지 않는다.
          */}
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

/**
 * 소개 페이지 첫 화면. 로고와 배지가 뜨고 헤드라인이 한 자씩 올라온다.
 *
 * 배경 영상은 여기 없다 — `AboutBackdrop`이 페이지 전체 뒤에 하나로 깔고, 이 구간은 글자가
 * 놓이는 가운데만 흰 타원으로 덮어 대비를 만든다. 다섯 구간 중 배경이 가장 진하게 보이는
 * 자리다.
 */
export function AboutHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      /*
       * 시작 위치는 여기서 잡는다. Tailwind의 `translate-y-*`를 쓰면 안 된다 — v4는 그걸
       * `transform`이 아니라 CSS `translate` 속성으로 내보내는데 GSAP은 `transform`을 쓴다.
       * 두 속성이 곱해져서 GSAP이 y를 0으로 되돌려도 요소가 제자리로 돌아오지 않는다.
       *
       * `useGSAP`은 `useLayoutEffect`에서 돌아 그리기 전에 끝난다. 그래서 여기서 옮겨도
       * 깜빡이지 않는다. 숨기는 일 자체는 클래스의 `opacity-0`이 맡는다.
       */
      gsap.set('[data-hero-char]', { yPercent: 100 });
      gsap.set('[data-hero-logo]', { y: 12 });
      gsap.set('[data-hero-badge]', { y: 16 });
      gsap.set('[data-hero-sub]', { y: 24 });

      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .to('[data-hero-logo]', { opacity: 1, y: 0, duration: 0.7 })
          .to('[data-hero-badge]', { opacity: 1, y: 0, duration: 0.6 }, '-=0.35')
          .to(
            '[data-hero-char]',
            { yPercent: 0, duration: 0.9, stagger: 0.028 },
            /* 배지가 다 뜨기 전에 글자가 따라 들어와야 한 동작으로 읽힌다 */
            '-=0.3',
          )
          .to('[data-hero-sub]', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
          .to('[data-hero-cue]', { opacity: 1, duration: 0.6 }, '-=0.3');
      });

      /* 움직임을 줄이는 설정에서는 최종 상태로 그냥 놓는다. 화면 구성은 같고 움직임만 빠진다. */
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-hero-char]', { yPercent: 0 });
        gsap.set('[data-hero-logo], [data-hero-badge], [data-hero-sub], [data-hero-cue]', {
          opacity: 1,
          y: 0,
        });
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      {/*
        글자는 짙은 회색이라 영상의 어두운 구석 위에서는 안 읽힌다. 그렇다고 전체를 하얗게
        덮으면 색이 날아가 배경을 쓰는 의미가 없어진다. 그래서 가운데만 타원으로 희게 깐다.
        아래쪽은 다음 구간이 시작하는 흰색 농도에 맞춰 서서히 닫아 경계를 지운다.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_52%_at_50%_46%,rgba(255,255,255,0.74),rgba(255,255,255,0)_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-white/0 to-white/40"
      />

      <div className="relative flex flex-col items-center text-center">
        {/*
          심볼 + 워드마크. 심볼은 매니페스트(`app/manifest.ts`)가 홈 화면 아이콘으로 쓰는 것과
          같은 파일이다 — 로고를 두 벌 관리하지 않는다. 심볼 자체가 이미 `오늘의 공고`를
          가리키므로 `alt`는 비우고, 읽을 이름은 옆 글자가 준다.
        */}
        <span data-hero-logo className="flex items-center gap-2.5 opacity-0">
          <img src="/icon-512.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="flex items-baseline gap-2">
            <span className="about-display text-xl text-blue-500">오늘의 공고</span>
            <span className="about-label text-[10px] tracking-wider text-gray-500">
              BY LETS CAREER
            </span>
          </span>
        </span>

        {/* 알약 배지 대신 글자만 둔다. 버튼처럼 보이면 누를 수 있는 줄 안다. */}
        <span
          data-hero-badge
          className="about-label mt-6 text-xs tracking-[0.2em] text-blue-600 opacity-0"
        >
          준비 중
        </span>

        <h1
          className="about-display mt-6 text-4xl leading-tight text-blue-950 sm:text-6xl lg:text-7xl"
          aria-label={HEADLINE_LINES.join(' ')}
        >
          {HEADLINE_LINES.map((line, index) => (
            <SplitLine key={line} text={line} lineIndex={index} />
          ))}
        </h1>

        <p
          data-hero-sub
          className="mt-8 max-w-xl text-base leading-relaxed text-gray-600 opacity-0 sm:text-lg"
        >
          채용공고와 교육 과정, 사이드 프로젝트까지. 커리어에 필요한 것들이 사이트마다 흩어져
          있습니다. 그걸 한 자리에 모으고 있습니다.
        </p>

        <span
          data-hero-cue
          className="about-label mt-16 text-xs tracking-widest text-gray-500 opacity-0"
        >
          아래로 스크롤
        </span>
      </div>
    </section>
  );
}
