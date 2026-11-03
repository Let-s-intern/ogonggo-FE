'use client';

import { useQuery } from '@tanstack/react-query';
import { Fragment, useState, useSyncExternalStore } from 'react';
import { enumLabel } from '@ogonggo/api';
import { Callout, Chip, cn } from '@ogonggo/ui';
import {
  AD_AVAILABILITY_QUERY_KEY,
  MY_AD_COUPONS_QUERY_KEY,
  type AdJobField,
  type AdPlacementAvailabilityResponse,
  type AdPlacementKey,
  type AdPlacementPeriodAvailability,
  fetchAdAvailability,
  fetchMyAdCoupons,
  formatShortDate,
} from '@/entities/advertisement';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import {
  type CellState,
  type ScheduleCell,
  cellState,
  cellsOf,
  jobFieldsOf,
  summedCells,
  weeksOf,
} from '../model/schedule';
import { ScheduleDetailPanel } from './ScheduleDetailPanel';

type Filter = 'ALL' | 'JOB' | 'BOOTCAMP';

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'JOB', label: '채용공고 지면' },
  { value: 'BOOTCAMP', label: '교육 지면' },
];

const CELL_CLASSES: Record<CellState, string> = {
  OPEN: 'border-gray-200 bg-white text-gray-900',
  PARTIAL: 'border-orange-200 bg-orange-50 text-gray-900',
  CLOSED: 'border-gray-100 bg-gray-100 text-gray-400 line-through',
};

export interface ScheduleSelection {
  placementKey: AdPlacementKey;
  jobField?: AdJobField;
  period: AdPlacementPeriodAvailability;
}

/**
 * 신청 가능 일정(시안 B-03). 지면 × 주(월~일) 표에 잔여·일부 잔여·마감을 그리고, 칸을 누르면 오른쪽(모바일은 아래)
 * 패널에 그 일정의 정보와 `이 일정으로 신청하기` 가 뜬다.
 *
 * 로그인 없이 본다. 잔여 API 가 광고주명·금액을 내지 않으므로 누가 샀는지는 어디에도 그리지 않는다(PRD `지면 상품`).
 * 로그인했으면 무료 쿠폰 상태를 한 줄 더 보이고, 쿠폰을 쓸 수 있는 칸에 `쿠폰` 표시를 단다.
 *
 * 직무별 구좌는 접힌 줄에 모든 직무의 합을 보이고, 줄을 누르면 직무별 줄이 펼쳐진다. 공고 기간 단위 구좌(달력
 * 상단 노출)는 한 달을 한 칸으로 그린다.
 */
