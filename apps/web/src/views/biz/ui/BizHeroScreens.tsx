'use client';

import Image from 'next/image';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@ogonggo/ui';
import { HERO_SCREENS } from '../model/content';

/** 한 화면에 머무는 시간. 진행 막대가 이 시간 동안 차고, 다 차면 다음 화면이다. */
const DWELL_MS = 4000;
/** 겹쳐 사라지는 시간(PRD 2절). */
const FADE_MS = 600;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(listener: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function subscribeVisibility(listener: () => void): () => void {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

/**
 * 히어로 오른쪽 브라우저 틀. 채용공고 목록 → 공고 상세 → 부트캠프 목록 → 부트캠프 상세 캡처를 차례로 보인다.
 *
 * 실제 페이지를 iframe 으로 띄우지 않고 캡처(`public/biz/*.webp`)를 쓴다. 로딩이 무겁고 로그인 상태·팝업이
 * 섞여 들어온다(PRD 2절).
 *
 * 시계는 타이머가 아니라 진행 막대의 CSS 애니메이션이다. 막대가 다 차면(`animationend`) 다음 화면으로 간다.
 * 그래서 멈춤(마우스를 올림, 탭이 안 보임)은 막대와 스크롤의 `animation-play-state` 하나로 끝나고, 다시
 * 움직이면 멈춘 자리에서 잇는다.
 *
 * 애니메이션은 하이드레이션 뒤에 켠다. 서버 렌더 직후 막대가 먼저 다 차 버리면 그 `animationend` 를 받을
 * 핸들러가 아직 없어 화면이 멈춘다. `prefers-reduced-motion` 이면 켜지 않는다 — 첫 화면에 머문다.
 * 탭은 그때도 누를 수 있고, 전환 없이 바로 바뀐다.
 *
 * GSAP 대신 CSS 를 쓴 이유: 네 장을 겹쳐 놓고 투명도·확대·스크롤만 바꾸는 일이라 브라우저 전환으로 충분하다.
 */
export function BizHeroScreens({ onSelect }: { onSelect?: (key: string) => void }) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'hidden',
    () => false,
  );
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(0);
  /** 사라지는 중인 화면. 겹쳐 사라지는 동안 스크롤 위치를 지키려고 애니메이션을 떼지 않는다. */
  const [previous, setPrevious] = useState<number | null>(null);
  /** 화면마다 몇 번째로 켜졌는지. 다시 켜질 때 스크롤 애니메이션을 처음부터 돌리려고 `key` 로 쓴다. */
  const [runs, setRuns] = useState<number[]>(() => HERO_SCREENS.map(() => 0));

  useEffect(() => setMounted(true), []);

  const animated = mounted && !reducedMotion;
  const playState = hovered || hidden ? 'paused' : 'running';

  const show = (index: number) => {
    setPrevious(index === active ? null : active);
    setActive(index);
    setRuns((current) => current.map((run, i) => (i === index ? run + 1 : run)));
  };

  const screen = HERO_SCREENS[active] ?? HERO_SCREENS[0];

  return (
    <div
      className="lg:-mr-[120px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_32px_64px_-24px_rgba(30,51,102,0.28),0_0_0_1px_rgba(17,24,39,0.06)]">
        <div className="flex h-10 items-center gap-[7px] border-b border-gray-150 bg-gray-100 px-4">
          <span className="size-[11px] rounded-full bg-gray-300" />
          <span className="size-[11px] rounded-full bg-gray-300" />
          <span className="size-[11px] rounded-full bg-gray-300" />
          <div
            className="ml-3.5 flex h-[26px] max-w-[340px] flex-1 items-center truncate rounded-lg bg-white px-3 text-xs tracking-normal text-gray-500"
            aria-live="polite"
          >
            {screen.address}
          </div>
        </div>
        {/*
          틀 안 보이는 높이. 키프레임 `ogonggo-biz-screen-scroll` 이 `--biz-view-h` 로 받는다. 좁은 화면에서는
          그림 높이(폭 x 1800/1280)보다 낮아야 스크롤이 거꾸로 가지 않는다.
        */}
        <div className="relative h-(--biz-view-h) overflow-hidden [--biz-view-h:280px] sm:[--biz-view-h:380px] lg:[--biz-view-h:460px]">
          {HERO_SCREENS.map((item, index) => {
            const isActive = index === active;
            return (
              <div
                key={item.key}
                aria-hidden={!isActive}
                className={cn(
                  'absolute inset-0',
                  animated && 'transition-[opacity,transform] ease-out',
                  isActive ? 'z-10 scale-100 opacity-100' : 'z-0 scale-[1.04] opacity-0',
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
              >
                <div
                  key={runs[index]}
                  style={
                    animated && (isActive || index === previous)
                      ? {
                          animation: `ogonggo-biz-screen-scroll ${DWELL_MS - FADE_MS * 2}ms ease-in-out ${FADE_MS}ms forwards`,
                          animationPlayState: playState,
                        }
                      : undefined
                  }
                >
                  <Image
                    src={item.src}
                    alt={`오늘의 공고 ${item.label} 화면`}
                    width={item.width}
                    height={item.height}
                    sizes="(min-width: 1024px) 640px, 100vw"
                    priority={index === 0}
                    className="block h-auto w-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div role="tablist" aria-label="오늘의 공고 화면" className="mt-4 grid grid-cols-4 gap-2">
        {HERO_SCREENS.map((item, index) => {
          const isActive = index === active;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                show(index);
                onSelect?.(item.key);
              }}
              className={cn(
                'flex flex-col gap-2 text-left text-xs font-semibold md:text-[13px]',
                isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <span className="h-[3px] w-full overflow-hidden rounded-full bg-gray-200">
                {isActive ? (
                  <span
                    key={runs[index]}
                    className="block h-full origin-left bg-blue-500"
                    style={
                      animated
                        ? {
                            animation: `ogonggo-biz-progress ${DWELL_MS}ms linear forwards`,
                            animationPlayState: playState,
                          }
                        : undefined
                    }
                    onAnimationEnd={() => show((index + 1) % HERO_SCREENS.length)}
                  />
                ) : null}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
