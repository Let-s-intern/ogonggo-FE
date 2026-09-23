export interface ApplicationBoardColumnHeadProps {
  label: string;
  /** 서버가 센 전체 건수. 지금 받아 온 건수가 아니다(`useApplicationStage`). */
  total: number;
}

/**
 * 칸 머리(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`). 이름과 개수다.
 *
 * **접기 꺾쇠는 없다.** task 파일과 PRD 는 칸 머리에 꺾쇠가 있다고 적지만 칸반 목업 세 장
 * 어디에도 없고, 꺾쇠는 리스트 보기의 섹션 머리(`image copy 3.png`) 에만 그려져 있다.
 * 목업을 따랐다 — 근거는 `.claude/tasks/memos/결정-지원신청-관리-push2-2026-09-22.md` 1 절.
 *
 * **`...` 메뉴도 `완료` 버튼도 없다.** `...` 은 달 메뉴가 `공고 편집` 한 줄뿐인데 그것을
 * 그리지 않기로 한 결정이라(PRD 결정 기록) 누르면 빈 목록이 열리는 버튼만 남는다. `완료` 를
 * 뺀 이유는 `.claude/tasks/memos/결정-칸반-완료-버튼-2026-09-23.md` 에 있다 — 목업에서 그
 * 버튼은 `...` 의 `공고 편집` 과 짝이고, 카드의 `X` 를 늘 그리는 이 화면에는 끝낼 편집 모드가
 * 없다.
 */
export function ApplicationBoardColumnHead({ label, total }: ApplicationBoardColumnHeadProps) {
  return (
    <div className="flex items-center gap-1.5 px-1 pb-3">
      <h3 className="text-base font-bold text-gray-900">{label}</h3>
      <span className="text-base font-medium text-gray-400">{total}</span>
    </div>
  );
}