export function AdSchedule() {
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const { data, isError, isPending } = useQuery({
    queryKey: AD_AVAILABILITY_QUERY_KEY,
    queryFn: fetchAdAvailability,
  });
  const coupons = useQuery({
    queryKey: MY_AD_COUPONS_QUERY_KEY,
    queryFn: fetchMyAdCoupons,
    enabled: signedIn,
  });
  const [filter, setFilter] = useState<Filter>('ALL');
  const [expanded, setExpanded] = useState<ReadonlySet<AdPlacementKey>>(new Set());
  const [selection, setSelection] = useState<ScheduleSelection | undefined>();

  const items = (data ?? []).filter((item) => filter === 'ALL' || item.placement.target === filter);
  const weeks = weeksOf(data ?? []);
  const usableCoupon = signedIn ? coupons.data?.find((coupon) => !coupon.usedAt) : undefined;
  const usedCoupon = signedIn ? coupons.data?.find((coupon) => coupon.usedAt) : undefined;
  const selected = data?.find((item) => item.placement.key === selection?.placementKey);

  const toggle = (key: AdPlacementKey) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderCells = (
    item: AdPlacementAvailabilityResponse,
    cells: ScheduleCell[],
    jobField: AdJobField | undefined,
    selectable: boolean,
  ) =>
    cells.map(({ period, span }) => {
      const state = cellState(period);
      const isSelected =
        selection?.placementKey === item.placement.key &&
        selection.jobField === jobField &&
        selection.period.startDate === period.startDate;
      const couponMark =
        state !== 'CLOSED' && usableCoupon?.placementKeys.includes(item.placement.key);
      const text =
        state === 'CLOSED'
          ? '마감'
          : item.placement.unit === 'POSTING_PERIOD'
            ? `월 ${period.capacity}개 중 ${period.remaining}개 잔여`
            : `${period.remaining}/${period.capacity}`;
      const className = cn(
        'flex h-11 w-full flex-col items-center justify-center rounded-xs border text-xs font-semibold',
        CELL_CLASSES[state],
        isSelected && 'border-2 border-gray-900',
      );
      return (
        <td key={period.startDate} colSpan={span} className="p-0.5">
          {selectable ? (
            <button
              type="button"
              aria-pressed={isSelected}
              aria-label={`${item.placement.name}${jobField ? ` ${enumLabel('JobField', jobField)}` : ''} ${formatShortDate(period.startDate)} ${text}`}
              onClick={() => setSelection({ placementKey: item.placement.key, jobField, period })}
              className={cn(className, 'cursor-pointer hover:border-gray-400')}
            >
              {text}
              {couponMark ? (
                <span className="text-[10px] font-bold text-blue-500">쿠폰</span>
              ) : null}
            </button>
          ) : (
            <span className={className}>{text}</span>
          )}
        </td>
      );
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="지면 거르기">
          {FILTERS.map((option) => (
            <Chip
              key={option.value}
              tone={filter === option.value ? 'blue' : 'gray'}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        <ul className="flex items-center gap-4 text-xs text-gray-600" aria-label="범례">
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs border border-gray-200 bg-white" />
            잔여
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs border border-orange-200 bg-orange-50" />
            일부 잔여
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-gray-100" />
            마감
          </li>
        </ul>
      </div>

      {signedIn ? (
        <Callout tone="info">
          {usableCoupon
            ? `무료 쿠폰 1장 사용 가능 · ${usableCoupon.name}. 쿠폰을 쓸 수 있는 칸에 쿠폰 표시가 붙어요.`
            : usedCoupon
              ? '무료 쿠폰을 이미 사용했어요. 정가로 신청할 수 있어요.'
              : '사용할 수 있는 무료 쿠폰이 없어요.'}
        </Callout>
      ) : (
        <Callout tone="info">
          로그인 없이 잔여 구좌와 정가를 볼 수 있어요. 광고주명·금액은 표시되지 않아요 · 로그인하면
          무료 쿠폰 적용 가능 여부도 보여요.
        </Callout>
      )}

      {isError ? (
        <p role="alert" className="text-sm text-error">
          잔여 구좌를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
      {isPending ? (
        <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>
      ) : null}

      {data ? (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">지면별 주 단위 잔여 구좌</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 w-48 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-500"
                  >
                    지면 상품
                  </th>
                  {weeks.map((week) => (
                    <th
                      key={week.startDate}
                      scope="col"
                      className="border-b border-gray-200 bg-gray-50 px-1 py-2 text-center text-xs font-semibold whitespace-nowrap text-gray-500"
                    >
                      {formatShortDate(week.startDate).slice(0, 5)}
                      <span className="block font-normal text-gray-400">
                        ~{formatShortDate(week.endDate).slice(0, 5)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const { placement } = item;
                  const open = expanded.has(placement.key);
                  return (
                    <Fragment key={placement.key}>
                      <tr>
                        <th
                          scope="row"
                          className="sticky left-0 z-10 border-b border-gray-100 bg-white px-3 py-2 text-left align-middle"
                        >
                          {placement.perJobField ? (
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() => toggle(placement.key)}
                              className="flex w-full items-center justify-between gap-2 text-left"
                            >
                              <PlacementName name={placement.name} sub="직무별 · 눌러서 펼치기" />
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'icon-[lucide--chevron-down] block h-4 w-4 shrink-0 text-gray-400 transition-transform',
                                  open && 'rotate-180',
                                )}
                              />
                            </button>
                          ) : (
                            <PlacementName
                              name={placement.name}
                              sub={
                                placement.unit === 'POSTING_PERIOD'
                                  ? '공고 기간 단위'
                                  : `${placement.slotCount}슬롯 · 1주`
                              }
                            />
                          )}
                        </th>
                        {placement.perJobField
                          ? renderCells(item, summedCells(item, weeks), undefined, false)
                          : renderCells(item, cellsOf(item, weeks), undefined, true)}
                      </tr>
                      {placement.perJobField && open
                        ? jobFieldsOf(item).map((jobField) => (
                            <tr key={jobField}>
                              <th
                                scope="row"
                                className="sticky left-0 z-10 border-b border-gray-100 bg-gray-50 py-2 pr-3 pl-6 text-left text-xs font-medium text-gray-600"
                              >
                                {enumLabel('JobField', jobField)}
                              </th>
                              {renderCells(item, cellsOf(item, weeks, jobField), jobField, true)}
                            </tr>
                          ))
                        : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ScheduleDetailPanel
            placement={selected?.placement}
            selection={selection}
            couponUsable={Boolean(
              selected && usableCoupon?.placementKeys.includes(selected.placement.key),
            )}
            onClose={() => setSelection(undefined)}
          />
        </div>
      ) : null}

      <p className="text-xs text-gray-500">
        신청 가능 범위는 다음 주 월요일부터 12주예요 · 광고주당 월 2회까지 신청할 수 있어요 ·
        광고주명·금액은 표시되지 않아요
      </p>
    </div>
  );
}

function PlacementName({ name, sub }: { name: string; sub: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-bold text-gray-900">{name}</span>
      <span className="text-xs font-normal text-gray-400">{sub}</span>
    </span>
  );
}
