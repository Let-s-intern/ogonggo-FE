'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * ScrollTrigger 등록은 한 번만 하면 되는데, 모듈이 여러 컴포넌트에서 import 되므로 여기서
 * 한다. `gsap.registerPlugin`은 같은 플러그인을 다시 넣어도 문제가 없지만, 등록을 각
 * 컴포넌트에 흩어 두면 하나를 빼먹었을 때 그 컴포넌트만 조용히 안 움직인다.
 *
 * `'use client'`가 있어도 이 모듈은 서버에서 한 번 평가된다(클라이언트 컴포넌트도 SSR 된다).
 * ScrollTrigger는 등록 시점에 window를 건드리지 않아 그대로 두어도 되지만, 서버에서 굳이
 * 실행할 이유도 없어 브라우저에서만 등록한다.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };

/**
 * 움직임을 줄여 달라고 한 사용자에게는 애니메이션을 걸지 않는다. `gsap.matchMedia`가 이
 * 분기를 대신해 주지만, 매번 두 갈래를 쓰는 것보다 "움직여도 되는가"를 한 줄로 묻는 편이
 * 호출부가 짧다.
 *
 * `globals.css`가 로딩 폴백에 대해 이미 같은 판단을 한다(`prefers-reduced-motion: reduce`에서
 * 맥동을 끈다). 같은 기준을 쓴다.
 */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
