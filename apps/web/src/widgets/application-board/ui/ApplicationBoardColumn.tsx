'use client';

import {
  canMoveStage,
  useApplicationStage,
  type ApplicationBoardFilters,
  type ApplicationBoardTab,
  type ApplicationStage,
  type ApplicationStageId,
} from '@/features/application-board';
import { ApplicationBoardCard } from './ApplicationBoardCard';
import { ApplicationBoardColumnHead } from './ApplicationBoardColumnHead';

export interface ApplicationBoardColumnProps {
  tab: ApplicationBoardTab;
  stage: ApplicationStage<ApplicationStageId>;
  filters: ApplicationBoardFilters;
}

/**
 * 칸반의 칸 하나(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`).
 *
 * **칸 하나가 요청 하나다.** 목록 응답에 단계 칸이 없어 한 번 불러 나눌 수 없다 — 이유는
 * `features/application-board/api/applicationBoardApi.ts` 에 적혀 있다. 그래서 훅을 부르는
 * 자리가 칸 컴포넌트이고, 탭을 옮기면 칸 집합이 통째로 바뀌므로 각 칸이 자기 훅을 들고
 * 마운트·언마운트된다.
 *
 * 칸 폭은 `w-76`(304px) 이다. 목업 1440px 폭에서 칸이 305px, 칸 사이가 24px 로 읽힌다.
 */
export function ApplicationBoardColumn({ tab, stage, filters }: ApplicationBoardColumnProps) {
  const list = useApplicationStage(tab, stage.id, filters);
  /*
   * `지원 준비 중` 칸을 가리키는 조건이다. 단계 이름을 직접 적지 않는 이유는 탭마다 문구가
   * 달라서다 — 부트캠프에서는 같은 `PREPARING` 이 `신청 전` 이다. 스크랩으로 되돌아갈 수
   * 있는 칸이 그 칸 하나이고, 카드의 `X` 도 같은 조건으로 갈린다(2.2).
   */
  const returnsToScrap = canMoveStage(tab, stage.id, 'SCRAPPED');

  return (
    <section className="flex w-76 shrink-0 flex-col rounded-xl bg-gray-50 p-3">
      <ApplicationBoardColumnHead
        label={stage.label}
        total={list.total}
        showComplete={returnsToScrap}
      />
      <div className="flex flex-col gap-3">
        {list.items.map((item) => (
          <ApplicationBoardCard key={item.key} item={item} />
        ))}
      </div>
      {list.items.length === 0 ? <ApplicationBoardColumnPlaceholder list={list} /> : null}
    </section>
  );
}

/**
 * 칸이 비어 보이는 세 경우를 구분해 적는다. 셋을 한 문구로 뭉뚱그리면 "아직 안 왔다" 와
 * "못 불러왔다" 가 같은 말이 된다 — `.claude/rules/crawling.md` 가 말하는 것과 같은 구분이다.
 */
function ApplicationBoardColumnPlaceholder({
  list,
}: {
  list: ReturnType<typeof useApplicationStage>;
}) {
  const message = list.loading ? '불러오는 중이에요' : list.failed ? '불러오지 못했어요' : '없어요';
  return <p className="px-1 py-6 text-center text-sm text-gray-400">{message}</p>;
}
