import { cn } from '@ogonggo/ui';
import type {
  AdApplicationStatus,
  AdRejection,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';
import { AD_STATUS_LABELS, AD_STATUS_ORDER } from '../model/status';

type StepState = 'done' | 'current' | 'rejected' | 'todo';

const DOT_CLASSES: Record<StepState, string> = {
  done: 'border-blue-500 bg-blue-500',
  current: 'border-blue-500 bg-white ring-4 ring-blue-50',
  rejected: 'border-error bg-error',
  todo: 'border-gray-200 bg-white',
};

const LABEL_CLASSES: Record<StepState, string> = {
  done: 'text-gray-700',
  current: 'font-bold text-blue-500',
  rejected: 'font-bold text-error',
  todo: 'text-gray-400',
};

export interface AdStageTrackProps {
  status: AdApplicationStatus;
  rejection?: AdRejection;
  /** 쿠폰만 쓰는 0원 신청은 견적·계약·입금을 건너뛴다. 그 칸을 흐리게 그린다. */
  skipBilling?: boolean;
}

/**
 * 광고 진행 단계 여덟 칸(시안 `접수 → 견적 → 계약 → 입금 → 검수 → 확정 → 집행 → 종료`). 모양은 기업 공고 카드의 단계
 * 표시(`widgets/company-posts/ui/CompanyPostStageTrack.tsx`)와 같다. 반려면 반려가 난 단계가 빨간 `반려` 로 바뀐다
 * (PRD `광고 진행 단계`). 종료면 마지막 칸까지 채운다.
 */
export function AdStageTrack({ status, rejection, skipBilling = false }: AdStageTrackProps) {
  const currentIndex = AD_STATUS_ORDER.indexOf(rejection?.status ?? status);
  return (
    <ol aria-label="진행 단계" className="flex w-full items-start">
      {AD_STATUS_ORDER.map((step, index) => {
        const state: StepState =
          index < currentIndex || (status === 'ENDED' && index === currentIndex && !rejection)
            ? 'done'
            : index === currentIndex
              ? rejection
                ? 'rejected'
                : 'current'
              : 'todo';
        const skipped =
          skipBilling && (step === 'QUOTED' || step === 'CONTRACTED' || step === 'PAID');
        const last = index === AD_STATUS_ORDER.length - 1;
        return (
          <li
            key={step}
            aria-current={state === 'current' || state === 'rejected' ? 'step' : undefined}
            className={cn('flex items-start', !last && 'flex-1', skipped && 'opacity-40')}
          >
            <span className="flex w-10 shrink-0 flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn('block h-3.5 w-3.5 rounded-full border-2', DOT_CLASSES[state])}
              />
              <span className={cn('text-[11px] whitespace-nowrap', LABEL_CLASSES[state])}>
                {state === 'rejected' ? '반려' : AD_STATUS_LABELS[step]}
              </span>
            </span>
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  '-mx-3 mt-[6px] h-0.5 flex-1',
                  index < currentIndex ? 'bg-blue-500' : 'bg-gray-200',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
