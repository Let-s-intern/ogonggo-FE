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

/** 이미지 노드를 뺀 노드. 아래에 이미지가 있으면 `removed` 를 켠다. */
function withoutImages(node: unknown, removed: { value: boolean }): unknown {
  if (!isObject(node) || !Array.isArray(node.children)) {
    return node;
  }
  const children = node.children.flatMap((child: unknown) => {
    if (isObject(child) && child.type === 'image') {
      removed.value = true;
      return [];
    }
    return [withoutImages(child, removed)];
  });
  return { ...node, children };
}

/**
 * 본문에서 이미지 노드를 지운다. 예전 글은 편집기 사진 버튼으로 본문에 사진을 넣었는데, 백엔드가 이제
 * 본문 이미지 노드를 400 으로 거절한다. 그대로 두면 그 글을 고쳐 저장할 수 없다.
 *
 * 지운 사진을 첨부로 옮기지는 않는다 — 이미 글에 붙은 이미지라 `imageIds` 로 보내도 백엔드가 받지
 * 않는다(`IMAGE_ASSET_NOT_AVAILABLE`). 지웠는지(`removed`)를 돌려줘 폼이 다시 첨부하라고 알린다.
 *
 * 문자열로 온 EditorState 도 받는다(`lexicalToText` 와 같은 이유). 읽지 못하면 그대로 돌려준다.
 */
export function stripContentImages(content: unknown): { content: unknown; removed: boolean } {
  let state: unknown = content;
  if (typeof content === 'string') {
    try {
      state = JSON.parse(content) as unknown;
    } catch {
      return { content, removed: false };
    }
  }
  if (!isObject(state) || !isObject(state.root)) {
    return { content, removed: false };
  }
  const removed = { value: false };
  const root = withoutImages(state.root, removed);
  return removed.value
    ? { content: { ...state, root }, removed: true }
    : { content, removed: false };
}
