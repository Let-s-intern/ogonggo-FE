'use client';

import { enumLabel } from '@ogonggo/api';
import { Badge, Button, Checkbox, Select } from '@ogonggo/ui';
import {
  type AdCoupon,
  type AdPlacement,
  type AdPlacementAvailabilityResponse,
  type AdPlacementKey,
  formatShortDate,
  formatWon,
} from '@/entities/advertisement';
import {
  type AdApplicationFormValues,
  type FormItem,
  PURPOSES,
  WAITLIST_OPTIONS,
} from '../model/form';
import { type Amounts, MAX_WEEKS, itemEndDate, soldOutStarts } from '../model/items';
import { AddPlacementModal } from './AddPlacementModal';

export interface StepPlacementsProps {
  values: AdApplicationFormValues;
  patch: (next: Partial<AdApplicationFormValues>) => void;
  /** 고른 공고 종류에 맞는 구좌의 잔여. */
  availability: AdPlacementAvailabilityResponse[];
  placements: Map<AdPlacementKey, AdPlacement>;
  conflicts: Map<string, string>;
  amounts: Amounts;
  /** 로그인했고 쓸 수 있는 무료 쿠폰. */
  coupon: AdCoupon | undefined;
  addOpen: boolean;
  setAddOpen: (open: boolean) => void;
}

/**
 * 2단계 지면 · 일정(시안 B-04). 항목 표, `+ 지면 추가`, 겹침·잔여 경고, 대기 옵션, 쿠폰, 소계 · 할인 · 쿠폰 · 합계.
 */
