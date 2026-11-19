'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { enumLabel } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { EChart } from '@/shared/ui/EChart';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { myAdContractHref } from '@/widgets/my-ad-contracts/model';
import { fetchActiveAds } from '../lib/api';
import { sparklineOption } from '../lib/chartOptions';
import { dotDate, formatCount, formatRate, positionLabel } from '../model/format';
import type { ActiveAd } from '../model/types';

/** 그 상품의 리포트. 계약 상세가 `?product=` 로 상품을 골라 둔다(`AdReport`). */
export const adReportHref = (contractId: number, contractProductId: number) =>
  `${myAdContractHref(contractId)}?product=${contractProductId}`;

/** 자리 이름. 광고 공고는 자리가 없으면 카테고리 이름이다. */
const placeOf = (ad: ActiveAd) =>
  ad.position ? positionLabel(ad.position) : enumLabel('AdvertisementProductCategory', ad.category);

/** 이미지가 없을 때의 칸. 어느 자리의 광고인지 글자로 적는다. */
function PlaceFallback({ place }: { place: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm font-semibold text-gray-400">
      {place}
    </div>
  );
}

/**
 * 카드 위의 대표 이미지. 배너는 소재 이미지(PC), 광고 공고는 대상 공고의 썸네일 → 로고 순으로 기존 `Thumbnail` 에 넘긴다 —
 * 공고 카드(`widgets/company-posts/ui/CompanyPostCard.tsx`)와 같은 컴포넌트·같은 폴백 규칙이고 새로 맞추는 규칙은 없다.
 * 칸 비율은 배너가 PC 배너처럼 가로로 길고(4:1), 광고 공고는 공고 카드 썸네일과 같은 8:5 다.
 */
function CardImage({ ad }: { ad: ActiveAd }) {
  const place = placeOf(ad);
  const banner = ad.category !== 'JOB_POSTING';
  const src = banner
    ? (ad.imageUrl ?? undefined)
    : [ad.target?.thumbnailUrl ?? undefined, ad.target?.logoUrl ?? undefined];
  return (
    <div
      className={cn(
        'overflow-hidden border-b border-gray-100',
        banner ? 'aspect-[4/1]' : 'aspect-[8/5]',
      )}
    >
      <Thumbnail
        src={src}
        alt={banner ? `${ad.name} 소재` : (ad.target?.title ?? '')}
        className="h-full w-full"
        fallback={<PlaceFallback place={place} />}
      />
    </div>
  );
}

/** 상품 기간 중 지난 몫. 시작일과 종료일을 모두 하루로 센다. */
function elapsedShare(ad: ActiveAd): number {
  const total =
    (Date.parse(`${ad.endDate}T00:00:00Z`) - Date.parse(`${ad.startDate}T00:00:00Z`)) / 86400000 +
    1;
  return Math.min(1, Math.max(0, (total - ad.daysLeft) / total));
}

function ActiveAdCard({ ad }: { ad: ActiveAd }) {
  const posting = ad.category === 'JOB_POSTING';
  // 배너는 노출·클릭, 광고 공고는 카드 노출·상세 조회를 그린다(2026-11-19 사용자).
  const spark = useMemo(
    () =>
      sparklineOption(
        ad.daily.map((row) => row.date),
        [
          { name: posting ? '카드 노출' : '노출', values: ad.daily.map((row) => row.impressions) },
          posting
            ? { name: '상세 조회', values: ad.daily.map((row) => row.views) }
            : { name: '클릭', values: ad.daily.map((row) => row.adClicks) },
        ],
      ),
    [ad.daily, posting],
  );
  const metrics = [
    ['노출', formatCount(ad.impressions)],
    ['클릭', formatCount(ad.adClicks)],
    ['클릭률', formatRate(ad.adClickRate)],
    ['상세 조회', formatCount(ad.views)],
    ['CTA 클릭', formatCount(ad.ctaClicks)],
    ['스크롤 50%', formatRate(ad.scroll50Rate)],
  ] as const;

  return (
    <li className="min-w-0">
      <Link
        href={adReportHref(ad.contractId, ad.contractProductId)}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
      >
        <CardImage ad={ad} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">
              {enumLabel('AdvertisementProductCategory', ad.category)} · {placeOf(ad)}
            </p>
            <p className="truncate font-semibold text-gray-900">{ad.name}</p>
            {ad.target ? <p className="truncate text-xs text-gray-500">{ad.target.title}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="text-gray-500">
                {dotDate(ad.startDate)} ~ {dotDate(ad.endDate)}
              </span>
              <span className="font-semibold text-blue-600">
                {ad.daysLeft > 0 ? `${ad.daysLeft}일 남음` : '오늘 종료'}
              </span>
            </div>
            <span
              role="progressbar"
              aria-label="게시 기간 중 지난 날"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(elapsedShare(ad) * 100)}
              className="block h-1.5 rounded-full bg-gray-100"
            >
              <span
                className="block h-1.5 rounded-full bg-blue-500"
                style={{ width: `${elapsedShare(ad) * 100}%` }}
              />
            </span>
          </div>

          <div>
            <EChart option={spark} height={56} />
            <p className="mt-1 flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span aria-hidden="true" className="block h-0.5 w-3 rounded bg-[#2a78d6]" />
                {posting ? '카드 노출' : '노출'}
              </span>
              <span className="flex items-center gap-1">
                <span aria-hidden="true" className="block h-0.5 w-3 rounded bg-[#eb6834]" />
                {posting ? '상세 조회' : '클릭'}
              </span>
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-y-3 rounded-lg bg-gray-50 py-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="font-bold text-gray-900 tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Link>
    </li>
  );
}

/**
 * 대시보드의 진행 중 광고(PRD 6.6, 2026-11-19 사용자 요청으로 카드 모양). 오늘 게시 중인 상품 하나가 카드 한 장이고,
 * 누르면 그 상품의 리포트로 간다. 데이터는 진행 중 광고 요약 한 번이다(상품마다 리포트를 부르지 않는다). 없거나
 * 불러오지 못하면 영역을 그리지 않는다.
 */
export function RunningAdsPanel() {
  const [ads, setAds] = useState<ActiveAd[]>([]);

  useEffect(() => {
    if (!isSignedIn()) return;
    let active = true;
    fetchActiveAds()
      .then((value) => active && setAds(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (ads.length === 0) return null;

  return (
    <section
      aria-labelledby="running-ads-title"
      className="flex flex-col gap-4 motion-safe:animate-[ogonggo-biz-fade-in_0.3s_ease-out]"
    >
      <h2 id="running-ads-title" className="text-lg font-bold text-gray-950">
        진행 중인 광고
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ads.map((ad) => (
          <ActiveAdCard key={ad.contractProductId} ad={ad} />
        ))}
      </ul>
    </section>
  );
}
