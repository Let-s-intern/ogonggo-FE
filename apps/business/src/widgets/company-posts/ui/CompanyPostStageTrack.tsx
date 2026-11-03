import { cn } from '@ogonggo/ui';
import type { CompanyPostStage } from '../model/stage';

type StepState = 'done' | 'current' | 'rejected' | 'ended' | 'todo';

interface Step {
  label: string;
  state: StepState;
}

/**
 * 단계마다 네 칸의 이름과 상태. `작성` 은 늘 지나온 칸이다(`model/stage.ts`). 반려되면 `검수` 칸이
 * `반려` 로 바뀐다 — 반려는 모든 공고가 거치는 칸이 아니어서 따로 두지 않았다.
 */
const STEPS: Record<CompanyPostStage, readonly Step[]> = {
  REVIEWING: [
    { label: '작성', state: 'done' },
    { label: '검수 중', state: 'current' },
    { label: '게시', state: 'todo' },
    { label: '종료', state: 'todo' },
  ],
  REJECTED: [
    { label: '작성', state: 'done' },
    { label: '반려', state: 'rejected' },
    { label: '게시', state: 'todo' },
    { label: '종료', state: 'todo' },
  ],
  PUBLISHED: [
    { label: '작성', state: 'done' },
    { label: '검수', state: 'done' },
    { label: '게시', state: 'current' },
    { label: '종료', state: 'todo' },
  ],
  ENDED: [
    { label: '작성', state: 'done' },
    { label: '검수', state: 'done' },
    { label: '게시', state: 'done' },
    { label: '종료', state: 'ended' },
  ],
};

const DOT_CLASSES: Record<StepState, string> = {
  done: 'border-blue-500 bg-blue-500',
  current: 'border-blue-500 bg-white ring-4 ring-blue-50',
  rejected: 'border-error bg-error',
  ended: 'border-gray-500 bg-gray-500',
  todo: 'border-gray-200 bg-white',
};

const LABEL_CLASSES: Record<StepState, string> = {
  done: 'text-gray-700',
  current: 'font-bold text-blue-500',
  rejected: 'font-bold text-error',
  ended: 'font-bold text-gray-700',
  todo: 'text-gray-400',
};

/**
 * 공고 카드의 `작성 → 검수 → 게시 → 종료` 표시(B2 시안). 점 사이 선은 다음 칸에 닿았으면 파랑,
 * 종료로 가는 선만 회색이다.
 *
 * 폭을 다 쓴다. 데스크톱은 카드 가운데 칸 폭, 모바일은 카드 폭이다.
 */
export function CompanyPostStageTrack({ stage }: { stage: CompanyPostStage }) {
  const steps = STEPS[stage];
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
