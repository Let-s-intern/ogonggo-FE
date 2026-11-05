'use client';

import { useEffect, useRef } from 'react';
import { markLabelRows } from '@ogonggo/ui';

/**
 * 원문 HTML 을 그리고, 불러오지 못한 이미지를 숨긴다(LC-3566). 원문 이미지는 원문 사이트 주소를 그대로
 * 걸어 핫링크가 막힌 곳(`file.hitejinro.com` 등)은 깨진 이미지 아이콘으로 보인다.
 *
 * `dangerouslySetInnerHTML` 로 그린 이미지에는 React 핸들러를 달 수 없어, 감싼 요소에서 `error` 를 캡처
 * 단계로 받는다(`error` 는 버블링하지 않는다). 하이드레이션 전에 이미 실패한 이미지는 그 이벤트를 놓쳤으므로
 * 붙는 순간 `complete` 인데 크기가 0 인 것도 숨긴다.
 *
 * 원문 위쪽의 "칸 이름 + 값" 묶음(마감기한, 부문, 근무지 등)에는 표 줄 클래스를 붙인다(`markLabelRows`).
 */
export function SourceHtml({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    markLabelRows(root);
    const hide = (img: HTMLImageElement) => {
      img.style.display = 'none';
    };
    for (const img of root.querySelectorAll('img')) {
      if (img.complete && img.naturalWidth === 0) hide(img);
    }
    const onError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) hide(event.target);
    };
    root.addEventListener('error', onError, true);
    return () => root.removeEventListener('error', onError, true);
  }, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
