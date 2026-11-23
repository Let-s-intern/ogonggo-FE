'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { enumLabel } from '@ogonggo/api';
import { Badge, cn } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { EChart } from '@/shared/ui/EChart';
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

/** 상품 기간 중 지난 몫. 시작일과 종료일을 모두 하루로 센다. */
function elapsedShare(ad: ActiveAd): number {
  const total =
    (Date.parse(`${ad.endDate}T00:00:00Z`) - Date.parse(`${ad.startDate}T00:00:00Z`)) / 86400000 +
    1;
  return Math.min(1, Math.max(0, (total - ad.daysLeft) / total));
}

function ActiveAdCard({ ad }: { ad: ActiveAd }) {
  const posting = ad.category === 'JOB_POSTING';
  // 선 하나만: 배너는 일별 클릭, 광고 공고는 일별 상세 조회. 수집 시작일 앞은 그리지 않는다(2026-11-19 사용자 검수).
  const sparkLabel = posting ? '일별 상세 조회' : '일별 클릭';
  const days = useMemo(
    () => ad.daily.filter((row) => row.date >= ad.collectedSince),
    [ad.daily, ad.collectedSince],
  );
  const sparkValues = useMemo(
    () => days.map((row) => (posting ? row.views : row.adClicks)),
    [days, posting],
  );
  const spark = useMemo(
    () =>
      sparklineOption(
        days.map((row) => row.date),
        sparkLabel,
        sparkValues,
      ),
    [days, sparkLabel, sparkValues],
  );
  const recent7 = sparkValues.slice(-7).reduce((acc, value) => acc + value, 0);
  // 두 카드 같은 틀: 큰 숫자 하나 + 작은 칸 넷. 배너는 클릭률, 광고 공고는 상세 조회가 큰 숫자다. 배너는 스크롤을 세지
  // 않는다(계약 5절).
  const lead = posting
    ? { label: '상세 조회', value: formatCount(ad.views) }
    : { label: '클릭률', value: formatRate(ad.adClickRate) };
  const cells: (readonly [string, string])[] = posting
    ? [
        ['노출', formatCount(ad.impressions)],
        ['클릭률', formatRate(ad.adClickRate)],
        ['지원하기 클릭', formatCount(ad.ctaClicks)],
        ['스크롤 50%', formatRate(ad.scroll50Rate)],
      ]
    : [
        ['노출', formatCount(ad.impressions)],
        ['클릭', formatCount(ad.adClicks)],
        ['상세 조회', formatCount(ad.views)],
        ['지원하기 클릭', formatCount(ad.ctaClicks)],
      ];

  return (
    <li className="min-w-0">
      <Link
        href={adReportHref(ad.contractId, ad.contractProductId)}
        className="grid gap-5 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 md:grid-cols-[3fr_4fr_3fr] md:items-center md:gap-6 md:p-5"
      >
        {/* 왼쪽: 종류·자리 → 무엇(크게) → 기간·남은 날 → 진행 바 */}
        <div className="flex min-w-0 flex-col">
          <p className="flex min-w-0 items-center gap-2">
            <Badge tone="main" className="shrink-0 px-1.5 py-0.5 text-xs font-semibold">
              {enumLabel('AdvertisementProductCategory', ad.category)}
            </Badge>
            <span className="truncate text-xs text-gray-500">{placeOf(ad)}</span>
          </p>
          {/* 광고 공고는 상품명이 자리 칩과 겹쳐 대상 공고 제목을 크게 쓴다. 배너는 상품명이다. */}
          <p className="mt-1.5 truncate text-[17px] font-bold text-gray-900">
            {ad.target?.title ?? ad.name}
          </p>
          <p className="mt-3 flex items-center justify-between gap-2 text-[13px] tabular-nums">
            <span className="text-gray-500">
              {dotDate(ad.startDate)} ~ {dotDate(ad.endDate)}
            </span>
            <span
              className={cn(
                'shrink-0 font-semibold',
                ad.daysLeft <= 3 ? 'text-orange-600' : 'text-blue-500',
              )}
            >
              {ad.daysLeft > 0 ? `${ad.daysLeft}일 남음` : '오늘 종료'}
            </span>
          </p>
          <span
            role="progressbar"
            aria-label="게시 기간 중 지난 날"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(elapsedShare(ad) * 100)}
            className="mt-1.5 block h-1 rounded-full bg-gray-100"
          >
            <span
              className={cn(
                'block h-1 rounded-full',
                ad.daysLeft <= 3 ? 'bg-orange-500' : 'bg-blue-500',
              )}
              style={{ width: `${elapsedShare(ad) * 100}%` }}
            />
          </span>
        </div>

        {/* 가운데: 선 하나짜리 추이. 수집 시작일부터 오늘까지 */}
        <div className="min-w-0">
          <p className="flex items-baseline justify-between text-xs">
            <span className="text-gray-500">{sparkLabel}</span>
            <span className="text-gray-500 tabular-nums">
              최근 7일 <span className="font-semibold text-gray-900">{formatCount(recent7)}</span>
            </span>
          </p>
          {days.length > 1 ? (
            <EChart option={spark} height={104} className="mt-1" />
          ) : (
            <p className="mt-1 flex h-[104px] items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
              하루 이상 모이면 그래프가 그려져요
            </p>
          )}
        </div>

        {/* 오른쪽: 큰 숫자 하나 + 작은 칸 넷 */}
        <div className="rounded-lg bg-gray-50">
          <p className="flex items-baseline justify-between px-4 pt-3">
            <span className="text-sm text-gray-600">{lead.label}</span>
            <span className="text-2xl font-bold text-gray-950 tabular-nums">{lead.value}</span>
          </p>
          <dl className="mt-3 grid grid-cols-4 gap-y-3 border-t border-gray-200/70 py-3 md:grid-cols-2">
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
      {/* 한 줄에 한 장(2026-11-19 사용자). */}
      <ul className="flex flex-col gap-4">
        {ads.map((ad) => (
          <ActiveAdCard key={ad.contractProductId} ad={ad} />
        ))}
      </ul>
    </section>
  );
}
