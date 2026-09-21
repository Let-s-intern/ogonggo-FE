/**
 * 순서를 가진 반복 행(`partners`·`curriculums`) 을 다루는 값과 규칙(v5 PRD 4 절).
 *
 * 요청은 두 배열의 항목마다 `displayOrder` 를 받는다. **화면은 그 숫자를 칸으로 받지 않고
 * 배열의 자리로 다룬다** — 손잡이로 옮긴 자리가 곧 순서이고, 저장할 때 자리에서 숫자를
 * 만든다. 숫자를 직접 적게 두면 둘이 같은 값을 갖거나 중간이 비는 일을 화면이 막아야 한다.
 */

export interface BootcampPartnerRow {
  partnerName: string;
}

export interface BootcampCurriculumRow {
  /** `<input type="number">` 의 값이라 문자열이다. 적기 전에는 빈 칸이다. */
  startWeek: string;
  endWeek: string;
  subtitle: string;
}

export const EMPTY_PARTNER_ROW: BootcampPartnerRow = { partnerName: '' };

export const EMPTY_CURRICULUM_ROW: BootcampCurriculumRow = {
  startWeek: '',
  endWeek: '',
  subtitle: '',
};

/**
 * 행 하나를 다른 자리로 옮긴다. 범위 밖으로 가면 그대로 둔다 — 맨 위 행에서 위 화살표를
 * 누르는 것은 흔하고, 그때 행이 맨 아래로 돌아가면 옮길 뜻이 없던 순서가 바뀐다.
 */
export function moveRow<T>(rows: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
    return [...rows];
  }
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) {
    return [...rows];
  }
  next.splice(to, 0, moved);
  return next;
}
