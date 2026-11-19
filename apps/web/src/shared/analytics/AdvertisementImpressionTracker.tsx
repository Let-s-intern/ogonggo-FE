'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { recordAdvertisementEvent } from '@/shared/ads/advertisementEvents';
import { trackPostHogOnly } from './dataLayer';
import { isAdvertisementViewportVisible } from '@/shared/ads/adPostingContract';

const VISIBLE_RATIO = 0.5;
const VISIBLE_MS = 1000;

/** Count a banner after the active slide is at least 50% visible for one second. */
export function AdvertisementImpressionTracker({
  exposureId,
  positionCode,
  active,
  children,
}: {
  exposureId: number;
  positionCode: string;
  active: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!active || !element || sent.current) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let intersectsViewport = false;
    const startTimer = () => {
      if (timer || !intersectsViewport || document.visibilityState !== 'visible') return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!intersectsViewport || document.visibilityState !== 'visible') return;
        sent.current = true;
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        trackPostHogOnly('banner_impression', {
          exposure_id: exposureId,
          category: 'BANNER',
          position: positionCode,
        });
        recordAdvertisementEvent(exposureId, 'IMPRESSION');
      }, VISIBLE_MS);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectsViewport = Boolean(
          entry?.isIntersecting &&
            isAdvertisementViewportVisible(entry.intersectionRatio, document.visibilityState === 'visible'),
        );
        if (intersectsViewport) {
          startTimer();
        } else {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: VISIBLE_RATIO },
    );
    const onVisibilityChange = () => {
      clearTimeout(timer);
      timer = undefined;
      intersectsViewport = false;
      if (document.visibilityState === 'visible') {
        observer.unobserve(element);
        observer.observe(element);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, exposureId, positionCode]);

  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}
