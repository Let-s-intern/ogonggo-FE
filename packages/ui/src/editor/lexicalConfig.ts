import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import type { EditorThemeClasses } from 'lexical';
import { ImageNode } from './lexicalImageNode';

/**
 * 본문(Lexical)의 노드와 서식 클래스. 웹 상세 화면의 읽기(`apps/web/src/shared/lib/lexicalHtml.ts`,
 * 서버)와 편집기·미리보기(`RichTextEditor.tsx`, 클라이언트)가 함께 쓴다 — 같은 노드를 알아야 쓴
 * 것이 그대로 읽히고, 같은 클래스여야 작성 중에 본 모양이 상세와 같다.
 *
 * 이 파일은 `@lexical/headless`·happy-dom 을 가져오지 않는다. 그래서 클라이언트에서도 쓸 수 있다.
 */
export const LEXICAL_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  ImageNode,
];

/**
 * 노드별 클래스. 상세 본문 섹션의 글자(`text-sm text-gray-700`) 를 바탕에 두고 서식이 드러날
 * 만큼만 준다. 제목은 섹션 제목(`text-lg`) 보다 작게 둔다.
 */
export const LEXICAL_THEME: EditorThemeClasses = {
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
