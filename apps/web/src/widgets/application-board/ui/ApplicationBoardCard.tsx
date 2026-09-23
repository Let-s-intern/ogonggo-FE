'use client';

import { useDraggable } from '@dnd-kit/core';
import Link from 'next/link';
import { Badge, Select, cn } from '@ogonggo/ui';
import {
  canMoveStage,
  isStageId,
  stageOptions,
  type ApplicationBoardItem,
  type ApplicationBoardTab,
  type ApplicationStage,
  type ApplicationStageId,
  type MoveStage,
} from '@/features/application-board';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';

export interface ApplicationBoardCardProps {
  tab: ApplicationBoardTab;
  /** 이 카드가 놓인 칸. 상태 셀렉트의 현재 값이자 이동의 출발 단계다. */
  stage: ApplicationStage<ApplicationStageId>;
  item: ApplicationBoardItem;
  move: MoveStage;
}

/**
 * 칸 안의 카드 한 장(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`).
 * 회사 로고 · 회사명 / 제목 / `인턴 · 마케팅 · 경력 무관` · `D-1` 이고, 그 아래가 상태 셀렉트다.
 *
 * 썸네일이 없으면 오공고 로고로 떨어진다(`shared/ui/Thumbnail.tsx`). 회색 빈 네모를 두지
 * 않는 이유는 그쪽 주석에 있다 — 빈 네모는 "못 불러왔다" 와 "원래 없다" 를 구분해 주지 않는다.
 *
 * 마감된 건은 D-day 자리에 회색 `마감` 배지다. `entities/job/ui/JobCard.tsx` 와
 * `widgets/mypage-list/ui/MyPageListRowCells.tsx` 가 이미 같은 판단을 한다 — 배지를 통째로
 * 빼면 그 자리가 아무 말도 하지 않는다.
 *
 * **상태 셀렉트는 목업에 없다.** 칸반에 단계를 옮길 길이 `X`(스크랩으로) 하나뿐이라 더했고,
 * 그 모양을 고른 근거는 `.claude/tasks/memos/결정-칸반-단계-이동-컨트롤-2026-09-23.md` 다.
 * 항목과 이동 판정은 리스트 행(`ApplicationBoardRow`) 과 같은 `stageOptions`·`useMoveStage`
 * 를 쓴다 — 보기를 바꿨다고 갈 수 있는 곳이 달라지면 안 된다. 카드가 목업의 128px 보다
 * 높아지는 것은 그 메모가 적은 대로 받아들인 값이다.
 *
 * 카드 본문이 링크이고, 칸에서 빼는 `X` 와 셀렉트는 그 링크 **밖의 형제**다 — 링크 안에
 * 버튼이나 셀렉트를 두면 잘못된 마크업이고 누를 때 상세로 이동까지 함께 일어난다.
 * `entities/job/ui/JobCard.tsx` 의 북마크 버튼과 같은 모양이다.
 */
export function ApplicationBoardCard({ tab, stage, item, move }: ApplicationBoardCardProps) {
  const dday = computeDday(item.recruitmentType, item.recruitmentEndAt);
  const urgent = isDdayUrgent(item.recruitmentType, item.recruitmentEndAt);
  const closed = isRecruitmentClosed(item.recruitmentType, item.recruitmentEndAt, item.closedAt);
  /*
   * `X`(`스크랩으로 되돌리기`)를 그릴 카드인가. 단계 이름을 직접 적지 않는 이유는 탭마다
   * 문구가 달라서다 — 부트캠프에서는 같은 `PREPARING` 이 `신청 전` 이다. 리스트 행의 `X` 와
   * 같은 판정이다.
   */
  const removable = canMoveStage(tab, stage.id, 'SCRAPPED');

  /*
   * 셀렉트가 고른 값. `isStageId` 는 `string` 을 이 탭의 단계 이름으로 좁히기만 한다 — 열리지
   * 않은 전이를 막고 왜 막혔는지 알리는 것은 이동 훅(`useMoveStage`) 한 곳이다.
   */
  const pick = (value: string) => {
    if (isStageId(tab, value)) {
      move.move({ item, from: stage.id, to: value });
    }
  };

  /*
   * 드래그 소스. `id`는 이 카드의 `item.key` 그대로 — `ApplicationBoardKanban`의 `onDragEnd`가
   * `active.data.current`에서 `item`과 `from`을 그대로 꺼내 `move.move`에 넘긴다.
   *
   * `setNodeRef`·`transform`은 카드 전체(이 바깥 `div`)에 둔다. `listeners`·`attributes`는
   * 아래 손잡이 하나에만 건다 — 카드 전체가 잡히면 `Link`를 누르는 클릭과 드래그 시작이
   * 겹친다. 손잡이가 눌린 지점만 드래그를 시작하고, 옮기는 동안 움직이는 것은(`style`) 카드
   * 전체다.
   */
  const draggable = useDraggable({ id: item.key, data: { item, from: stage.id } });
  const style = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={draggable.setNodeRef}
      style={style}
      className={cn(
        'relative rounded-xl bg-white',
        draggable.isDragging && 'z-10 opacity-90 shadow-lg',
      )}
    >
      <div
        {...draggable.listeners}
        {...draggable.attributes}
        role="button"
        aria-label={`${item.title} 드래그해서 단계 옮기기`}
        className="flex h-5 cursor-grab touch-none items-center justify-center text-gray-300 active:cursor-grabbing"
      >
        <span aria-hidden="true" className="icon-[lucide--grip-horizontal] block h-4 w-4" />
      </div>
      <Link href={item.href} className="block px-4 pt-1 pb-3">
        <div className={cn('flex items-center gap-2', removable && 'pr-6')}>
          <Thumbnail
            src={item.thumbnailUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-gray-100"
          />
          <p className="truncate text-sm font-semibold text-gray-600">{item.caption}</p>
        </div>
        <p className="line-clamp-2 pt-3 text-[15px] font-bold text-gray-900">{item.title}</p>
        <div className="flex items-center justify-between gap-2 pt-2">
          <p className="truncate text-xs text-gray-400">{item.meta.join(' · ')}</p>
          {dday ? (
            <Badge
              tone={urgent ? 'urgent' : 'main'}
              className="rounded-full px-2 py-0.5 text-xs font-bold"
            >
              {dday}
            </Badge>
          ) : closed ? (
            <Badge tone="neutral" className="rounded-full px-2 py-0.5 text-xs font-bold">
              마감
            </Badge>
          ) : null}
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Select
          aria-label={`${item.title} 단계`}
          value={stage.id}
          disabled={move.pending}
          onChange={(event) => pick(event.target.value)}
          options={stageOptions(tab, stage.id)}
          className="h-8 w-full rounded-sm border-gray-150 px-3 text-gray-600"
        />
      </div>
      {removable ? (
        <button
          type="button"
          aria-label={`${item.title} 칸에서 빼기`}
          disabled={move.pending}
          onClick={() => move.move({ item, from: stage.id, to: 'SCRAPPED' })}
          className="absolute top-6 right-4 flex h-5 w-5 items-center justify-center text-gray-400 disabled:text-gray-200"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
