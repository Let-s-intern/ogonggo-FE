'use client';

import Link from 'next/link';
import { Badge, Select, useToast } from '@ogonggo/ui';
import {
  canMoveStage,
  isMovableStageId,
  movableTargets,
  stagesOf,
  type ApplicationBoardItem,
  type ApplicationBoardTab,
  type ApplicationStage,
  type ApplicationStageId,
  type MoveStage,
} from '@/features/application-board';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { formatDeadline } from '@/widgets/mypage-list';
import { STAGE_NOT_OPEN_MESSAGE } from './ApplicationBoardColumnHead';

/**
 * `지원하기` 를 그리는 마지막 단계. PRD "리스트 보기" 가 "`지원 완료` 뒤 섹션들은 `지원하기`
 * 버튼이 없다" 로 적고, 채용공고 목업(`image copy 3.png`) 의 `지원 완료` 행에 버튼이 있다.
 *
 * 단계 이름이 아니라 탭마다 값을 적는 이유는 `COMPLETED` 가 탭마다 다른 단계라서다 —
 * 사이드·스터디에서는 `지원 완료` 이고 부트캠프에서는 마지막 단계인 `활동 완료` 다.
 */
const LAST_APPLY_STAGE: Record<ApplicationBoardTab, ApplicationStageId> = {
  jobs: 'APPLIED',
  bootcamps: 'APPLIED',
  'side-studies': 'COMPLETED',
};

/**
 * 마감일시 대신 활동 기간을 그리는 단계(PRD "활동 단계는 마감일시 대신 기간").
 * 채용공고에는 활동이라는 것이 없어 비어 있다.
 */
const ACTIVITY_STAGES: Record<ApplicationBoardTab, readonly ApplicationStageId[]> = {
  jobs: [],
  bootcamps: ['IN_PROGRESS', 'COMPLETED'],
  'side-studies': ['IN_PROGRESS', 'ENDED'],
};

function showsApply(tab: ApplicationBoardTab, stageId: ApplicationStageId): boolean {
  const ids: readonly ApplicationStageId[] = stagesOf(tab).map((stage) => stage.id);
  return ids.indexOf(stageId) <= ids.indexOf(LAST_APPLY_STAGE[tab]);
}

/**
 * 활동 기간 문구. 날짜 형식은 마감일시와 같은 `formatDeadline` 이라 두 줄이 같은 모양이다.
 *
 * 기간을 모르는 단계가 있다(사이드·스터디의 활동 중·활동 완료). 칸을 비우지 않고 모른다고
 * 적는다 — 빈 칸은 "기간이 없다" 로 읽힌다.
 */
function activityPeriod(item: ApplicationBoardItem): string {
  if (!item.activityStartDate) {
    return '활동 기간 미정';
  }
  const start = formatDeadline('PERIOD', item.activityStartDate);
  return item.activityEndDate
    ? `${start} ~ ${formatDeadline('PERIOD', item.activityEndDate)}`
    : `${start} ~`;
}

export interface ApplicationBoardRowProps {
  tab: ApplicationBoardTab;
  /** 이 행이 놓인 섹션. 상태 셀렉트의 현재 값이자 이동의 출발 단계다. */
  stage: ApplicationStage<ApplicationStageId>;
  item: ApplicationBoardItem;
  move: MoveStage;
}

/**
 * 리스트 보기의 행 하나(목업 `docs/asset/v7 스크랩한 공고 칸반/image copy 3.png`).
 * `X` · 로고 · 회사명 · 제목 · 메타 · `D-3` · 마감일시 · 상태 셀렉트 · `지원하기` 다.
 *
 * `widgets/mypage-list/ui/MyPageListRowCells.tsx` 를 쓰지 않는다. 그쪽은 `<td>` 두 칸을
 * 내주는 표 전용이고 이 목록에는 표 머리가 없다 — 목업에 열 이름 줄이 없고, 섹션 머리가
 * 그 자리를 대신한다. 제목만 링크인 것은 그쪽과 같은 이유다: 행 전체를 링크로 감싸면 뒤에
 * 붙는 셀렉트와 버튼이 그 안에 들어간다.
 *
 * **`지원하기` 는 상세 화면으로 간다.** 목록 응답 어디에도 지원 주소가 없다 — `applicationUrl`
 * 은 상세 응답의 칸이고(`widgets/bootcamp-detail/ui/BootcampDetailView.tsx` 가 그것을 쓴다),
 * 요약 응답에는 들어오지 않는다. 없는 주소를 지어내는 대신 그 링크가 있는 화면으로 보낸다.
 *
 * **`X` 는 단계 이름이 아니라 전이로 갈린다.** 스크랩으로 되돌아갈 수 있는 단계에만 붙고,
 * 그 판정은 칸반 카드의 `X` 와 같은 `canMoveStage` 다 — 부트캠프에서는 같은 단계의 이름이
 * `신청 전` 이라 이름으로 가르면 탭마다 어긋난다.
 *
 * 치수는 목업(1440px 폭) 실측이다(2026-09-22). 행 높이 100px, 좌우 여백 24px, 썸네일 40px,
 * 상태 셀렉트 120x32, `지원하기` 80x32, 행 사이 `gray-200` 가로선 1px. 마감일시는 12px 다 —
 * v4 표(`MyPageListRowCells`) 의 14px 과 다르고 목업 글자 높이가 그렇게 잰다.
 */
