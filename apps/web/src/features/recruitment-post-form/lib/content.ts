import type { JsonNode } from '@ogonggo/api';

/**
 * 모집 상세 내용(`content`) 의 평문 ↔ Lexical EditorState JSON 변환.
 *
 * 작성 칸은 Lexical 편집기(`ui/ContentEditor.tsx`)라 평소에는 JSON 을 그대로 다룬다. 여기는 두
 * 경우만 쓴다 — 칸이 채워졌는지 보려고 글자를 뽑을 때(`lexicalToText`), 그리고 읽어 온 본문을
 * 편집기가 읽지 못할 때 글자만 문단으로 옮길 때(`textToLexical`). 만드는 모양은 루트 · 문단 ·
 * 글자뿐이라 Lexical 을 임포트하지 않고 JSON 을 직접 만든다.
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

/** 한 줄이 문단 하나가 된다. 빈 줄은 글자 없는 문단이라 사이 간격으로 남는다. */
export function textToLexical(text: string): JsonNode {
  const paragraphs = text.split('\n').map((line) => ({
    type: 'paragraph',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    children: line
      ? [
          {
            type: 'text',
            version: 1,
            text: line,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
          },
        ]
      : [],
  }));

  return {
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: paragraphs,
    },
  };
}
