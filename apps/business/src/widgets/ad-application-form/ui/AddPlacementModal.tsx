'use client';

import { useState } from 'react';
import { enumLabel } from '@ogonggo/api';
import { Badge, Button, Field, Modal, Select, cn } from '@ogonggo/ui';
import {
  AD_UNIT_LABELS,
  type AdJobField,
  type AdPlacementAvailabilityResponse,
  type AdPlacementKey,
  formatPeriod,
  formatWon,
} from '@/entities/advertisement';
import { type FormItem, newUid } from '../model/form';
import { MAX_WEEKS, soldOutStarts } from '../model/items';

export interface AddPlacementModalProps {
  open: boolean;
  onClose: () => void;
  /** 고른 공고 종류에 맞는 구좌만 온다. */
  availability: AdPlacementAvailabilityResponse[];
  recommended: readonly AdPlacementKey[];
  onAdd: (item: FormItem) => void;
}

/**
 * 지면 추가(시안 B-04 `+ 지면 추가`). 지면 → 직무 → 집행 주 순서로 고른다. 연속 1~4주이고, 2주 이상이면 주마다 잔여가
 * 있어야 한다. 잔여가 없어도 넣을 수는 있다 — 항목에 경고가 붙고 대기 옵션을 고르게 한다.
 */
export function AddPlacementModal({
  open,
  onClose,
  availability,
  recommended,
  onAdd,
}: AddPlacementModalProps) {
  const sorted = [...availability].sort(
    (a, b) =>
      Number(recommended.includes(b.placement.key)) - Number(recommended.includes(a.placement.key)),
  );
  const [key, setKey] = useState<AdPlacementKey | ''>('');
  const [jobField, setJobField] = useState<AdJobField | ''>('');
  const [startDate, setStartDate] = useState('');
  const [weeks, setWeeks] = useState(1);

  const selected = availability.find((item) => item.placement.key === key);
  const placement = selected?.placement;
  const jobFields = selected
    ? [...new Set(selected.periods.flatMap((period) => (period.jobField ? [period.jobField] : [])))]
    : [];
  const periods = selected
    ? selected.periods.filter(
        (period) =>
          period.jobField === (placement?.perJobField ? jobField || undefined : undefined),
      )
    : [];
  const draft: FormItem | null =
    placement && startDate && (!placement.perJobField || jobField)
      ? {
          uid: newUid(),
          placementKey: placement.key,
          jobField: placement.perJobField ? (jobField as AdJobField) : undefined,
          startDate,
          weeks: placement.unit === 'POSTING_PERIOD' ? 1 : weeks,
        }
      : null;
  const soldOut = draft && selected ? soldOutStarts(draft, selected) : [];

  const reset = () => {
    setKey('');
    setJobField('');
    setStartDate('');
    setWeeks(1);
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="지면 추가"
      description="지면 → 직무 → 집행 주 순서로 골라요"
      className="w-[min(40rem,calc(100vw-2rem))]"
    >
      <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto">
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-semibold text-gray-900">지면</legend>
          {sorted.map(({ placement: each }) => (
            <label
              key={each.key}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 has-checked:border-blue-500 has-checked:bg-blue-00"
            >
              <input
                type="radio"
                name="add-placement"
                checked={key === each.key}
                onChange={() => {
                  setKey(each.key);
                  setJobField('');
                  setStartDate('');
                  setWeeks(1);
                }}
                className="accent-blue-500"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  {each.name}
                  {recommended.includes(each.key) ? (
                    <Badge tone="main" className="rounded-full">
                      추천
                    </Badge>
                  ) : null}
                </span>
                <span className="truncate text-xs text-gray-500">{each.description}</span>
              </span>
              <span className="shrink-0 text-right text-xs text-gray-700">
                {formatWon(each.price)}
                <span className="block text-gray-400">/ {AD_UNIT_LABELS[each.unit]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {placement?.perJobField ? (
          <Field label="직무" htmlFor="add-job-field" required>
            <Select
              id="add-job-field"
              value={jobField}
              onChange={(event) => {
                setJobField(event.target.value as AdJobField);
                setStartDate('');
              }}
              options={[
                { value: '', label: '직무를 골라 주세요' },
                ...jobFields.map((field) => ({
                  value: field,
                  label: enumLabel('JobField', field),
                })),
              ]}
            />
          </Field>
        ) : null}

        {placement && (!placement.perJobField || jobField) ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2 text-sm font-semibold text-gray-900">
              {placement.unit === 'POSTING_PERIOD' ? '집행 달' : '시작 주'}
            </legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {periods.map((period) => {
                const closed = period.remaining <= 0;
                return (
                  <label
                    key={period.startDate}
                    className={cn(
                      'flex cursor-pointer flex-col rounded-md border px-3 py-2 text-xs has-checked:border-blue-500 has-checked:bg-blue-00',
                      closed
                        ? 'border-gray-100 bg-gray-50 text-gray-400'
                        : 'border-gray-200 text-gray-700',
                    )}
                  >
                    <input
                      type="radio"
                      name="add-start"
                      className="sr-only"
                      checked={startDate === period.startDate}
                      onChange={() => setStartDate(period.startDate)}
                    />
                    <span className="font-semibold">
                      {formatPeriod(period.startDate, period.endDate)}
                    </span>
                    <span>{closed ? '마감' : `잔여 ${period.remaining} / ${period.capacity}`}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {placement && placement.unit === 'WEEK' && startDate ? (
          <Field
            label="연속 집행"
            htmlFor="add-weeks"
            hint="2주 이상이면 주마다 잔여가 있어야 해요."
          >
            <Select
              id="add-weeks"
              value={String(weeks)}
              onChange={(event) => setWeeks(Number(event.target.value))}
              options={Array.from({ length: MAX_WEEKS }, (_, index) => ({
                value: String(index + 1),
                label: `${index + 1}주`,
              }))}
            />
          </Field>
        ) : null}

        {soldOut.length > 0 ? (
          <p role="alert" className="rounded-xs bg-orange-50 px-3 py-2 text-sm text-orange-700">
            고른 기간에 잔여 구좌가 없는 주가 있어요. 추가하면 대기 등록으로 받거나 다른 주로 바꿔야
            해요.
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <Button type="button" variant="secondary" onClick={close}>
          취소
        </Button>
        <Button
          type="button"
          disabled={!draft}
          onClick={() => {
            if (draft) {
              onAdd(draft);
              close();
            }
          }}
        >
          추가하기
        </Button>
      </div>
    </Modal>
  );
}
