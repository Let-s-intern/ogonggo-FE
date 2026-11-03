'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, cn } from '@ogonggo/ui';
import {
  AD_AVAILABILITY_QUERY_KEY,
  AD_PAGE_LABELS,
  AD_PAGE_ORDER,
  AD_UNIT_LABELS,
  type AdPlacement,
  type AdPlacementKey,
  type AdPlacementPage,
  fetchAdAvailability,
  formatWon,
  placementChips,
} from '@/entities/advertisement';
import { LandingSectionHeading } from './LandingSectionHeading';
import { PlacementPreview } from './PlacementPreview';

/**
 * 시안 `오늘의공고 지면 광고`. 페이지 탭을 고르면 왼쪽에 그 화면의 구좌 위치가, 오른쪽에 구좌별 상품 카드가 바뀐다.
 * 카드나 미리보기의 구좌를 누르면 둘이 함께 강조된다.
 *
 * 상품은 잔여 구좌 API 의 `placement` 를 화면(`page`)별로 묶은 것이다(`memos/결정-광고시스템-business-랜딩-2026-11-03.md`).
 * 판매하지 않는 구좌는 API 가 빼고 내준다.
 */
export function PlacementShowcase() {
  const { data, isError } = useQuery({
    queryKey: AD_AVAILABILITY_QUERY_KEY,
    queryFn: fetchAdAvailability,
  });
  const placements = (data ?? []).map((item) => item.placement);
  const pages = AD_PAGE_ORDER.filter((page) => placements.some((p) => p.page === page));
  const [page, setPage] = useState<AdPlacementPage>('JOB_LIST');
  const [selected, setSelected] = useState<AdPlacementKey | undefined>();
  const onPage = placements.filter((placement) => placement.page === page);
  const keys = onPage.map((placement) => placement.key);
  const current = selected && keys.includes(selected) ? selected : keys[0];

  return (
    <section id="placements" className="scroll-mt-4 bg-gray-50">
      <div className="mx-auto max-w-page-padded px-5 py-16 md:py-24">
        <LandingSectionHeading
          eyebrow="오늘의공고 지면 광고"
          title={'공고를 실제로 찾는 사람 앞에,\n공고 그대로 보여드려요'}
          description="페이지를 고르면 구좌 위치가 그대로 보여요."
        />

        {isError ? (
          <p role="alert" className="pt-10 text-sm text-error">
            구좌 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}

        <div
          role="tablist"
          aria-label="광고 지면 페이지"
          className="flex gap-2 overflow-x-auto pt-10 pb-1"
        >
          {pages.map((key, index) => {
            const on = key === page;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setPage(key);
                  setSelected(undefined);
                }}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md border px-4 py-3 text-left text-sm whitespace-nowrap',
                  on
                    ? 'border-blue-500 bg-blue-00 font-bold text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                    on ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {index + 1}
                </span>
                {AD_PAGE_LABELS[key].label}
                <span className={cn('text-xs', on ? 'text-blue-500' : 'text-gray-400')}>
                  구좌 {placements.filter((p) => p.page === key).length}
                </span>
              </button>
            );
          })}
        </div>

        {onPage.length > 0 ? (
          <div
            role="tabpanel"
            className="grid gap-6 pt-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
          >
            <PlacementPreview page={page} keys={keys} selected={current} onSelect={setSelected} />
            <ol className="flex flex-col gap-3">
              {onPage.map((placement, index) => (
                <li key={placement.key}>
                  <PlacementCard
                    placement={placement}
                    order={index + 1}
                    selected={placement.key === current}
                    onSelect={() => setSelected(placement.key)}
                  />
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 rounded-md border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>
            <span className="pr-2 font-bold text-gray-900">운영 원칙</span>3개 이상 묶어 신청하면
            10% 할인 · 다음 주 월요일부터 12주까지 신청 · 가격은 VAT 별도 정가, 견적서에서 확정
          </p>
          <Link href="/schedule" className="shrink-0 font-semibold text-blue-500 hover:underline">
            잔여 구좌 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlacementCard({
  placement,
  order,
  selected,
  onSelect,
}: {
  placement: AdPlacement;
  order: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col gap-2 rounded-md border bg-white p-5 text-left transition-colors',
        selected ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <span className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          {order}
        </span>
        <span className="text-base font-bold text-gray-900">{placement.name}</span>
      </span>
      <span className="text-sm leading-relaxed text-gray-600">{placement.description}</span>
      <span className="flex flex-wrap gap-1.5">
        {placementChips(placement).map((chip) => (
          <Badge
            key={chip}
            tone={chip === '무료 쿠폰 대상' ? 'main' : 'neutral'}
            className="rounded-full"
          >
            {chip}
          </Badge>
        ))}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-3 pt-1 text-sm">
        <span className="text-lg font-bold text-gray-950">{formatWon(placement.price)}</span>
        <span className="text-gray-500">/ {AD_UNIT_LABELS[placement.unit]} · VAT 별도</span>
        <span className="text-gray-500">예상 CTR {placement.expectedCtr}</span>
      </span>
    </button>
  );
}
