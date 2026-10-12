import { Toggle } from '@ogonggo/ui';

export interface PickToggleProps {
  /** 이 공고가 오늘의 공고(오공고 PICK)에 들어 있는가. */
  picked: boolean;
  /** 오늘의 공고를 받지 못했거나 다른 요청이 오가는 중이라 바꿀 수 없다. */
  disabled: boolean;
}

/**
 * 채용공고 목록의 `PICK` 칸. 오늘의 공고에 든 공고는 켜져 있다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 토글을 누르는 순간 화면이
 * 넘어간다(`VisibilityToggle` 과 같다).
 */
export function PickToggle({ picked, disabled }: PickToggleProps) {
  return (
    // 라벨이 줄바꿈되면 행 높이가 들쭉날쭉해진다.
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle checked={picked} disabled={disabled} label="PICK" onChange={() => undefined} />
    </span>
  );
}
