/**
 * 받을 필드가 없는 본문 칸 셋을 `content` 뒤에 이어 붙인다(v5 PRD 4 절).
 *
 * 목업의 `강사 정보`·`교육 특징/혜택`·`수료 조건` 에 대응하는 필드가
 * `CreateCompanyBootcampRequest` 에 없다. 칸을 비활성으로 두지 않고 입력을 받되, 저장할 때
 * 여기서 본문 뒤에 붙인다 — 적은 글이 어디에도 남지 않는 것보다 본문 안에 남는 편이 낫다.
 *
 * **붙이면 되돌릴 수 없다.** 되읽을 때 칸으로 다시 나누지 않는 이유는, 나누려면 이 형식을
 * 거꾸로 읽어야 하는데 기업이 그 사이 본문을 손으로 고쳐 두었을 수 있기 때문이다. 그때 잘못
 * 나눈 조각은 저장하는 순간 원래 글을 덮어쓴다. 화면은 저장된 글을 저장된 모양 그대로
 * 보여 준다(채용공고 폼의 채용 절차가 같은 판단을 했다,
 * `widgets/company-job-form/lib/hiringProcess.ts`).
 *
 * **백엔드에 세 필드가 생기면 이 파일을 지운다.** 붙이는 형식이 여기 한 곳에만 있는 이유가
 * 그것이다.
 */

export interface BootcampContentExtras {
  instructorInfo: string;
  programHighlights: string;
  completionRequirements: string;
}

export const EMPTY_BOOTCAMP_CONTENT_EXTRAS: BootcampContentExtras = {
  instructorInfo: '',
  programHighlights: '',
  completionRequirements: '',
};

/** 세 칸 아래 각각 붙는 한 줄. 저장되는 자리가 본문이라는 것을 칸마다 말한다. */
export const CONTENT_EXTRA_NOTICE =
  '저장할 때 공고 상세 내용 뒤에 이어 붙어요. 다시 열면 이 칸으로 나뉘지 않아요.';

/** 붙일 때 앞에 세우는 제목. 칸 이름 그대로다. */
const EXTRA_HEADINGS: readonly [keyof BootcampContentExtras, string][] = [
  ['instructorInfo', '강사 정보'],
  ['programHighlights', '교육 특징/혜택'],
  ['completionRequirements', '수료 조건'],
];

/**
 * 본문과 세 칸을 한 덩어리로 합친다. 빈 칸은 제목째 빠진다 — 제목만 남은 구역은 읽는 사람에게
 * 아무것도 말해 주지 않는다.
 *
 * 구역 사이는 빈 줄 하나다. 부트캠프 본문은 평문이고 줄바꿈이 그대로 보관된다.
 */
export function appendContentExtras(content: string, extras: BootcampContentExtras): string {
  const blocks = EXTRA_HEADINGS.map(([key, heading]) => {
    const body = extras[key].trim();
    return body ? `[${heading}]\n${body}` : '';
  }).filter((block) => block.length > 0);

  return [content.trim(), ...blocks].filter((block) => block.length > 0).join('\n\n');
}
