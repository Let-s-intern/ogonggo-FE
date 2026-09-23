'use client';

import {
  canMoveStage,
  useApplicationStage,
  type ApplicationBoardFilters,
  type ApplicationBoardTab,
  type ApplicationStage,
  type ApplicationStageId,
  type MoveStage,
} from '@/features/application-board';
import { ApplicationBoardCard } from './ApplicationBoardCard';
import { ApplicationBoardColumnHead } from './ApplicationBoardColumnHead';

export interface ApplicationBoardColumnProps {
  tab: ApplicationBoardTab;
  stage: ApplicationStage<ApplicationStageId>;
  filters: ApplicationBoardFilters;
  /** 칸 전체가 나눠 쓰는 이동 훅. 한 번에 한 건만 옮긴다(`ApplicationBoardKanban`). */
  move: MoveStage;
}

/**
 * 칸반의 칸 하나(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`).
 *
 * **칸 하나가 요청 하나다.** 목록 응답에 단계 칸이 없어 한 번 불러 나눌 수 없다 — 이유는
 * `features/application-board/api/applicationBoardApi.ts` 에 적혀 있다. 그래서 훅을 부르는
 * 자리가 칸 컴포넌트이고, 탭을 옮기면 칸 집합이 통째로 바뀌므로 각 칸이 자기 훅을 들고
 * 마운트·언마운트된다.
 *
 * 치수는 목업 `image.png`(1440px 폭) 의 픽셀에서 읽은 값이다(2026-09-22 실측).
 *
 * | 자리 | 목업 | 여기 |
 * |---|---|---|
 * | 칸 폭 | 307px | `w-76`(304px) |
 * | 칸 바탕 | `#F5F9FF` | `bg-blue-00`(같은 값) |
 * | 안쪽 여백 | 9px | `p-3`(12px) |
 * | 카드 높이 | 128px | 131px(제목 한 줄) |
 * | 카드 사이 | 16px | `gap-4`(16px) |
 *
 * 바탕이 `gray-50` 이 아니다. 목업의 `#F5F9FF` 는 파랑이 섞인 값이고 토큰에 이름이 있다
 * (`--color-blue-00`). 회색 계열로 두면 칸이 카드와 같은 무채색 층으로 읽힌다.
 */
export function ApplicationBoardColumn({ tab, stage, filters, move }: ApplicationBoardColumnProps) {
  const list = useApplicationStage(tab, stage.id, filters);
  /*
   * 카드의 `X`(`스크랩으로 되돌리기`)를 그릴 칸인가. 단계 이름을 직접 적지 않는 이유는 탭마다
   * 문구가 달라서다 — 부트캠프에서는 같은 `PREPARING` 이 `신청 전` 이다.
   *
   * 전이가 전면 개방되면서 **스크랩 칸을 뺀 모든 칸**이 여기 해당한다(예전에는 `지원 준비 중`
   * 하나였다). 사이드·스터디만 `지원 완료` 뒤로는 되돌리는 호출이 없어 여전히 갈린다.
   */
  const returnsToScrap = canMoveStage(tab, stage.id, 'SCRAPPED');

  return (
    <section className="flex w-76 shrink-0 flex-col rounded-xl bg-blue-00 p-3">
      <ApplicationBoardColumnHead label={stage.label} total={list.total} />
      <div className="flex flex-col gap-4">
        {list.items.map((item) => (
          <ApplicationBoardCard
            key={item.key}
            item={item}
            onRemove={
              returnsToScrap ? () => move.move({ item, from: stage.id, to: 'SCRAPPED' }) : undefined
            }
            removing={move.pending}
          />
        ))}
      </div>
      {list.items.length === 0 ? <ApplicationBoardColumnPlaceholder list={list} /> : null}
      {list.hasMore ? (
        <button
          type="button"
          disabled={list.loadingMore}
          onClick={list.loadMore}
          className="pt-3 text-sm text-gray-500 disabled:text-gray-400"
        >
          {list.loadingMore ? '불러오는 중이에요' : '더보기'}
        </button>
      ) : null}
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
