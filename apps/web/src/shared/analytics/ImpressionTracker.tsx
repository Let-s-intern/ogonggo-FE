'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { track, type DataLayerParams } from './dataLayer';

const VISIBLE_RATIO = 0.5;
const VISIBLE_MS = 1000;

/**
 * 감싼 카드가 뷰포트에 절반 이상 1초 연속 보이면 이벤트를 한 번 보낸다(`program_impression`).
 *
 * 한 번 보낸 뒤로는 지켜보지 않는다. 한 페이지에 프로그램마다 한 번이라는 명세의 단위가 이
 * 컴포넌트 하나의 수명이다 — 다른 페이지로 갔다 돌아오면 새로 마운트되어 다시 한 번 보낸다.
 */
export function ImpressionTracker({
  event,
  params,
  children,
}: {
  event: string;
  params: DataLayerParams;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || sent.current) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) {
          timer ??= setTimeout(() => {
            sent.current = true;
            observer.disconnect();
            track(event, params);
          }, VISIBLE_MS);
        } else {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: VISIBLE_RATIO },
    );
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [event, params]);

  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}
