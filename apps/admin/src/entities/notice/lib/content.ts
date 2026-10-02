/**
 * 공지 본문(`content`, Lexical EditorState JSON 문자열) 에서 서식 없는 글자를 뽑는다. 수정 폼을
 * 열 때 본문이 비었는지 보려고 쓴다. 편집은 공용 편집기(`@ogonggo/ui/src/editor/RichTextEditor`)가
 * JSON 을 그대로 다룬다.
 */

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const childrenOf = (node: JsonObject): unknown[] =>
  Array.isArray(node.children) ? node.children : [];

/** 노드 아래의 글자를 모두 모은다. */
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
 * JSON 으로 읽히지 않으면 받은 문자열을 그대로 돌려준다. 편집기가 붙기 전에 다른 경로로 들어간
 * 평문이 있더라도 운영자가 화면에서 그것을 보고 고칠 수 있어야 한다.
 */
export function lexicalToText(content: string): string {
  let state: unknown;
  try {
    state = JSON.parse(content) as unknown;
  } catch {
    return content;
  }
  const root = isObject(state) && isObject(state.root) ? state.root : undefined;
  if (!root) {
    return content;
  }
  return childrenOf(root).map(collectText).join('\n').replace(/\n+$/, '');
}
