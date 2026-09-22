'use client';

import { useToast } from '@ogonggo/ui';

/**
 * `지원 준비 중` 칸의 `완료` 를 눌렀을 때.
 *
 * 목업은 이 버튼을 그 칸에만 달아 두었고, 그 칸의 다음 단계가 `지원 완료`(부트캠프는 `신청
 * 완료`) 다. 그런데 **백엔드에 그 전이가 없다** — `JobApplicationStatus.movableFrom()` 이
 * `SCRAPPED ↔ PREPARING` 하나만 열어 두었고, PRD 결정 기록도 "칸은 목업대로 그리고 옮기는
 * 조작만 막는다" 로 적는다. 그래서 버튼은 그리되 누르면 왜 안 되는지 말한다.
 *
 * 비활성 버튼으로 두지 않는다. 회색으로 꺼 둔 버튼은 아직 안 열린 것인지 내 계정이 못 하는
 * 것인지 알려 주지 않는다 — PRD 완료 조건이 "왜 막혔는지 알 수 있다" 이다.
 */
const NOT_OPEN_MESSAGE = '아직 옮길 수 없는 단계예요';

export interface ApplicationBoardColumnHeadProps {
  label: string;
  /** 서버가 센 전체 건수. 지금 받아 온 건수가 아니다(`useApplicationStage`). */
  total: number;
  /** `완료` 버튼을 그릴 칸인가. `지원 준비 중` 칸 하나다. */
  showComplete: boolean;
}

/**
 * 칸 머리(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`). 이름 · 개수 · `완료` 다.
 *
 * **접기 꺾쇠는 없다.** task 파일과 PRD 는 칸 머리에 꺾쇠가 있다고 적지만 칸반 목업 세 장
 * 어디에도 없고, 꺾쇠는 리스트 보기의 섹션 머리(`image copy 3.png`) 에만 그려져 있다.
 * 목업을 따랐다 — 근거는 `.claude/tasks/memos/결정-지원신청-관리-push2-2026-09-22.md` 1 절.
 *
 * **`...` 메뉴도 없다.** 달 메뉴가 `공고 편집` 한 줄뿐인데 그것을 그리지 않기로 한 결정이라
 * (PRD 결정 기록) 누르면 빈 목록이 열리는 버튼만 남는다.
 */
export function ApplicationBoardColumnHead({
  label,
  total,
  showComplete,
}: ApplicationBoardColumnHeadProps) {
  const toast = useToast();

  return (
    <div className="flex items-center gap-1.5 px-1 pb-3">
      <h3 className="text-base font-bold text-gray-900">{label}</h3>
      <span className="text-base font-medium text-gray-400">{total}</span>
      {showComplete ? (
        <button
          type="button"
          className="ml-auto text-sm font-semibold text-blue-500"
          onClick={() => toast.show({ message: NOT_OPEN_MESSAGE, tone: 'error' })}
        >
          완료
        </button>
      ) : null}
    </div>
  );
}
