'use client';

import {
  stagesOf,
  type ApplicationStage,
  type ApplicationStageId,
} from '@/features/application-board';
import { boardFilters, type ApplicationBoardQuery } from '../lib/query';
import { ApplicationBoardColumn } from './ApplicationBoardColumn';

export interface ApplicationBoardKanbanProps {
  query: ApplicationBoardQuery;
}

/**
 * 칸반 보기(PRD "칸반 보기"). 칸이 가로로 늘어서고 **화면을 넘으면 가로로 스크롤한다** —
 * 목업에서 셋째 칸이 오른쪽 끝에 잘려 있다.
 *
 * 스크롤을 세로로 접지 않는다. 칸 여섯이 각자 `더보기` 로 길어지는 화면이라 줄바꿈으로 흘리면
 * 칸의 차례(스크랩 → 지원 준비 중 → …) 가 읽히지 않는다.
 *
 * 바깥 `-mx-1 px-1` 은 칸의 포커스 테두리가 스크롤 상자에 잘리지 않게 두는 여백이다.
 */
export function ApplicationBoardKanban({ query }: ApplicationBoardKanbanProps) {
  const stages: readonly ApplicationStage<ApplicationStageId>[] = stagesOf(query.tab);
  const filters = boardFilters(query);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div className="flex w-max items-start gap-6">
        {stages.map((stage) => (
          <ApplicationBoardColumn key={stage.id} tab={query.tab} stage={stage} filters={filters} />
        ))}
      </div>
    </div>
  );
}
