import { cn } from '@ogonggo/ui';

export type StageStepState = 'done' | 'current' | 'rejected' | 'ended' | 'todo';

export interface StageStep {
  label: string;
  state: StageStepState;
}

const DOT_CLASSES: Record<StageStepState, string> = {
  done: 'border-blue-500 bg-blue-500',
  current: 'border-blue-500 bg-white ring-4 ring-blue-50',
  rejected: 'border-error bg-error',
  ended: 'border-gray-500 bg-gray-500',
  todo: 'border-gray-200 bg-white',
};

const LABEL_CLASSES: Record<StageStepState, string> = {
  done: 'text-gray-700',
  current: 'font-bold text-blue-500',
  rejected: 'font-bold text-error',
  ended: 'font-bold text-gray-700',
  todo: 'text-gray-400',
};

/**
 * 카드의 진행 단계 표시(B2 시안). 공고 카드(`작성 → 검수 → 게시 → 종료`)와 광고 신청 카드
 * (`신청 → 협의 → 승인`)가 같이 쓴다. 점 사이 선은 다음 칸에 닿았으면 파랑, 종료로 가는 선만 회색이다.
 *
 * 폭을 다 쓴다. 데스크톱은 카드 가운데 칸 폭, 모바일은 카드 폭이다.
 */
export function StageTrack({ steps }: { steps: readonly StageStep[] }) {
  return (
    <ol aria-label="진행 단계" className="flex w-full items-start">
      {steps.map((step, index) => {
        const next = steps[index + 1];
        const reached = next !== undefined && next.state !== 'todo';
        return (
          <li
            key={step.label}
            aria-current={
              step.state === 'current' || step.state === 'rejected' || step.state === 'ended'
                ? 'step'
                : undefined
            }
            className={cn('flex items-start', next && 'flex-1')}
          >
            <span className="flex w-12 shrink-0 flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn('block h-4 w-4 rounded-full border-2', DOT_CLASSES[step.state])}
              />
              <span className={cn('text-xs whitespace-nowrap', LABEL_CLASSES[step.state])}>
                {step.label}
              </span>
            </span>
            {next ? (
              <span
                aria-hidden="true"
                className={cn(
                  '-mx-3 mt-[7px] h-0.5 flex-1',
                  reached
                    ? next.state === 'ended'
                      ? 'bg-gray-400'
                      : 'bg-blue-500'
                    : 'bg-gray-200',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
