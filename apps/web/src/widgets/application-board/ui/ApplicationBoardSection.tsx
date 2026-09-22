'use client';

import { useId, useState } from 'react';
import {
  canMoveStage,
  useApplicationStage,
  type ApplicationBoardFilters,
  type ApplicationBoardTab,
  type ApplicationStage,
  type ApplicationStageId,
  type MoveStage,
} from '@/features/application-board';
import { ApplicationBoardRow } from './ApplicationBoardRow';
import { ApplicationBoardSectionHead } from './ApplicationBoardSectionHead';

export interface ApplicationBoardSectionProps {
  tab: ApplicationBoardTab;
  stage: ApplicationStage<ApplicationStageId>;
  filters: ApplicationBoardFilters;
  /** 리스트 전체가 나눠 쓰는 이동 훅. 칸반과 같은 이유로 하나다(`ApplicationBoardList`). */
  move: MoveStage;
  /** 첫 섹션인가. 섹션 머리의 바탕색만 이걸로 갈린다. */
  first: boolean;
}

/**
 * 리스트 보기의 섹션 하나(PRD "리스트 보기"). 칸반의 칸 하나와 같은 단계를 세로로 그린다.
 *
 * **칸반의 칸과 같은 훅을 같은 키로 부른다**(`useApplicationStage`). 그래서 보기를 바꿔도
 * 다시 받아 오지 않고, 한쪽에서 옮긴 결과가 다른 쪽에도 그대로 있다.
 *
 * 접기는 이 컴포넌트의 상태다. 주소에 담지 않는다 — 여섯 섹션의 여닫힘까지 주소에 넣으면
 * 공유한 주소가 상대의 화면을 접어 버리고, 되돌릴 방법을 알려 주지 않는다.
 *
 * **접어도 요청은 멈추지 않는다.** 섹션 머리의 개수가 그 요청에서 나오므로(`total`) 접힌
 * 섹션이 개수를 모르면 머리만 남은 줄이 아무 말도 하지 않는다. 그래서 행을 `hidden` 으로
 * 감추고 요청은 그대로 둔다.
 */
export function ApplicationBoardSection({
  tab,
  stage,
  filters,
  move,
  first,
}: ApplicationBoardSectionProps) {
  const list = useApplicationStage(tab, stage.id, filters);
  const [collapsed, setCollapsed] = useState(false);
  const panelId = useId();
  /* 칸반의 칸과 같은 판정이다 — 이유는 `ApplicationBoardColumn` 에 적혀 있다. */
  const returnsToScrap = canMoveStage(tab, stage.id, 'SCRAPPED');

  return (
    <section>
      <ApplicationBoardSectionHead
        label={stage.label}
        total={list.total}
        showComplete={returnsToScrap}
        collapsed={collapsed}
        onToggle={() => setCollapsed((previous) => !previous)}
        controls={panelId}
        first={first}
      />
      <div id={panelId} hidden={collapsed}>
        {list.items.map((item) => (
          <ApplicationBoardRow key={item.key} tab={tab} stage={stage} item={item} move={move} />
        ))}
        {list.items.length === 0 ? <ApplicationBoardSectionPlaceholder list={list} /> : null}
        {list.hasMore ? (
          <button
            type="button"
            disabled={list.loadingMore}
            onClick={list.loadMore}
            className="h-12 w-full text-sm text-gray-500 disabled:text-gray-400"
          >
            {list.loadingMore ? '불러오는 중이에요' : '더보기'}
          </button>
        ) : null}
      </div>
    </section>
  );
}

/** 칸반의 칸과 같은 세 경우를 같은 문구로 구분한다(`ApplicationBoardColumn`). */
function ApplicationBoardSectionPlaceholder({
  list,
}: {
  list: ReturnType<typeof useApplicationStage>;
}) {
  const message = list.loading ? '불러오는 중이에요' : list.failed ? '불러오지 못했어요' : '없어요';
  return <p className="py-6 text-center text-sm text-gray-400">{message}</p>;
}
