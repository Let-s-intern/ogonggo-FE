'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getMyAdvertisementContract,
  listMyAdvertisementContracts,
  type SuccessResponseMyAdvertisementContractDetailResponse,
  type SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
} from '@ogonggo/api';
import { isSignedIn } from '@/shared/api/authTokens';
import { myAdContractHref } from '@/widgets/my-ad-contracts/model';
import { fetchAdReport } from '../lib/api';
import { formatCount, formatRate, productProgress, unavailableReason } from '../model/format';
import type { ReportableProduct } from '../model/types';

/** 승인된 계약을 한 번에 받는 수. 한 기업의 승인 계약은 이보다 적다. */
const CONTRACT_FETCH_SIZE = 50;

interface RunningAd {
  contractId: number;
  contractTitle: string;
  contractProductId: number;
  productName: string;
  views: number;
  ctaClicks: number;
  ctaClickRate: number | null;
}

/**
 * 진행 중인 상품마다 리포트(기본 기간)를 받는다. 승인된 계약 → 상세의 상품 → 오늘 게시 중이고 리포트를 열 수 있는
 * 상품만. 한 상품의 리포트가 실패하면 그 상품만 뺀다.
 */
async function loadRunningAds(): Promise<RunningAd[]> {
  const page = (await listMyAdvertisementContracts({
    page: 1,
    size: CONTRACT_FETCH_SIZE,
    status: ['APPROVED'],
  })) as unknown as SuccessResponsePageResponseMyAdvertisementContractSummaryResponse;
  const details = await Promise.all(
    (page.data?.items ?? []).map(
      (item) =>
        getMyAdvertisementContract(
          item.id,
        ) as unknown as Promise<SuccessResponseMyAdvertisementContractDetailResponse>,
    ),
  );
  const running = details.flatMap((detail) => {
    const contract = detail.data;
    if (!contract) return [];
    return (contract.products as ReportableProduct[])
      .filter(
        (product) => productProgress(product) === 'RUNNING' && unavailableReason(product) === null,
      )
      .map((product) => ({ contract, product }));
  });
  const reports = await Promise.allSettled(
    running.map(({ contract, product }) =>
      fetchAdReport(contract.id, product.contractProductId, '', ''),
    ),
  );
  return running.flatMap(({ contract, product }, i) => {
    const result = reports[i];
    if (result?.status !== 'fulfilled') return [];
    const { summary } = result.value;
    return [
      {
        contractId: contract.id,
        contractTitle: contract.recruitmentTitle,
        contractProductId: product.contractProductId,
        productName: product.productName,
        views: summary.views,
        ctaClicks: summary.ctaClicks,
        ctaClickRate: summary.ctaClickRate,
      },
    ];
  });
}

/**
 * 대시보드의 진행 중 광고 카드(PRD 6.6). 오늘 게시 중인 상품이 있을 때만 보이고, 상품마다 상세 조회·CTA 클릭·클릭률을
 * 적는다. 누르면 그 계약의 리포트로 간다. 없거나 불러오지 못하면 아무것도 그리지 않는다 — 대시보드의 다른 칸을 밀어내지 않게.
 */
export function RunningAdsPanel() {
  const [ads, setAds] = useState<RunningAd[]>([]);

  useEffect(() => {
    if (!isSignedIn()) return;
    let active = true;
    loadRunningAds()
      .then((value) => active && setAds(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (ads.length === 0) return null;

  return (
    <section className="flex flex-col rounded-xl border border-gray-200 p-5 motion-safe:animate-[ogonggo-biz-fade-in_0.3s_ease-out] md:p-6">
      <h2 className="text-lg font-bold text-gray-950">진행 중인 광고</h2>
      <ul className="mt-4 divide-y divide-gray-100">
        {ads.map((ad) => (
          <li key={ad.contractProductId}>
            <Link
              href={myAdContractHref(ad.contractId)}
              className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_20rem] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-xs text-gray-500">{ad.contractTitle}</p>
                <p className="truncate font-semibold text-gray-900 hover:underline">
                  {ad.productName}
                </p>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-gray-100 rounded-lg bg-gray-50 py-3">
                {(
                  [
                    ['상세 조회', formatCount(ad.views)],
                    ['CTA 클릭', formatCount(ad.ctaClicks)],
                    ['클릭률', formatRate(ad.ctaClickRate)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="font-bold text-gray-900 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
