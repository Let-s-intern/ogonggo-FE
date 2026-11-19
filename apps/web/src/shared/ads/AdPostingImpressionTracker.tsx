'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { trackPostHogOnly } from '@/shared/analytics/dataLayer';
import { recordAdvertisementEvent } from './advertisementEvents';
import { adPostingPosthogParams, type AdSlot } from './adPosting';
import { isAdvertisementViewportVisible } from './adPostingContract';

const VISIBLE_RATIO = 0.5;
const VISIBLE_MS = 1000;

/** Records a paid posting after half the card is visible for one second. */
export function AdPostingImpressionTracker({
  ad,
  children,
}: {
  ad: AdSlot;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || sent.current) return;
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
        trackPostHogOnly('ad_posting_impression', adPostingPosthogParams(ad));
        recordAdvertisementEvent(ad.adId, 'IMPRESSION');
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
  }, [ad]);

  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}
