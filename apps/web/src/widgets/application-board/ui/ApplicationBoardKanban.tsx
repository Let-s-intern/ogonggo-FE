'use client';

import { DndContext } from '@dnd-kit/core';
import {
  stagesOf,
  useMoveStage,
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
 *
 * 칸 사이는 `gap-5`(20px) 다. 목업에서 첫 칸 오른쪽 끝 783px, 둘째 칸 왼쪽 끝 803px 로
 * 19px 이 읽힌다(2026-09-22 실측).
 */
export function ApplicationBoardKanban({ query }: ApplicationBoardKanbanProps) {
  /*
   * `지원 상태` 를 고르면 그 칸만 남는다. 단계는 요청 파라미터가 아니라 칸 자체라, 거르는
   * 자리가 목록이 아니라 여기다(`lib/query.ts`).
   */
  const all: readonly ApplicationStage<ApplicationStageId>[] = stagesOf(query.tab);
  const stages = query.stage ? all.filter((stage) => stage.id === query.stage) : all;
  const filters = boardFilters(query);
  /*
   * 이동 훅은 칸이 아니라 여기 하나다. 한 번에 한 건만 옮기게 하려는 것이고(`pending` 이 같은
   * 훅의 다른 이동을 막는다), 낙관적 갱신이 출발 칸과 도착 칸을 함께 고치므로 칸마다 따로
   * 두면 같은 캐시를 둘이 건드린다.
   */
  const move = useMoveStage(query.tab);

  return (
    <DndContext>
      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex w-max items-start gap-5">
          {stages.map((stage) => (
            <ApplicationBoardColumn
              key={stage.id}
              tab={query.tab}
              stage={stage}
              filters={filters}
              move={move}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
