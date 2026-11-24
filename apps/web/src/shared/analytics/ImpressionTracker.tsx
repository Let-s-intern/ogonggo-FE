'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { sendImpression, type ContentEvent } from './contentEvents';
import { track, type DataLayerParams } from './dataLayer';

const VISIBLE_RATIO = 0.5;
const VISIBLE_MS = 1000;

/**
 * 감싼 카드가 뷰포트에 절반 이상 1초 연속 보이면 이벤트를 한 번 보낸다(`program_impression`).
 *
 * 한 번 보낸 뒤로는 지켜보지 않는다. 한 페이지에 프로그램마다 한 번이라는 명세의 단위가 이
 * 컴포넌트 하나의 수명이다 — 다른 페이지로 갔다 돌아오면 새로 마운트되어 다시 한 번 보낸다.
 *
 * `contentEvent` 를 주면 광고 리포트용 이벤트(`IMPRESSION`, PRD 6.5)도 같은 때에 보낸다. 그쪽은 카드가 몇 번 다시 그려져도 한
 * 페이지 조회(주소의 경로가 바뀌기 전) 안에서 노출 id 마다 한 번만 나간다(`sendImpression`). 광고 공고 카드처럼 GTM
 * 이벤트가 없는 자리는 `event` 없이 이것만 준다. `active` 가 거짓이면 지켜보지 않는다 — 넘기는 배너는 숨은 것도 같은
 * 자리에 겹쳐 있어, 화면에 보이는 한 장만 세려면 지금 보이는 것만 켠다.
 */
export function ImpressionTracker({
  event,
  params,
  contentEvent,
  active = true,
  children,
}: {
  event?: string;
  params?: DataLayerParams;
  contentEvent?: ContentEvent;
  active?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  // 브라우저 컴포넌트가 그릴 때마다 새 객체로 넘겨도 지켜보기를 다시 시작하지 않게 effect 밖에 둔다.
  const contentEventRef = useRef(contentEvent);
  contentEventRef.current = contentEvent;

  useEffect(() => {
    const element = ref.current;
    if (!element || sent.current || !active) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) {
          timer ??= setTimeout(() => {
            sent.current = true;
            observer.disconnect();
            if (event) {
              track(event, params ?? {});
            }
            if (contentEventRef.current) {
              sendImpression(contentEventRef.current);
            }
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
  }, [event, params, active]);

  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}
