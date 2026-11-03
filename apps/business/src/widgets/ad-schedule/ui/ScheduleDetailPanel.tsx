import Link from 'next/link';
import { enumLabel } from '@ogonggo/api';
import { Button } from '@ogonggo/ui';
import {
  AD_PAGE_LABELS,
  AD_UNIT_LABELS,
  type AdPlacement,
  adApplyHref,
  formatPeriod,
  formatWon,
} from '@/entities/advertisement';
import { cellState } from '../model/schedule';
import type { ScheduleSelection } from './AdSchedule';

export interface ScheduleDetailPanelProps {
  placement: AdPlacement | undefined;
  selection: ScheduleSelection | undefined;
  /** 로그인했고 쓸 수 있는 무료 쿠폰이 이 구좌에 맞는지. */
  couponUsable: boolean;
  onClose: () => void;
}

/**
 * 신청 가능 일정의 오른쪽 상세 패널(시안 B-03 `sel`). 칸을 고르기 전에는 안내만 보인다. 마감 칸이면 신청 버튼을 막는다 —
 * 대기 등록은 신청서 2단계에서 한다(PRD `지면 상품`).
 */
export function ScheduleDetailPanel({
  placement,
  selection,
  couponUsable,
  onClose,
}: ScheduleDetailPanelProps) {
  if (!placement || !selection) {
    return (
      <aside className="rounded-md border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500 lg:sticky lg:top-6 lg:w-80">
        표에서 칸을 고르면 그 일정의 잔여·규격·정가와 신청 버튼이 여기에 보여요.
      </aside>
    );
  }
  const { period, jobField } = selection;
  const closed = cellState(period) === 'CLOSED';
  return (
    <aside
      aria-label="선택한 일정"
      className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-5 lg:sticky lg:top-6 lg:w-80"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{AD_PAGE_LABELS[placement.page].label}</p>
          <p className="pt-0.5 text-lg font-bold text-gray-900">{placement.name}</p>
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5" />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-gray-600">{placement.description}</p>
      <dl className="grid grid-cols-[4.5rem_1fr] gap-y-2 text-sm">
        <dt className="text-gray-400">일정</dt>
        <dd className="text-gray-900">{formatPeriod(period.startDate, period.endDate)}</dd>
        {jobField ? (
          <>
            <dt className="text-gray-400">직무</dt>
            <dd className="text-gray-900">{enumLabel('JobField', jobField)}</dd>
          </>
        ) : null}
        <dt className="text-gray-400">잔여</dt>
        <dd className={closed ? 'font-semibold text-error' : 'font-semibold text-gray-900'}>
          {closed ? '마감' : `${period.remaining} / ${period.capacity}`}
        </dd>
        <dt className="text-gray-400">규격</dt>
        <dd className="text-gray-900">{placement.spec}</dd>
        <dt className="text-gray-400">정가</dt>
        <dd className="text-gray-900">
          {formatWon(placement.price)} / {AD_UNIT_LABELS[placement.unit]} · VAT 별도
        </dd>
        <dt className="text-gray-400">예상 CTR</dt>
        <dd className="text-gray-900">{placement.expectedCtr}</dd>
      </dl>
      {couponUsable && !closed ? (
        <p className="rounded-xs bg-blue-00 px-3 py-2 text-xs font-semibold text-blue-600">
          무료 쿠폰을 적용할 수 있는 지면이에요
        </p>
      ) : null}
      {closed ? (
        <>
          <Button disabled className="w-full">
            이 일정으로 신청하기
          </Button>
          <p className="text-xs text-gray-500">
            이 주는 잔여 구좌가 없어요. 신청서에서 다른 주를 고르거나 대기 등록을 할 수 있어요.
          </p>
        </>
      ) : (
        <Button asChild className="w-full">
          <Link
            href={adApplyHref({
              placementKey: placement.key,
              startDate: period.startDate,
              jobField,
            })}
          >
            이 일정으로 신청하기
          </Link>
        </Button>
      )}
    </aside>
  );
}
