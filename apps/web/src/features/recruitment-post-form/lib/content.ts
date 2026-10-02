/**
 * 모집 상세 내용(`content`, Lexical EditorState JSON) 에서 서식 없는 글자를 뽑는다. 수정 화면에서
 * 칸이 채워졌는지 볼 때 쓴다. 편집 자체는 공용 편집기(`@ogonggo/ui/src/editor/RichTextEditor`)가
 * JSON 을 그대로 다룬다.
 */

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const childrenOf = (node: JsonObject): unknown[] =>
  Array.isArray(node.children) ? node.children : [];

/** 노드 아래의 글자를 모두 모은다. `lexicalHtml.ts` 의 같은 이름 함수와 규칙이 같다. */
function collectText(node: unknown): string {
  if (!isObject(node)) {
    return '';
  }
  if (node.type === 'linebreak') {
    return '\n';
  }
  const own = typeof node.text === 'string' ? node.text : '';
  return own + childrenOf(node).map(collectText).join('');
}

/**
 * 저장된 본문에서 작성 칸에 넣을 평문을 뽑는다. 루트 아래 블록 하나가 한 줄이다.
 *
 * 문자열로 온 EditorState 도 받는다(`lexicalHtml.ts` 의 `parseState` 와 같은 이유 — 백엔드가
 * JSON 객체로 준다고 적고 있지만 문자열로 오는 경우를 읽는 쪽이 이미 견디고 있다).
 */
export function lexicalToText(content: unknown): string {
  if (content === undefined || content === null) {
    return '';
  }
  let state: unknown = content;
  if (typeof content === 'string') {
    try {
      state = JSON.parse(content) as unknown;
    } catch {
      return content;
    }
  }
  const root = isObject(state) && isObject(state.root) ? state.root : undefined;
  if (!root) {
    return '';
  }
  return childrenOf(root).map(collectText).join('\n').replace(/\n+$/, '');
}
