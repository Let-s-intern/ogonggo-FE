'use client';

import { useEffect, useRef } from 'react';
import {
  flushContentEventsOnLeave,
  sendContentEvent,
  setCurrentVisit,
  takeAdEntryFor,
  type ContentTargetType,
  type DetailVisit,
} from './contentEvents';
import { landingSource } from './contentEventQueue';

interface VisitState {
  key: string;
  visit: DetailVisit;
  maxScrollPercent: number;
  visibleMs: number;
  /** 지금 화면이 보이기 시작한 시각. 숨어 있으면 `null`. */
  visibleSince: number | null;
  left: boolean;
}

/** 이 상세가 사이트에 처음 들어온 페이지인지. 앱 안에서 옮겨 온 상세는 아니다. */
function isLandingPage(): boolean {
  const entry = performance.getEntriesByType('navigation')[0];
  if (!entry) {
    return false;
  }
  try {
    return new URL(entry.name).pathname === location.pathname;
  } catch {
    return false;
  }
}

function scrollPercent(): number {
  const { scrollHeight } = document.documentElement;
  if (scrollHeight <= 0) {
    return 0;
  }
  return Math.min(100, Math.round(((window.scrollY + window.innerHeight) / scrollHeight) * 100));
}

/**
 * 공고·부트캠프 상세의 광고 리포트 이벤트(PRD 6.5). 열릴 때 `VIEW`, 떠날 때 `SCROLL`(가장 깊이 내린 비율, 화면이 보인
 * 시간) 한 번이다.
 *
 * 유입 경로는 광고를 눌러 왔으면 그 광고(`AD_CARD`·`BANNER`)와 노출 id 다. 아니면 사이트에 처음 들어온 페이지일 때
 * 이전 페이지 주소로 가르고(`landingSource`), 앱 안에서 옮겨 왔으면 `LIST` 다.
 *
 * 떠남은 탭이 처음 숨을 때, 페이지가 내려갈 때, 앱 안에서 다른 화면으로 옮길 때 중 먼저 오는 것이다. 보인 시간은 탭이
 * 숨은 동안을 뺀다. 한 번 떠나면 다시 돌아와도 더 보내지 않는다 — 조회 한 번에 `SCROLL` 하나여야 평균이 맞다.
 *
 * 개발 모드의 effect 두 번 실행(마운트, 정리, 다시 마운트)에 `SCROLL` 이 먼저 나가지 않도록, 정리에서 바로 보내지 않고
 * 한 틱 미룬다. 같은 상세로 다시 마운트되면 그것을 지운다.
 *
 * `measureScroll` 이 거짓이면(달력의 공고 모달) `SCROLL` 은 보내지 않는다. 모달은 문서가 아니라 모달 안이 스크롤돼서
 * 문서 비율로는 틀린 값이 나간다.
 */
export function DetailContentTracker({
  targetType,
  targetId,
  measureScroll = true,
}: {
  targetType: ContentTargetType;
  targetId: number;
  measureScroll?: boolean;
}) {
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
      const visit: DetailVisit = {
        targetType,
        targetId,
        exposureId: entry?.exposureId ?? null,
        source:
          entry?.source ??
          (isLandingPage() ? landingSource(document.referrer, location.origin) : 'LIST'),
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
    if (!measureScroll || current.left) {
      return;
    }

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
      current.maxScrollPercent = Math.max(current.maxScrollPercent, scrollPercent());
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        leave();
        flushContentEventsOnLeave();
      } else {
        current.visibleSince ??= Date.now();
      }
    };
    const onPageHide = () => {
      leave();
      flushContentEventsOnLeave();
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      pendingLeave.current = setTimeout(leave, 0);
    };
  }, [targetType, targetId, measureScroll]);

  return null;
}
