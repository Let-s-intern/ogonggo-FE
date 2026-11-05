/** 이름표로 볼 글의 최대 길이. `마감기한`, `경력사항`, `근무지` 처럼 짧은 칸 이름만 잡는다. */
const LABEL_MAX = 10;
/** 값으로 볼 글의 최대 길이. 이보다 길면 본문 문단이라 줄로 바꾸지 않는다. */
const VALUE_MAX = 120;

const ROW_CLASS = 'source-label-row';
const LABEL_CLASS = 'source-label';

/**
 * 표 줄 모양. 원문을 그리는 상자의 클래스에 더한다. 웹 공고 상세(`OriginalTab`)와 어드민 원문 미리보기(`SourcePane`)가
 * 같이 쓴다.
 */
export const SOURCE_LABEL_ROW_CLASS =
  '[&_.source-label-row]:flex [&_.source-label-row]:gap-4 [&_.source-label-row]:border-b [&_.source-label-row]:border-gray-100 [&_.source-label-row]:py-2 [&_.source-label]:w-20 [&_.source-label]:shrink-0 [&_.source-label]:text-gray-500';

/** 자식 요소가 없는 `div`·`span`. 글만 든 칸이다. */
function isLeaf(node: ChildNode): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    (node.tagName === 'DIV' || node.tagName === 'SPAN') &&
    node.children.length === 0
  );
}

/**
 * 원문 HTML 의 "칸 이름 + 값" 묶음에 표 줄 클래스를 붙인다(2026-11-05 사용자 제보, 그리팅 공고).
 *
 * 그리팅 같은 채용 페이지는 공고 위쪽 정보(마감기한, 부문, 직군, 경력사항, 고용형태, 근무지)를
 * `<div><div>부문</div>People</div>` 처럼 이름 칸과 값을 나란히 둔 `div` 로 그리고 모양은 클래스·스타일로 낸다.
 * 백엔드가 저장할 때 클래스·스타일을 지우므로(`JobSourceHtmlSanitizer`) 화면에는 이름과 값이 한 줄씩 쌓여
 * `부문 / People / 직군 / 대학생인턴` 처럼 보였다.
 *
 * 그래서 첫 자식이 짧은 글만 든 칸이고, 나머지가 짧은 글(또는 글만 든 칸 하나)인 `div` 를 표 한 줄로 본다.
 * 긴 글이 따라오는 소제목 묶음은 값이 길어 걸리지 않는다. 모양은 `SOURCE_LABEL_ROW_CLASS` 로 준다.
 */
export function markLabelRows(root: HTMLElement) {
  for (const row of root.querySelectorAll('div')) {
    const [first, ...rest] = Array.from(row.childNodes).filter(
      (node) => !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()),
    );
    if (!first || rest.length === 0 || !isLeaf(first)) {
      continue;
    }
    const label = first.textContent?.trim() ?? '';
    if (label.length === 0 || label.length > LABEL_MAX) {
      continue;
    }
    const valueIsSimple = rest.every((node) => node.nodeType === Node.TEXT_NODE || isLeaf(node));
    const value = rest
      .map((node) => node.textContent ?? '')
      .join('')
      .trim();
    if (!valueIsSimple || value.length === 0 || value.length > VALUE_MAX) {
      continue;
    }
    row.classList.add(ROW_CLASS);
    first.classList.add(LABEL_CLASS);
  }
}

/**
 * `markLabelRows` 를 HTML 문자열에 적용한 결과. 브라우저에서만 그리는 화면(어드민)은 그린 뒤 DOM 을 고치지 않고
 * 이 값을 바로 그린다. 그린 뒤 고치면 React 가 같은 HTML 을 다시 넣을 때 붙인 클래스가 사라진다.
 * `DOMParser` 가 없는 곳(서버 렌더)에서는 받은 그대로 돌려준다.
 */
export function withLabelRows(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  markLabelRows(doc.body);
  return doc.body.innerHTML;
}
