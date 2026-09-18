import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { createHeadlessEditor } from '@lexical/headless';
import { withDOM } from '@lexical/headless/dom';
import { $generateHtmlFromNodes } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import type { EditorThemeClasses, SerializedEditorState } from 'lexical';

/**
 * Lexical EditorState JSON 을 읽기 전용 HTML 로 바꾼다. 모집글 본문(`RecruitmentPostDetailResponse
 * ['content']`) 이 이 형식이다.
 *
 * 방식은 Lexical 공식 문서가 서버용으로 안내하는 것 그대로다 — `@lexical/headless` 의
 * `createHeadlessEditor` 로 편집 화면 없이 상태만 읽고(`parseEditorState`), `@lexical/html` 의
 * `$generateHtmlFromNodes` 로 HTML 을 만든다. 이 함수는 DOM 이 필요해서 `@lexical/headless/dom`
 * 의 `withDOM`(happy-dom) 안에서 부른다. 전부 동기라 서버 컴포넌트에서 그대로 부를 수 있고,
 * 브라우저로 보내는 것은 결과 HTML 뿐이다(Lexical·happy-dom 이 클라이언트 번들에 들어가지 않는다).
 * 그래서 이 파일은 서버 컴포넌트에서만 가져온다.
 *
 * 그리는 노드는 문단·제목·목록·인용·링크·코드와 줄바꿈·탭이다. 그 밖의 노드는 Lexical 이
 * 파싱하다 던지므로 미리 바꿔 둔다(`replaceUnknownNodes`) — 글자를 가진 노드는 글자로 남기고,
 * 글자가 없는 노드(이미지 등) 는 뺀다. 그래도 파싱이 실패하면 글자만 모은 문단을 돌려준다.
 */

const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
];

/** `lexical` 이 기본으로 아는 노드와 위에서 등록한 노드. */
const KNOWN_TYPES = new Set([
  'root',
  'paragraph',
  'text',
  'linebreak',
  'tab',
  ...NODES.map((node) => node.getType()),
]);

/**
 * 노드별 클래스. 상세 본문 섹션의 글자(`text-sm text-gray-700`) 를 바탕에 두고 서식이 드러날
 * 만큼만 준다. 제목은 섹션 제목(`text-lg`) 보다 작게 둔다.
 */
const THEME: EditorThemeClasses = {
  paragraph: 'my-2',
  heading: {
    h1: 'mt-4 mb-2 text-base font-bold text-gray-900',
    h2: 'mt-4 mb-2 text-base font-bold text-gray-900',
    h3: 'mt-3 mb-1 font-bold text-gray-900',
    h4: 'mt-3 mb-1 font-bold text-gray-900',
    h5: 'mt-3 mb-1 font-bold text-gray-900',
    h6: 'mt-3 mb-1 font-bold text-gray-900',
  },
  list: {
    ul: 'my-2 list-disc pl-5',
    ol: 'my-2 list-decimal pl-5',
    nested: { listitem: 'list-none' },
  },
  quote: 'my-2 border-l-4 border-gray-200 pl-3 text-gray-600',
  link: 'text-blue-600 underline',
  code: 'my-2 block overflow-x-auto whitespace-pre rounded-md bg-gray-50 p-3 font-mono text-xs',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
    code: 'rounded bg-gray-100 px-1 font-mono text-xs',
  },
};

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const childrenOf = (node: JsonObject): unknown[] =>
  Array.isArray(node.children) ? node.children : [];

/** 노드 아래의 글자를 모두 모은다. 모르는 노드를 글자로 떨어뜨릴 때와 마지막 대체 경로가 쓴다. */
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

const textNode = (value: string): JsonObject => ({
  type: 'text',
  version: 1,
  text: value,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
});

const paragraphNode = (children: JsonObject[]): JsonObject => ({
  type: 'paragraph',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  children,
});

/**
 * 모르는 노드를 바꾸고, 인라인 CSS(`style`, `textStyle`) 는 비운다. 인라인 CSS 는 공개 화면에서
 * 작성자가 페이지를 덮는 요소(`position: fixed` 등) 를 만들 수 있는 유일한 통로라 받지 않는다.
 *
 * 모르는 노드가 루트 바로 아래(블록 자리) 면 글자를 담은 문단으로, 그 밖(인라인 자리) 이면 글자
 * 노드로 바꾼다. 글자가 없으면 뺀다.
 */
function replaceUnknownNodes(node: unknown, isBlockPosition: boolean): JsonObject[] {
  if (!isObject(node)) {
    return [];
  }
  if (typeof node.type !== 'string' || !KNOWN_TYPES.has(node.type)) {
    const value = collectText(node);
    if (!value) {
      return [];
    }
    return [isBlockPosition ? paragraphNode([textNode(value)]) : textNode(value)];
  }

  const cleaned: JsonObject = { ...node };
  if ('style' in cleaned) {
    cleaned.style = '';
  }
  if ('textStyle' in cleaned) {
    cleaned.textStyle = '';
  }
  if (Array.isArray(node.children)) {
    const childIsBlock = node.type === 'root';
    cleaned.children = node.children.flatMap((child) => replaceUnknownNodes(child, childIsBlock));
  }
  return [cleaned];
}

/** 문자열로 온 EditorState 도 받는다. JSON 이 아니면 `undefined`. */
function parseState(content: unknown): unknown {
  if (typeof content !== 'string') {
    return content;
  }
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return undefined;
  }
}

export type LexicalRenderResult =
  | { kind: 'html'; html: string }
  | { kind: 'text'; paragraphs: string[] };

/**
 * EditorState JSON(객체 또는 문자열) 을 HTML 로. 형식이 깨졌거나 Lexical 이 읽지 못하면 루트
 * 아래 블록마다 글자만 모은 문단 목록을 돌려준다 — 화면은 그대로 두고 본문 글자는 잃지 않는다.
 */
export function renderLexicalContent(content: unknown): LexicalRenderResult {
  const state = parseState(content);
  if (state === undefined && typeof content === 'string') {
    return { kind: 'text', paragraphs: [content] };
  }

  const root = isObject(state) && isObject(state.root) ? state.root : undefined;
  if (!root) {
    return { kind: 'text', paragraphs: [] };
  }

  try {
    const [cleanedRoot] = replaceUnknownNodes(root, false);
    const editor = createHeadlessEditor({
      namespace: 'recruitment-post-content',
      nodes: NODES,
      theme: THEME,
      editable: false,
      onError: (error) => {
        throw error;
      },
    });
    // 형식은 위에서 노드 종류만 맞췄다. 필드가 어긋나면 `parseEditorState` 가 던지고 아래로 떨어진다.
    const serialized = { root: cleanedRoot } as unknown as SerializedEditorState;
    editor.setEditorState(editor.parseEditorState(serialized));
    const html = withDOM(() => editor.read(() => $generateHtmlFromNodes(editor, null)));
    return { kind: 'html', html };
  } catch (error) {
    console.error('[lexical] 본문을 HTML 로 바꾸지 못해 글자만 그립니다.', error);
    return {
      kind: 'text',
      paragraphs: childrenOf(root)
        .map(collectText)
        .filter((value) => value.trim().length > 0),
    };
  }
}

/** 본문에 보일 글자가 하나라도 있는지. 빈 본문이면 섹션을 제목째 뺀다. */
export function hasLexicalText(content: unknown): boolean {
  const state = parseState(content);
  if (state === undefined && typeof content === 'string') {
    return content.trim().length > 0;
  }
  return isObject(state) && collectText(state.root).trim().length > 0;
}
