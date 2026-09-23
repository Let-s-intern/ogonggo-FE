'use client';

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

  return (
    <div className="relative rounded-xl bg-white">
      <Link href={item.href} className="block p-4 pb-3">
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
          className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center text-gray-400 disabled:text-gray-200"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