export function StepPlacements({
  values,
  patch,
  availability,
  placements,
  conflicts,
  amounts,
  coupon,
  addOpen,
  setAddOpen,
}: StepPlacementsProps) {
  const recommended =
    PURPOSES.find((purpose) => purpose.value === values.purpose)?.recommended ?? [];
  const availabilityOf = (key: AdPlacementKey) =>
    availability.find((item) => item.placement.key === key);
  const anySoldOut = values.items.some(
    (item) => soldOutStarts(item, availabilityOf(item.placementKey)).length > 0,
  );
  const couponTarget =
    coupon && values.items.some((item) => coupon.placementKeys.includes(item.placementKey));

  const updateItem = (uid: string, next: Partial<FormItem>) =>
    patch({ items: values.items.map((item) => (item.uid === uid ? { ...item, ...next } : item)) });

  return (
    <>
      {values.items.length === 0 ? (
        <p className="rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          아직 추가한 지면이 없어요. 아래 `지면 추가` 로 지면과 집행 주를 골라 주세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {values.items.map((item) => {
            const placement = placements.get(item.placementKey);
            const soldOut = soldOutStarts(item, availabilityOf(item.placementKey));
            const conflict = conflicts.get(item.uid);
            return (
              <li
                key={item.uid}
                className="flex flex-col gap-2 rounded-md border border-gray-200 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-bold text-gray-900">
                    {placement?.name ?? item.placementKey}
                  </span>
                  {recommended.includes(item.placementKey) ? (
                    <Badge tone="main" className="rounded-full">
                      추천
                    </Badge>
                  ) : null}
                  {amounts.couponItemUid === item.uid ? (
                    <Badge tone="success" className="rounded-full">
                      쿠폰 적용
                    </Badge>
                  ) : null}
                  <span className="text-xs text-gray-500">
                    {item.jobField ? `${enumLabel('JobField', item.jobField)} · ` : ''}
                    {formatShortDate(item.startDate)} ~{' '}
                    {formatShortDate(itemEndDate(item, placement))}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {placement?.unit === 'WEEK' ? (
                      <Select
                        aria-label="연속 집행 주 수"
                        value={String(item.weeks)}
                        onChange={(event) =>
                          updateItem(item.uid, { weeks: Number(event.target.value) })
                        }
                        options={Array.from({ length: MAX_WEEKS }, (_, index) => ({
                          value: String(index + 1),
                          label: `${index + 1}주`,
                        }))}
                        className="h-9 w-20"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">공고 기간</span>
                    )}
                    <span className="w-24 text-right text-sm font-semibold text-gray-900">
                      {formatWon((placement?.price ?? 0) * item.weeks)}
                    </span>
                    <button
                      type="button"
                      aria-label={`${placement?.name ?? ''} 삭제`}
                      onClick={() =>
                        patch({ items: values.items.filter((each) => each.uid !== item.uid) })
                      }
                      className="p-1 text-gray-400 hover:text-gray-700"
                    >
                      <span aria-hidden="true" className="icon-[lucide--trash-2] block h-4 w-4" />
                    </button>
                  </span>
                </div>
                {conflict ? (
                  <p role="alert" className="text-xs font-semibold text-error">
                    {conflict}
                  </p>
                ) : null}
                {soldOut.length > 0 ? (
                  <p role="alert" className="text-xs font-semibold text-orange-700">
                    마감 · {soldOut.map((start) => formatShortDate(start)).join(', ')} 주는 잔여
                    구좌가 없어요. 다른 주로 바꾸거나 아래에서 대기 등록을 골라 주세요.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="secondary"
        className="self-start"
        onClick={() => setAddOpen(true)}
      >
        <span aria-hidden="true" className="icon-[lucide--plus] block h-4 w-4" />
        지면 추가
      </Button>
      <p className="-mt-4 text-xs text-gray-500">
        지면 → 직무 → 집행 주 순서로 골라요 · 상단 고정·추천 카드·달력 상단 노출은 같은 주에 중복할
        수 없어요
      </p>

      {anySoldOut ? (
        <fieldset className="flex flex-col gap-2 rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
          <legend className="sr-only">대기 등록</legend>
          <p className="text-sm font-semibold text-gray-900">대기 등록</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            {WAITLIST_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="waitlist"
                  checked={values.waitlist === option.value}
                  onChange={() => patch({ waitlist: option.value })}
                  className="accent-blue-500"
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            잔여가 없는 주가 있으면 신청할 수 없어요. 대기를 고르면 취소 구좌가 생길 때 연락드리니,
            신청은 다른 주로 바꿔서 해 주세요.
          </p>
        </fieldset>
      ) : null}

      {coupon ? (
        <div className="flex flex-col gap-1">
          <Checkbox
            checked={values.useCoupon && Boolean(couponTarget)}
            disabled={!couponTarget}
            onChange={(checked) => patch({ useCoupon: checked })}
            label={`${coupon.name} 사용 (리스트 상단 고정 또는 비슷한 공고 상단 노출 ${coupon.weeks}주)`}
          />
          {!couponTarget ? (
            <p className="pl-7 text-xs text-gray-500">
              쿠폰을 쓸 수 있는 지면을 추가하면 고를 수 있어요.
            </p>
          ) : null}
        </div>
      ) : null}

      <dl className="flex flex-col gap-1.5 rounded-md bg-gray-50 px-4 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">소계</dt>
          <dd className="text-gray-900">{formatWon(amounts.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">복합 할인 (3개 이상 10%)</dt>
          <dd className="text-gray-900">
            {amounts.discount ? `-${formatWon(amounts.discount)}` : '0원'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">무료 쿠폰</dt>
          <dd className="text-gray-900">
            {amounts.coupon ? `-${formatWon(amounts.coupon)}` : '0원'}
          </dd>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2">
          <dt className="font-bold text-gray-900">합계 (VAT 별도)</dt>
          <dd className="text-lg font-bold text-blue-500">{formatWon(amounts.total)}</dd>
        </div>
        <p className="pt-1 text-xs text-gray-500">금액은 정가 기준이며 견적서에서 확정돼요.</p>
      </dl>

      <AddPlacementModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        availability={availability}
        recommended={recommended}
        onAdd={(item) => patch({ items: [...values.items, item] })}
      />
    </>
  );
}
