'use client';

import {
  stagesOf,
  type ApplicationStage,
  type ApplicationStageId,
} from '@/features/application-board';
import { boardFilters, type ApplicationBoardQuery } from '../lib/query';
import { ApplicationBoardSection } from './ApplicationBoardSection';

export interface ApplicationBoardListProps {
  query: ApplicationBoardQuery;
}

/**
 * 리스트 보기(PRD "리스트 보기"). 칸반이 가로로 늘어놓는 것과 **같은 단계를 세로로 쌓는다.**
 *
 * 칸반과 다른 것은 배치와 행 모양뿐이다. 어느 단계를 그릴지, 무엇으로 거를지, 어떻게 옮길지는
 * 전부 같은 것을 쓴다 — `지원 상태` 를 고르면 그 섹션만 남는 것도 같다
 * (`ApplicationBoardKanban`).
 *
 * 섹션 사이는 12px 다(목업 실측 2026-09-22).
 */
export function ApplicationBoardList({ query }: ApplicationBoardListProps) {
  const all: readonly ApplicationStage<ApplicationStageId>[] = stagesOf(query.tab);
  const stages = query.stage ? all.filter((stage) => stage.id === query.stage) : all;
  const filters = boardFilters(query);

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, index) => (
        <ApplicationBoardSection
          key={stage.id}
          tab={query.tab}
          stage={stage}
          filters={filters}
          first={index === 0}
        />
      ))}
    </div>
  );
}