export function ApplicationBoardRow({ tab, stage, item, move }: ApplicationBoardRowProps) {
  const activity = ACTIVITY_STAGES[tab].includes(stage.id);
  const removable = canMoveStage(tab, stage.id, 'SCRAPPED');
  const dday = computeDday(item.recruitmentType, item.recruitmentEndAt);
  const urgent = isDdayUrgent(item.recruitmentType, item.recruitmentEndAt);
  const closed = isRecruitmentClosed(item.recruitmentType, item.recruitmentEndAt, item.closedAt);
  const toast = useToast();
  /*
   * 셀렉트는 그 탭의 단계를 전부 늘어놓고 **옮길 수 없는 단계만 비활성**으로 둔다
   * (PRD 결정 기록 "칸·섹션은 목업대로 그리고 옮기는 조작만 막는다"). 목록에서 빼지 않는
   * 이유는 어디까지 있는 흐름인지가 그 자체로 정보이기 때문이고, 지금 단계는 현재 값이라
   * 언제나 고를 수 있다.
   */
  const targets = movableTargets(tab, stage.id);
  const stageOptions = stagesOf(tab).map((option) => ({
    value: option.id,
    label: option.label,
    disabled: option.id !== stage.id && !targets.includes(option.id),
  }));

  /*
   * 셀렉트가 고른 값. 열리지 않은 전이는 이동 훅까지 가기 전에 여기서 막고 왜 막혔는지
   * 알린다 — 칸 머리의 `완료` 와 같은 문구다. 열린 전이인지까지는 훅이 다시 본다.
   */
  const pick = (value: string) => {
    if (!isMovableStageId(value)) {
      toast.show({ message: STAGE_NOT_OPEN_MESSAGE, tone: 'error' });
      return;
    }
    move.move({ item, from: stage.id, to: value });
  };

  return (
    <div className="flex items-center border-b border-gray-200 px-6 py-5.5">
      {removable ? (
        <button
          type="button"
          aria-label={`${item.title} 스크랩으로 되돌리기`}
          disabled={move.pending}
          onClick={() => move.move({ item, from: stage.id, to: 'SCRAPPED' })}
          className="mr-5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-gray-400 disabled:text-gray-200"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-3.5 w-3.5" />
        </button>
      ) : null}
      <Thumbnail
        src={item.thumbnailUrl}
        alt=""
        className="mr-5 h-10 w-10 shrink-0 rounded-md border border-gray-100"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-600">{item.caption}</p>
        <Link
          href={item.href}
          className="block truncate text-base font-bold text-gray-900 hover:underline"
        >
          {item.title}
        </Link>
        <p className="truncate text-xs text-gray-400">{item.meta.join(' · ')}</p>
      </div>
      <div className="ml-6 flex flex-1 items-center gap-5">
        {activity ? null : dday ? (
          <Badge
            tone={urgent ? 'urgent' : 'main'}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-bold"
          >
            {dday}
          </Badge>
        ) : closed ? (
          <Badge tone="neutral" className="shrink-0 rounded-full px-2 py-1 text-xs font-bold">
            마감
          </Badge>
        ) : null}
        <span className="truncate text-xs text-gray-400">
          {activity
            ? activityPeriod(item)
            : formatDeadline(item.recruitmentType, item.recruitmentEndAt)}
        </span>
      </div>
      <Select
        aria-label={`${item.title} 단계`}
        value={stage.id}
        disabled={move.pending}
        onChange={(event) => pick(event.target.value)}
        options={stageOptions}
        className="ml-6 h-8 w-30 shrink-0 rounded-sm border-gray-150 px-3 text-gray-600"
      />
      {showsApply(tab, stage.id) ? (
        <Link
          href={item.href}
          className="ml-10 flex h-8 w-20 shrink-0 items-center justify-center rounded-sm bg-blue-500 text-sm font-semibold text-white"
        >
          지원하기
        </Link>
      ) : null}
    </div>
  );
}
