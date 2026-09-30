'use client';

import { useDraggable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { Badge, cn } from '@ogonggo/ui';
import {
  canMoveStage,
  type ApplicationBoardItem,
  type ApplicationBoardTab,
  type ApplicationStage,
  type ApplicationStageId,
  type MoveStage,
} from '@/features/application-board';
import {
  computeDday,
  isDdayUrgent,
  isRecruitmentClosed,
  ALWAYS_OPEN_LABEL,
  isAlwaysOpen,
} from '@/shared/lib/dday';
import { ApplicationBoardItemImage } from './ApplicationBoardItemImage';

export interface ApplicationBoardCardProps {
  tab: ApplicationBoardTab;
  /** 이 카드가 놓인 칸. 이동의 출발 단계다. */
  stage: ApplicationStage<ApplicationStageId>;
  item: ApplicationBoardItem;
  move: MoveStage;
}

/**
 * 칸 안의 카드 한 장(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`).
 * 회사 로고 · 회사명 / 제목 / `인턴 · 마케팅 · 경력 무관` · `D-1` 이다.
 *
 * 썸네일이 없으면 오공고 로고로 떨어진다(`shared/ui/Thumbnail.tsx`). 회색 빈 네모를 두지
 * 않는 이유는 그쪽 주석에 있다 — 빈 네모는 "못 불러왔다" 와 "원래 없다" 를 구분해 주지 않는다.
 *
 * 마감된 건은 D-day 자리에 회색 `마감` 배지다. `entities/job/ui/JobCard.tsx` 와
 * `widgets/mypage-list/ui/MyPageListRowCells.tsx` 가 이미 같은 판단을 한다 — 배지를 통째로
 * 빼면 그 자리가 아무 말도 하지 않는다.
 *
 * **단계는 카드를 끌어서만 옮긴다.** 상태 셀렉트는 뺐다(2026-09-29 요청) — 이동 판정은
 * 여전히 리스트 행(`ApplicationBoardRow`) 과 같은 `useMoveStage` 한 곳이다.
 *
 * 카드 전체가 드래그 영역이고, 짧게 누르면 상세를 연다. 상세는 `/mypage/scraps/@modal` 이
 * 가로채 모달로 뜬다. 누름과 끌기는 `ApplicationBoardKanban` 의 센서가 가른다 — 몇 px 움직여야
 * 끌기로 친다.
 *
 * 본문을 `Link` 로 두지 않은 이유: 끌기가 끝나면 dnd-kit 이 document 캡처 단계에서 클릭 전파를
 * 끊는데, 기본 동작은 막지 않는다. `Link` 의 `onClick` 은 못 돌고 앵커의 기본 이동만 남아
 * 가로채기 없는 전체 페이지 이동이 된다. `router.push` 는 클릭 처리기 안에 있으니 끊기면
 * 아무 일도 일어나지 않는다.
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

  const router = useRouter();
  const open = () => router.push(item.href);

  /*
   * 드래그 소스. `id`는 이 카드의 `item.key` 그대로 — `ApplicationBoardKanban`의 `onDragEnd`가
   * `active.data.current`에서 `item`과 `from`을 그대로 꺼내 `move.move`에 넘긴다.
   *
   * 노드·활성 노드·`listeners` 가 모두 카드 전체다. 활성 노드를 따로 지정하는 것은 키보드
   * 센서가 카드 자신에게 눌린 키만 받게 하려는 것이다 — 안의 `X` 버튼에서 누른 Space 가
   * 끌기를 시작하지 않는다.
   */
  const draggable = useDraggable({ id: item.key, data: { item, from: stage.id } });
  /*
   * Space 는 키보드 끌기(`ApplicationBoardKanban` 의 센서 설정), Enter 는 상세 열기다. 끄는
   * 중의 Enter 는 놓기라 열지 않는다.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    draggable.listeners?.onKeyDown?.(event);
    if (event.key === 'Enter' && event.target === event.currentTarget && !draggable.isDragging) {
      open();
    }
  };
  const style = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={(node) => {
        draggable.setNodeRef(node);
        draggable.setActivatorNodeRef(node);
      }}
      style={style}
      {...draggable.listeners}
      {...draggable.attributes}
      onKeyDown={handleKeyDown}
      onClick={open}
      aria-label={`${item.title} 상세 보기, 끌어서 단계 옮기기`}
      className={cn(
        'relative cursor-grab rounded-xl bg-white active:cursor-grabbing',
        draggable.isDragging && 'z-10 opacity-90 shadow-lg',
      )}
    >
      <div className="px-4 py-4">
        <div className={cn('flex items-center gap-2', removable && 'pr-6')}>
          <ApplicationBoardItemImage
            item={item}
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
          ) : isAlwaysOpen(item.recruitmentType, item.recruitmentEndAt) ? (
            <Badge tone="main" className="rounded-full px-2 py-0.5 text-xs font-bold">
              {ALWAYS_OPEN_LABEL}
            </Badge>
          ) : null}
        </div>
      </div>
      {removable ? (
        <button
          type="button"
          aria-label={`${item.title} 칸에서 빼기`}
          disabled={move.pending}
          onClick={(event) => {
            // 카드의 `onClick`(상세 열기)까지 올라가지 않게 한다.
            event.stopPropagation();
            move.move({ item, from: stage.id, to: 'SCRAPPED' });
          }}
          className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center text-gray-400 disabled:text-gray-200"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
