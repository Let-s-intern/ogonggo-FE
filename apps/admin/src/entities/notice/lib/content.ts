/**
 * 공지 본문(`content`) 의 평문 ↔ Lexical EditorState JSON 문자열 변환.
 *
 * 백엔드는 이 칸을 Lexical EditorState JSON 문자열로 받는다
 * (`ogonggo-BE` 의 `LexicalEditorStateValidator` — JSON 이 아니면 400 이다).
 * 어드민에는 편집기가 없다. `@lexical/react` 는 저장소에 설치돼 있지 않고, 읽기용 여섯
 * 패키지도 `apps/web` 에만 있다. 그래서 작성 칸은 `textarea` 한 칸으로 두고 저장 직전에
 * 여기서 JSON 을 만든다. 편집기 도입은 별도 작업이다
 * (`.claude/tasks/memos/결정-어드민-공지-본문-에디터-2026-09-23.md`).
 *
 * 만드는 모양은 `apps/web` 이 읽는 최소 집합(루트 · 문단 · 글자) 과 같다
 * (`apps/web/src/features/recruitment-post-form/lib/content.ts`). 두 앱이 서로를 가져다 쓸 수
 * 없어 같은 규칙을 각자 들고 있고, 한쪽을 고치면 다른 쪽도 고쳐야 한다.
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

/** 한 줄이 문단 하나가 된다. 빈 줄은 글자 없는 문단이라 사이 간격으로 남는다. */
export function textToLexical(text: string): string {
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

  return JSON.stringify({
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: paragraphs,
    },
  });
}
