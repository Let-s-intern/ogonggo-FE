/** 폭 없는 공백. 크롤링한 본문 곳곳에 섞여 있고, 지우지 않으면 항목 앞뒤에 보이지 않는 글자가 남는다. */
const ZERO_WIDTH_SPACE = /\u200b/g;

/**
 * 줄 맨 앞의 목록 표시. `-`, `·`, `•` 와 번호(`1.` `1)` `(1)`).
 * 번호는 두 자리까지만 본다 — `2027. 2월` 의 연도나 `1.5년` 의 소수를 목록 표시로 지우지 않기 위해서다.
 */
const LEADING_MARKER = /^(?:[-·•]\s*|(?:\(\d{1,2}\)|\d{1,2}[.)])\s*(?!\d))/;

const INLINE_SEPARATOR = ' - ';

/** 한 줄 안의 번호. 줄 맨 앞이거나 공백 뒤에 오고, 번호 뒤에 공백이 따르는 `1.` `2)` 만 본다. */
const INLINE_NUMBER = /(?:^|\s)(\d{1,2})[.)]\s+/g;

/**
 * 한 줄 안에 `1. A 2. B` 로 이어진 번호 목록을 나눈다. 줄 맨 앞이 `1.` 이고 번호가 1, 2, 3… 으로
 * 이어질 때만 목록으로 본다 — `2027. 2월 입사` 나 `1.5년` 같은 숫자를 목록으로 자르지 않기 위해서다.
 * 번호가 하나뿐이거나 순서가 어긋나면 `null` 이고, 부르는 쪽이 한 줄 그대로 둔다.
 */
function splitInlineNumbers(line: string): string[] | null {
  const marks = [...line.matchAll(INLINE_NUMBER)];
  if (marks.length < 2 || marks[0]?.index !== 0) {
    return null;
  }
  if (!marks.every((mark, order) => Number(mark[1]) === order + 1)) {
    return null;
  }

  const items = marks.map((mark, order) => {
    const from = mark.index + mark[0].length;
    const to = marks[order + 1]?.index ?? line.length;
    return line.slice(from, to).trim();
  });
  return items.filter(Boolean);
}

/**
 * 자격 요건·우대 사항처럼 글 덩어리로 오는 본문을 항목 목록으로 나눈다. 빈 값은 빈 배열이다.
 *
 * 1. `\u200b` 를 지운다.
 * 2. 줄바꿈으로 나눈다.
 * 3. 각 줄의 앞 목록 표시(`-` `·` `•` 번호)를 지우고 앞뒤 공백을 자른다.
 * 4. 빈 줄을 버린다.
 * 5. 결과가 한 줄이고 그 안에 ` - ` 가 둘 이상이면 그걸로 다시 나눈다.
 *
 * 3번에서 앞 목록 표시를 지우기 전에, 줄이 하나뿐이고 `1. A 2. B` 처럼 번호가 1부터 이어지면 번호로
 * 나눈다(아래 15293 의 담당 업무). 지우고 나면 첫 번호만 사라지고 나머지가 한 줄에 남기 때문이다.
 *
 * 아래 예시는 운영 공고의 모양을 줄여 옮긴 것이고, 괄호의 숫자는 공고 번호다.
 *
 * 줄바꿈으로 나뉜 본문(14165)
 *   입력  '영상 미디어 홍보 유 경력자 우대\n관련 업무 종사자 우대\n해당 프로젝트 기획 및 구현 유 경험자 우대\n유튜브, 릴스 관련 제작 회사 근무자 우대'
 *   결과  ['영상 미디어 홍보 유 경력자 우대', '관련 업무 종사자 우대', '해당 프로젝트 기획 및 구현 유 경험자 우대', '유튜브, 릴스 관련 제작 회사 근무자 우대']
 *
 * 한 줄 안에서 ` - ` 로 나뉜 본문(15293)
 *   입력  '보건증 보유하신 분 - 내가 하는 일에 자부심을 가지신 분 - 신입분을 환영합니다.'
 *   결과  ['보건증 보유하신 분', '내가 하는 일에 자부심을 가지신 분', '신입분을 환영합니다.']
 *   ` - ` 가 하나뿐인 한 줄('인근 거주자 - 유관경력 보유자')은 나누지 않고 그대로 한 항목이다.
 *
 * 한 줄 안에서 번호로 이어진 본문(15293 의 담당 업무)
 *   입력  '1. 제빵 제반 업무 2. 제품 품질 및 위생 관리'
 *   결과  ['제빵 제반 업무', '제품 품질 및 위생 관리']
 *   번호가 1 로 시작해 1, 2, 3 으로 이어지지 않으면 나누지 않는다('2027. 2월 입사 예정' 은 그대로 한 항목).
 *
 * 폭 없는 공백이 섞인 본문(14165, 13193)
 *   입력  '웹 퍼블리싱 경력 \u200b3~5년 \u200b보유하신 분\n반응형 \u200b웹 및 \u200b크로스브라우징 구현 가능하신 분'
 *   결과  ['웹 퍼블리싱 경력 3~5년 보유하신 분', '반응형 웹 및 크로스브라우징 구현 가능하신 분']
 *
 * 앞에 목록 표시가 붙은 본문
 *   입력  '- 서버 개발 경험\n· 클라우드 이해\n1. 영어 가능자\n2) 병역 필 또는 면제\n(3) 인근 거주자\n\n'
 *   결과  ['서버 개발 경험', '클라우드 이해', '영어 가능자', '병역 필 또는 면제', '인근 거주자']
 *
 * 결과가 항목 하나뿐이면 목록으로 보여줄 이유가 없다. 체크박스 대신 글로 보일지는 부르는 쪽이 정한다.
 */
export function splitLines(text?: string | null): string[] {
  if (!text) {
    return [];
  }

  const rawLines = text
    .replace(ZERO_WIDTH_SPACE, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [onlyRawLine] = rawLines;
  if (rawLines.length === 1 && onlyRawLine) {
    const numbered = splitInlineNumbers(onlyRawLine);
    if (numbered) {
      return numbered;
    }
  }

  const lines = rawLines.map((line) => line.replace(LEADING_MARKER, '').trim()).filter(Boolean);

  const [onlyLine] = lines;
  if (lines.length === 1 && onlyLine) {
    const parts = onlyLine.split(INLINE_SEPARATOR);
    if (parts.length >= 3) {
      return parts.map((part) => part.trim()).filter(Boolean);
    }
  }

  return lines;
}
