/**
 * 채용 절차 행 여럿을 `hiringProcess` 한 문자열로 합친다(v5 PRD 3 절).
 *
 * 목업은 날짜 + 내용의 반복 행인데 `CreateCompanyJobRequest.hiringProcess` 는 **단일
 * 문자열**이다. 입력은 행으로 받고 저장할 때 여기서 합친다.
 *
 * **합치면 되돌릴 수 없다.** 되읽을 때 행으로 다시 나누지 않는 이유는, 나누려면 이 형식을
 * 거꾸로 읽어야 하는데 기업이 그 사이 한 덩어리 글을 손으로 고쳐 두었을 수 있기 때문이다.
 * 그때 잘못 나눈 행은 저장하는 순간 원래 글을 덮어쓴다. 화면은 저장된 글을 저장된 모양
 * 그대로 보여 준다.
 *
 * **백엔드가 배열을 받게 되면 이 파일을 지운다.** 합치는 형식이 여기 한 곳에만 있는 이유가
 * 그것이다.
 */

export interface HiringProcessStep {
  /** `YYYY-MM-DD`. 비워 둘 수 있다 — 일정이 정해지지 않은 단계가 있다. */
  date: string;
  description: string;
}

export const EMPTY_HIRING_PROCESS_STEP: HiringProcessStep = { date: '', description: '' };

/**
 * 한 줄이 한 단계다(`2026-03-02 서류 전형`). 공개 상세가 `whitespace-pre-line` 으로 그려
 * 줄바꿈이 그대로 보인다(`widgets/job-detail/ui/JobDetailView.tsx`).
 *
 * 날짜만 있고 내용이 없는 행은 버린다. 날짜 하나만 적힌 줄은 읽는 사람에게 아무것도
 * 말해 주지 않는다.
 */
export function joinHiringProcess(steps: readonly HiringProcessStep[]): string {
  return steps
    .map(({ date, description }) => ({ date: date.trim(), description: description.trim() }))
    .filter(({ description }) => description.length > 0)
    .map(({ date, description }) => (date ? `${date} ${description}` : description))
    .join('\n');
}
