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
function PlaceFallback({ place, className }: { place: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gray-50 text-xs font-semibold text-gray-400',
        className,
      )}
    >
      {place}
    </div>
  );
}

/** 두 카드의 머리 높이. 배너 띠와 광고 공고의 썸네일 줄이 같은 높이라 카드가 들쭉날쭉하지 않다. */
const HEAD = 'h-16';

/**
 * 카드 머리. 배너는 소재 이미지(PC, 10:1 띠)를 자르지 않고(`object-contain`) 옅은 배경 위에 둔다. 광고 공고는 큰 이미지 대신
 * 공고 카드(`widgets/company-posts/ui/CompanyPostCard.tsx`)처럼 작은 정사각 썸네일 → 로고를 제목 왼쪽에 둔다. 둘 다 기존
 * `Thumbnail` 의 후보·폴백 규칙 그대로다(2026-11-19 사용자 검수).
 */
function CardHead({ ad }: { ad: ActiveAd }) {
  const place = placeOf(ad);
  if (ad.category !== 'JOB_POSTING') {
    return (
      <div className={cn(HEAD, 'overflow-hidden rounded-lg bg-gray-50')}>
        <Thumbnail
          src={ad.imageUrl ?? undefined}
          alt={`${ad.name} 소재`}
          className="h-full w-full object-contain"
          fallback={<PlaceFallback place={place} className="h-full w-full" />}
        />
      </div>
    );
  }
  return (
    <div className={cn(HEAD, 'flex items-center gap-3 rounded-lg bg-gray-50 px-3')}>
      <span className="size-12 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-white">
        <Thumbnail
          src={[ad.target?.thumbnailUrl ?? undefined, ad.target?.logoUrl ?? undefined]}
          alt=""
          className="h-full w-full"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-gray-900">
          {ad.target?.title ?? place}
        </span>
        {ad.target ? (
          <span className="block truncate text-xs text-gray-500">{ad.target.companyName}</span>
        ) : null}
      </span>
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
  const first = posting ? '카드 노출' : '노출';
  const second = posting ? '상세 조회' : '클릭';
  // 배너는 노출·클릭, 광고 공고는 카드 노출·상세 조회를 그린다(2026-11-19 사용자).
  const spark = useMemo(
    () =>
      sparklineOption(
        ad.daily.map((row) => row.date),
        [
          { name: first, values: ad.daily.map((row) => row.impressions) },
          {
            name: second,
            values: ad.daily.map((row) => (posting ? row.views : row.adClicks)),
          },
        ],
        // 셋 다 0 인 날은 집계 전이거나 숫자가 없는 날이라 선을 끊는다.
        ad.daily.map((row) => row.impressions + row.adClicks + row.views > 0),
      ),
    [ad.daily, posting, first, second],
  );
  // 두 카드 같은 틀: 큰 숫자 하나 + 작은 칸 넷. 배너는 클릭률, 광고 공고는 상세 조회가 큰 숫자다. 배너는 스크롤을 세지
  // 않는다(계약 5절).
  const lead = posting
    ? { label: '상세 조회', value: formatCount(ad.views) }
    : { label: '클릭률', value: formatRate(ad.adClickRate) };
  const cells: (readonly [string, string])[] = posting
    ? [
        ['노출', formatCount(ad.impressions)],
        ['클릭률', formatRate(ad.adClickRate)],
        ['CTA 클릭', formatCount(ad.ctaClicks)],
        ['스크롤 50%', formatRate(ad.scroll50Rate)],
      ]
    : [
        ['노출', formatCount(ad.impressions)],
        ['클릭', formatCount(ad.adClicks)],
        ['상세 조회', formatCount(ad.views)],
        ['CTA 클릭', formatCount(ad.ctaClicks)],
      ];

  return (
    <li className="min-w-0">
      <Link
        href={adReportHref(ad.contractId, ad.contractProductId)}
        className="flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
      >
        <CardHead ad={ad} />

        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">
            {enumLabel('AdvertisementProductCategory', ad.category)} · {placeOf(ad)}
          </p>
          <p className="truncate font-semibold text-gray-900">{ad.name}</p>
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
          <EChart option={spark} height={44} />
          <p className="mt-1 flex gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="block h-0.5 w-2.5 rounded bg-[#2a78d6]" />
              {first}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="block h-0.5 w-2.5 rounded bg-[#eb6834]" />
              {second}
            </span>
          </p>
        </div>

        <div className="mt-auto rounded-lg bg-gray-50">
          <p className="flex items-baseline justify-between px-4 pt-3">
            <span className="text-sm text-gray-600">{lead.label}</span>
            <span className="text-2xl font-bold text-gray-950 tabular-nums">{lead.value}</span>
          </p>
          <dl className="mt-3 grid grid-cols-4 border-t border-gray-200/70 py-3">
            {cells.map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col items-center gap-0.5">
                <dt className="truncate text-[11px] text-gray-500">{label}</dt>
                <dd className="text-sm font-bold text-gray-900 tabular-nums">{value}</dd>
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
