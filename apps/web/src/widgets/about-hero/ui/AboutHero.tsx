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
          {/* 공백은 inline-block에서 폭이 죽어 단어가 붙어버린다 */}
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}

/**
 * 소개 페이지 첫 화면. 글자가 아래에서 한 자씩 올라오고, 배경에서는 모션 그래픽이 돌면서
 * 아주 느리게 확대된다.
 *
 * 배경은 `public/about-hero-loop.mp4`다(1280×720, 10초 루프, 1.1MB). 원본에 붙어 있던 오디오
 * 트랙은 빼고 넣었다 — 배경 영상은 어차피 `muted`로 돌고, 없는 편이 파일이 작다.
 *
 * 출처: Pixabay, 내려받은 원본 파일명 `131999-751915336_medium.mp4`. Pixabay Content License라
 * 상업적 사용이 되고 저작자 표기 의무도 없다. 인물·상표·식별 가능한 사물이 없는 추상
 * 그라디언트라 별도 릴리스도 필요 없다.
 *
 * 한 가지 제약이 남는다. 이 라이선스는 콘텐츠를 상표나 디자인 마크의 일부로 쓰는 것을
 * 금지한다. 배경으로 까는 건 되지만, 이 영상의 한 프레임을 잘라 서비스 로고나 브랜드 마크에
 * 넣으면 안 된다. 브랜딩 작업에서는 이 재료를 빼야 한다.
 */
export function AboutHero() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      /*
       * 시작 위치는 여기서 잡는다. Tailwind의 `translate-y-*`를 쓰면 안 된다 — v4는 그걸
       * `transform`이 아니라 CSS `translate` 속성으로 내보내는데 GSAP은 `transform`을 쓴다.
       * 두 속성이 곱해져서 GSAP이 y를 0으로 되돌려도 요소가 제자리로 돌아오지 않는다.
       *
       * `useGSAP`은 `useLayoutEffect`에서 돌아 그리기 전에 끝난다. 그래서 여기서 옮겨도
       * 깜빡이지 않는다. 숨기는 일 자체는 클래스의 `opacity-0`이 맡는다 — JS가 늦어도
       * 반쯤 그려진 화면이 보이지 않는다.
       */
      gsap.set('[data-hero-char]', { yPercent: 100 });
      gsap.set('[data-hero-badge]', { y: 16 });
      gsap.set('[data-hero-sub]', { y: 24 });

      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

        intro
          .to('[data-hero-badge]', { opacity: 1, y: 0, duration: 0.6 })
          .to(
            '[data-hero-char]',
            { yPercent: 0, duration: 0.9, stagger: 0.028 },
            /* 배지가 다 뜨기 전에 글자가 따라 들어와야 한 동작으로 읽힌다 */
            '-=0.3',
          )
          .to('[data-hero-sub]', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
          .to('[data-hero-cue]', { opacity: 1, duration: 0.6 }, '-=0.3');

        /* 배경 영상이 아주 느리게 확대된다. 10초 루프가 되감기는 순간이 덜 눈에 띈다. */
        gsap.fromTo(
          '[data-hero-video]',
          { scale: 1.05 },
          { scale: 1.18, duration: 20, repeat: -1, yoyo: true, ease: 'sine.inOut' },
        );
      });

      /*
       * 움직임을 줄이는 설정에서는 최종 상태로 그냥 놓고 영상도 세운다. 화면 구성은 같고
       * 움직임만 빠진다 — 멈춘 영상은 첫 프레임이 그대로 배경이 된다.
       */
      media.add(`(prefers-reduced-motion: reduce)`, () => {
        gsap.set('[data-hero-char]', { yPercent: 0 });
        gsap.set('[data-hero-badge], [data-hero-sub], [data-hero-cue]', { opacity: 1, y: 0 });
        video.current?.pause();
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6"
    >
      {/*
        배경 모션 그래픽. `muted`가 없으면 브라우저가 자동재생을 막는다. `playsInline`은 iOS
        Safari가 영상을 전체화면으로 띄우는 걸 막는다. `poster`는 영상이 도착하기 전 첫 프레임을
        대신 보여줘 검은 화면이 스치지 않게 한다.
      */}
      <video
        ref={video}
        data-hero-video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/about-hero-poster.jpg"
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover"
      >
        <source src="/about-hero-loop.mp4" type="video/mp4" />
      </video>

      {/*
        글자는 짙은 회색(`gray-900`)이라 영상의 어두운 구석 위에서는 안 읽힌다. 그렇다고 전체를
        하얗게 덮으면 색이 다 날아가 배경을 쓰는 의미가 없어진다. 그래서 두 겹으로 나눈다 —
        전체는 옅게 씌워 하늘색을 남기고, 글자가 놓이는 가운데만 타원으로 희게 깐다.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/25" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_45%,rgba(255,255,255,0.6),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-white"
      />

      <div className="relative flex flex-col items-center text-center">
        <span
          data-hero-badge
          className="rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-blue-600 shadow-sm opacity-0"
        >
          오늘의 공고 · 준비 중
        </span>

        <h1
          className="mt-8 text-4xl leading-tight font-extrabold text-gray-900 sm:text-6xl lg:text-7xl"
          aria-label={HEADLINE_LINES.join(' ')}
        >
          {HEADLINE_LINES.map((line, index) => (
            <SplitLine key={line} text={line} lineIndex={index} />
          ))}
        </h1>

        <p
          data-hero-sub
          className="mt-8 max-w-xl text-base leading-relaxed text-gray-500 opacity-0 sm:text-lg"
        >
          채용공고와 교육 과정, 사이드 프로젝트까지. 커리어에 필요한 것들이 사이트마다 흩어져
          있습니다. 그걸 한 자리에 모으고 있습니다.
        </p>

        <span data-hero-cue className="mt-16 text-xs tracking-widest text-gray-500 opacity-0">
          아래로 스크롤
        </span>
      </div>
    </section>
  );
}
