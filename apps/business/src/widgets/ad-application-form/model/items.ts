import type {
  AdCoupon,
  AdJobField,
  AdPlacement,
  AdPlacementAvailabilityResponse,
  AdPlacementKey,
  AdPlacementPeriodAvailability,
  AdTargetType,
} from '@/entities/advertisement';
import type { FormItem } from './form';

/**
 * 2단계 항목의 계산. 잔여·중복·금액 규칙은 목 API(`packages/api/src/mocks/advertisements.ts` 의 신청 생성)와 같다.
 */

/** 같은 주에 함께 신청할 수 없는 구좌(A1 · A2 · A6). PRD `지면 상품` 공통 규칙. */
export const EXCLUSIVE_PLACEMENTS: readonly AdPlacementKey[] = [
  'RECOMMEND_TOP_RECRUIT',
  'LIST_TOP_RECRUIT',
  'CALENDAR_TOP',
];

export const MAX_WEEKS = 4;
const DAY = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function plusDays(date: string, days: number): string {
  return formatDate(new Date(parseDate(date).getTime() + days * DAY));
}

/** 항목이 끝나는 날. 주 단위면 마지막 주 일요일, 공고 기간 단위면 그 달 말일. */
export function itemEndDate(item: FormItem, placement: AdPlacement | undefined): string {
  if (placement?.unit === 'POSTING_PERIOD') {
    const start = parseDate(item.startDate);
    return formatDate(new Date(start.getFullYear(), start.getMonth() + 1, 0));
  }
  return plusDays(item.startDate, item.weeks * 7 - 1);
}

/** 이 항목이 차지하는 기간 각각의 잔여. 연속 주면 주마다 하나다. 없는 기간은 `undefined`. */
export function itemPeriods(
  item: FormItem,
  availability: AdPlacementAvailabilityResponse | undefined,
): (AdPlacementPeriodAvailability | undefined)[] {
  if (!availability) return [];
  const count = availability.placement.unit === 'POSTING_PERIOD' ? 1 : item.weeks;
  return Array.from({ length: count }, (_, index) => {
    const start = plusDays(item.startDate, index * 7);
    return availability.periods.find(
      (period) => period.startDate === start && period.jobField === item.jobField,
    );
  });
}

/** 잔여가 없거나 신청 범위를 벗어난 기간이 있으면 그 기간의 시작일들. */
export function soldOutStarts(
  item: FormItem,
  availability: AdPlacementAvailabilityResponse | undefined,
): string[] {
  const periods = itemPeriods(item, availability);
  return periods.flatMap((period, index) =>
    !period || period.remaining <= 0
      ? [period?.startDate ?? plusDays(item.startDate, index * 7)]
      : [],
  );
}

/**
 * 항목마다 겹침 문구. A1 · A2 · A6 끼리 시작 주가 같거나, 같은 구좌·직무가 기간이 겹치면 붙는다.
 */
export function conflictsOf(
  items: FormItem[],
  placements: Map<AdPlacementKey, AdPlacement>,
): Map<string, string> {
  const result = new Map<string, string>();
  items.forEach((item, index) => {
    const end = itemEndDate(item, placements.get(item.placementKey));
    for (const [otherIndex, other] of items.entries()) {
      if (otherIndex === index) continue;
      const otherEnd = itemEndDate(other, placements.get(other.placementKey));
      const overlaps = item.startDate <= otherEnd && other.startDate <= end;
      if (
        other.placementKey === item.placementKey &&
        other.jobField === item.jobField &&
        overlaps
      ) {
        result.set(item.uid, '같은 지면을 같은 기간에 두 번 넣었어요');
        return;
      }
      if (
        EXCLUSIVE_PLACEMENTS.includes(item.placementKey) &&
        EXCLUSIVE_PLACEMENTS.includes(other.placementKey) &&
        other.placementKey !== item.placementKey &&
        other.startDate === item.startDate
      ) {
        result.set(item.uid, '추천 카드·상단 고정·달력 상단 노출은 같은 주에 중복할 수 없어요');
        return;
      }
    }
  });
  return result;
}

export interface Amounts {
  subtotal: number;
  discount: number;
  coupon: number;
  total: number;
  /** 쿠폰을 적용한 항목. */
  couponItemUid?: string;
}

/** 소계 · 3개 이상 10% 할인 · 쿠폰(쿠폰 대상 첫 항목, 쿠폰 주 수만큼) · 합계. VAT 별도 정가 기준. */
export function computeAmounts(
  items: FormItem[],
  placements: Map<AdPlacementKey, AdPlacement>,
  coupon: AdCoupon | undefined,
): Amounts {
  const priceOf = (item: FormItem) => placements.get(item.placementKey)?.price ?? 0;
  const subtotal = items.reduce((sum, item) => sum + priceOf(item) * item.weeks, 0);
  const discount = items.length >= 3 ? Math.round(subtotal * 0.1) : 0;
  const couponItem = coupon
    ? items.find((item) => coupon.placementKeys.includes(item.placementKey))
    : undefined;
  const couponAmount =
    couponItem && coupon ? priceOf(couponItem) * Math.min(coupon.weeks, couponItem.weeks) : 0;
  return {
    subtotal,
    discount,
    coupon: couponAmount,
    total: Math.max(0, subtotal - discount - couponAmount),
    couponItemUid: couponItem?.uid,
  };
}

/** 1단계에서 고른 공고의 종류. 새 공고는 채용공고다. */
export function targetOf(postMode: 'EXISTING' | 'NEW', postTarget?: AdTargetType): AdTargetType {
  return postMode === 'EXISTING' && postTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB';
}

export type { AdJobField };
