'use client';

import type { ComponentProps } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@ogonggo/ui';
import { LINK_CLASS, LINK_REL, LinkPreviewCard } from './LinkPreviewCard';

/** mdast 중 이 파일이 읽는 부분만. */
interface MdNode {
  type: string;
  url?: string;
  value?: string;
  children?: MdNode[];
  position?: { start: { offset?: number }; end: { offset?: number } };
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

/** 이 줄이 주소 하나뿐이고, 그 주소를 `[글자](주소)` 가 아니라 주소 그대로(gfm 자동 링크) 썼으면 그 주소. */
function loneAutolink(line: MdNode[], source: string): string | null {
  const nodes = line.filter((node) => !(node.type === 'text' && !node.value?.trim()));
  const [link] = nodes;
  if (nodes.length !== 1 || !link || link.type !== 'link' || !link.url) return null;
  const start = link.position?.start.offset;
  const end = link.position?.end.offset;
  if (start === undefined || end === undefined) return null;
  return source.slice(start, end) === link.url ? link.url : null;
}

/**
 * 주소만 쓴 줄을 링크 카드로 표시한다. 글 속에 쓴 주소나 `[글자](주소)` 는 링크로 둔다.
 *
 * 줄바꿈 하나로 이어진 줄은 한 문단이라(`remark-breaks` 가 줄 사이에 `break` 를 둔다) 문단을 줄로 나눠 보고,
 * 카드가 될 줄이 있으면 그 앞뒤를 따로 문단으로 끊는다.
 */
function remarkLinkCards() {
  return (tree: MdNode, file: { value: unknown }) => {
    const source = String(file.value);
    const blocks: MdNode[] = [];
    for (const block of tree.children ?? []) {
      if (block.type !== 'paragraph') {
        blocks.push(block);
        continue;
      }
      const lines: MdNode[][] = [[]];
      for (const child of block.children ?? []) {
        if (child.type === 'break') lines.push([]);
        else lines[lines.length - 1]?.push(child);
      }
      let pending: MdNode[][] = [];
      const flush = () => {
        if (pending.length === 0) return;
        const children = pending.flatMap((line, index) =>
          index === 0 ? line : [{ type: 'break' }, ...line],
        );
        blocks.push({ type: 'paragraph', children });
        pending = [];
      };
      for (const line of lines) {
        const url = loneAutolink(line, source);
        if (url === null) {
          pending.push(line);
          continue;
        }
        flush();
        blocks.push({
          type: 'paragraph',
          children: line,
          data: { hName: 'div', hProperties: { dataLinkCard: url } },
        });
      }
      flush();
    }
    tree.children = blocks;
  };
}

const HEADING_CLASS = 'text-[15px] font-bold text-gray-900';

const COMPONENTS: Components = {
  div: ({ node: _node, ...props }) => {
    const url = (props as Record<string, unknown>)['data-link-card'];
    return typeof url === 'string' ? <LinkPreviewCard url={url} /> : <div {...props} />;
  },
  a: ({ node: _node, href, children }) => (
    <a href={href} target="_blank" rel={LINK_REL} className={LINK_CLASS}>
      {children}
    </a>
  ),
  h1: ({ node: _node, ...props }) => <p className={HEADING_CLASS} {...props} />,
  h2: ({ node: _node, ...props }) => <p className={HEADING_CLASS} {...props} />,
  h3: ({ node: _node, ...props }) => <p className={HEADING_CLASS} {...props} />,
  h4: ({ node: _node, ...props }) => <p className={HEADING_CLASS} {...props} />,
  h5: ({ node: _node, ...props }) => <p className={HEADING_CLASS} {...props} />,
  h6: ({ node: _node, ...props }) => <p className={HEADING_CLASS} {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="list-disc space-y-1 pl-5" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="border-l-2 border-gray-300 pl-3 text-gray-600" {...props} />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code className={cn('rounded bg-gray-100 px-1 py-0.5 text-[13px]', className)} {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      className="overflow-x-auto rounded-md bg-gray-100 p-3 text-[13px] [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  hr: () => <hr className="border-gray-200" />,
  table: ({ node: _node, ...props }) => (
    <div className="overflow-x-auto">
      <table
        className="text-left text-[13px] [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1"
        {...props}
      />
    </div>
  ),
};

/**
 * 사용자가 쓴 마크다운 글. 취준고민 답변(`ConcernCommentItem`)이 쓴다. 저장은 평범한 글자 그대로라 마크다운을
 * 모르고 쓴 예전 글도 똑같이 보인다 — 줄바꿈 하나도 줄바꿈으로 둔다(`remark-breaks`).
 *
 * - 원문 HTML 은 그리지 않는다(react-markdown 기본). `javascript:` 같은 주소도 기본 `urlTransform` 이 지운다.
 * - 이미지(`![](…)`)는 그리지 않는다. 답변에 남의 서버 이미지를 띄우지 않는다.
 * - 제목(`#`)은 답변 글자보다 조금 큰 굵은 글로 줄인다.
 * - 주소만 한 줄에 쓰면 링크 카드, 글 속 주소는 링크다(`remarkLinkCards`).
 */
export function MarkdownText({
  children,
  className,
}: {
  children: string;
  className?: ComponentProps<'div'>['className'];
}) {
  return (
    <div className={cn('space-y-2 break-words', className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkLinkCards]}
        components={COMPONENTS}
        disallowedElements={['img']}
      >
        {children}
      </Markdown>
    </div>
  );
}
