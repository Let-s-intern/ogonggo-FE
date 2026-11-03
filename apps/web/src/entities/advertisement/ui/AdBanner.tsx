'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { adHref, type AdExposure } from '../model/types';
import { AdLabel } from './AdLabel';

/** 여러 슬롯을 돌려 보이는 간격. 시안의 `롤링` 이다. */
const ROTATE_MS = 5000;

/**
 * 가로 배너(PC 1200×120 · MO 750×200, PRD `지면 상품`). 슬롯이 여럿이면 차례로 돌려 보인다.
 * 광고가 없으면 아무것도 그리지 않는다 — 빈 회색 상자를 두지 않는다.
 *
 * 이미지는 `<picture>` 로 PC·MO 소재를 나눈다. 소재가 없으면(오공고 제작 대기) 회사명·공고명 글자 배너로 그린다.
 */
export function AdBanner({ ads, className }: { ads: AdExposure[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const count = ads.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count]);

  const ad = ads[index % Math.max(count, 1)];
  if (!ad) {
    return null;
  }

  return (
    <Link
      href={adHref(ad)}
      data-ad-placement={ad.placementKey}
      aria-label={`광고: ${ad.companyName} ${ad.postTitle}`}
      className={cn(
        'relative block aspect-[750/200] w-full overflow-hidden rounded-xl bg-gray-50 md:aspect-[1200/120]',
        className,
      )}
    >
      {ad.bannerImageUrlPc || ad.bannerImageUrlMo ? (
        <picture>
          {ad.bannerImageUrlPc ? (
            <source media="(min-width: 768px)" srcSet={ad.bannerImageUrlPc} />
          ) : null}
          <img
            src={ad.bannerImageUrlMo ?? ad.bannerImageUrlPc}
            alt=""
            className="h-full w-full object-cover"
          />
        </picture>
      ) : (
        <span className="flex h-full flex-col justify-center gap-1 px-6">
          <span className="text-xs text-gray-500">{ad.companyName}</span>
          <span className="truncate text-base font-bold text-gray-900">{ad.postTitle}</span>
        </span>
      )}
      <AdLabel className="absolute top-2 right-2" />
    </Link>
  );
}
