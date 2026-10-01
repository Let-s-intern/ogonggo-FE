'use client';

import { useEffect, useState } from 'react';
import type { CardSizeId, CardSpec } from '../card/types';
import { renderSlide } from './render';

export interface Preview {
  url: string;
  overflow: boolean;
}

/**
 * 여러 장의 미리보기를 렌더 API 로 그린다. 편집할 때마다 다시 그리면 요청이 몰리므로 마지막 입력
 * 뒤 0.4초를 기다리고, 새 입력이 오면 그리던 요청을 버린다. `targets` 는 그릴 장 목록이고, 바뀌었는지는
 * `key` 로 판단한다(배열은 그릴 때마다 새로 만들어지므로).
 */
export function usePreviews(
  targets: { spec: CardSpec; slide: number }[],
  size: CardSizeId,
  key: unknown,
): { previews: (Preview | null)[]; error: boolean } {
  const [previews, setPreviews] = useState<(Preview | null)[]>(() => targets.map(() => null));
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setError(false);
      Promise.all(
        targets.map((target) =>
          // PNG 로 굽지 않은 SVG 를 받아 브라우저가 그린다(렌더 라우트 참고).
          renderSlide(target.spec, target.slide, size, {
            format: 'svg',
            signal: controller.signal,
          }),
        ),
      )
        .then((slides) => {
          const next = slides.map((slide) => ({
            url: URL.createObjectURL(slide.blob),
            overflow: slide.overflow,
          }));
          setPreviews((current) => {
            current.forEach((preview) => preview && URL.revokeObjectURL(preview.url));
            return next;
          });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError(true);
          }
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `targets` 는 `key` 가 대신한다.
  }, [key, size]);

  return { previews, error };
}
