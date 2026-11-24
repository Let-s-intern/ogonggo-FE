'use client';

import { useContext, useEffect, useRef } from 'react';
import { ScrollBoxContext } from '@/shared/lib/scrollBox';
import {
  flushContentEventsOnLeave,
  sendContentEvent,
  setCurrentVisit,
  takeAdEntryFor,
  type ContentEventSource,
  type ContentTargetType,
  type DetailVisit,
} from './contentEvents';
import { detailSource } from './contentEventQueue';
import { scrollDepthPercent } from './scrollDepth';

interface VisitState {
  key: string;
  visit: DetailVisit;
  maxScrollPercent: number;
  visibleMs: number;
  /** 지금 화면이 보이기 시작한 시각. 숨어 있으면 `null`. */
  visibleSince: number | null;
  left: boolean;
}

/** 이 문서(페이지 로드)에서 유입 경로를 이미 판정했는지. 한 번 판정한 뒤에는 착지를 소비한 것이다. */
let landingJudged = false;

/** 광고를 누르지 않고 열린 상세의 유입 경로. 판정은 문서마다 처음 한 번만 착지로 본다(`detailSource`). */
function sourceOfOpenedDetail(): ContentEventSource {
  const firstJudgement = !landingJudged;
  landingJudged = true;
  return detailSource({
    firstJudgement,
    navigation: performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined,
    pathname: location.pathname,
    referrer: document.referrer,
    ownOrigin: location.origin,
  });
}

/** 스크롤하는 곳이 모달의 안쪽 상자면 그 상자, 아니면 문서. */
function scrollPercent(box: HTMLElement | null): number {
  return scrollDepthPercent(
    box ?? {
      scrollTop: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
    },
  );
}

/**
 * 공고·부트캠프 상세의 광고 리포트 이벤트(PRD 6.5). 열릴 때 `VIEW`, 떠날 때 `SCROLL`(가장 깊이 내린 비율, 화면이 보인
 * 시간) 한 번이다.
 *
 * 유입 경로는 광고를 눌러 왔으면 그 광고(`AD_CARD`·`BANNER`)와 노출 id 다. 아니면 사이트에 처음 들어온 페이지일 때
 * 이전 페이지 주소로 가르고(`detailSource`), 앱 안에서 옮겨 왔거나 같은 주소를 다시 열었으면 `LIST` 다.
 *
 * 떠남은 페이지가 내려갈 때(`pagehide`, 백그라운드에서 얼려질 때의 `freeze` 포함), 앱 안에서 다른 화면으로 옮길 때
 * 중 먼저 오는 것이다. 탭이 숨는 것(지원 버튼으로 새 탭을 열거나 다른 탭으로 감)은 떠남이 아니다 — 그때는 지금까지의
 * 가장 깊은 비율을 남겨 두고 시간 재기만 멈춘다. 돌아와 더 내리면 그것까지 합쳐 떠날 때 한 번 보낸다. 보인 시간은 탭이
 * 숨은 동안을 뺀다. 한 번 떠나면 다시 돌아와도 더 보내지 않는다 — 조회 한 번에 `SCROLL` 하나여야 평균이 맞다.
 *
 * 개발 모드의 effect 두 번 실행(마운트, 정리, 다시 마운트)에 `SCROLL` 이 먼저 나가지 않도록, 정리에서 바로 보내지 않고
 * 한 틱 미룬다. 같은 상세로 다시 마운트되면 그것을 지운다.
 *
 * 모달(`RouteModal`) 안에서 열린 상세는 문서가 아니라 모달의 스크롤 상자로 잰다(`ScrollBoxContext`). 모달이 떠 있는
 * 동안 문서는 잠겨 있어 문서 비율로는 틀린 값이 나간다.
 */
export function DetailContentTracker({
  targetType,
  targetId,
}: {
  targetType: ContentTargetType;
  targetId: number;
}) {
  const scrollBoxRef = useContext(ScrollBoxContext);
  const stateRef = useRef<VisitState | null>(null);
  const pendingLeave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const key = `${targetType}:${targetId}`;
    let state = stateRef.current;
    if (state?.key === key) {
      clearTimeout(pendingLeave.current);
      pendingLeave.current = undefined;
    } else {
      const entry = takeAdEntryFor(targetType, targetId);
      // 광고를 눌러 왔어도 부른다. 착지 판정은 소비해야 그 뒤 같은 주소를 열 때 처음으로 잡히지 않는다.
      const opened = sourceOfOpenedDetail();
      const visit: DetailVisit = {
        targetType,
        targetId,
        exposureId: entry?.exposureId ?? null,
        source: entry?.source ?? opened,
      };
      setCurrentVisit(visit);
      sendContentEvent({ type: 'VIEW', ...visit });
      state = {
        key,
        visit,
        maxScrollPercent: 0,
        visibleMs: 0,
        visibleSince: document.visibilityState === 'visible' ? Date.now() : null,
        left: false,
      };
      stateRef.current = state;
    }
    const current = state;
    if (current.left) {
      return;
    }
    const scrollBox = scrollBoxRef?.current ?? null;

    const stopVisibleClock = () => {
      if (current.visibleSince !== null) {
        current.visibleMs += Date.now() - current.visibleSince;
        current.visibleSince = null;
      }
    };
    const leave = () => {
      if (current.left) {
        return;
      }
      current.left = true;
      stopVisibleClock();
      sendContentEvent({
        type: 'SCROLL',
        ...current.visit,
        scrollPercent: current.maxScrollPercent,
        durationMs: current.visibleMs,
      });
    };
    const onScroll = () => {
      current.maxScrollPercent = Math.max(current.maxScrollPercent, scrollPercent(scrollBox));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 떠난 것이 아니다. 숨기 직전 위치까지 남겨 두고, 다른 이벤트(`CTA_CLICK` 등)가 남아 있으면 내보낸다.
        onScroll();
        stopVisibleClock();
        flushContentEventsOnLeave();
      } else {
        current.visibleSince ??= Date.now();
      }
    };
    const onPageHide = () => {
      onScroll();
      leave();
      flushContentEventsOnLeave();
    };

    onScroll();
    (scrollBox ?? window).addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    // 백그라운드 탭이 얼려지면 브라우저가 그 뒤 `pagehide` 없이 탭을 버릴 수 있다. 그 전에 보낸다(Chromium).
    document.addEventListener('freeze', onPageHide);
    return () => {
      (scrollBox ?? window).removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('freeze', onPageHide);
      pendingLeave.current = setTimeout(leave, 0);
    };
  }, [targetType, targetId, scrollBoxRef]);

  return null;
}
