import { type StageStep, StageTrack } from '@/shared/ui/StageTrack';
import type { CompanyPostStage } from '../model/stage';

/**
 * 단계마다 네 칸의 이름과 상태. `작성` 은 늘 지나온 칸이다(`model/stage.ts`). 반려되면 `검수` 칸이
 * `반려` 로 바뀐다 — 반려는 모든 공고가 거치는 칸이 아니어서 따로 두지 않았다.
 */
const STEPS: Record<CompanyPostStage, readonly StageStep[]> = {
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

/** 공고 카드의 `작성 → 검수 → 게시 → 종료` 표시. 그리는 것은 `StageTrack` 이다. */
export function CompanyPostStageTrack({ stage }: { stage: CompanyPostStage }) {
  return <StageTrack steps={STEPS[stage]} />;
}
