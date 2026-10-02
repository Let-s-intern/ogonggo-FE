'use client';

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
} from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  createEditor,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type LexicalEditor,
  type LexicalNode,
  type SerializedEditorState,
  type TextFormatType,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { LEXICAL_NODES, LEXICAL_THEME } from './lexicalConfig';
import { $createImageNode, $isImageNode } from './lexicalImageNode';

/**
 * 본문 편집기(Lexical). 저장되는 값은 EditorState JSON 그대로이고, 읽는 쪽이 같은 노드·클래스로
 * 그린다(`lexicalConfig.ts`). 웹의 모집글 본문과 어드민의 공지 본문이 함께 쓴다.
 *
 * 도구 막대는 굵게·기울임·밑줄·글머리 목록·번호 목록·링크, 그리고 `onUploadImage` 를 넘기면
 * 이미지. 제목·인용·코드 등은 마크다운으로 입력한다(`MARKDOWN_TRANSFORMERS`). 이미지는 고르는 즉시 그 함수로 올리고 돌려받은 `id`·`url` 을 이미지 노드에 담는다.
 * 업로드 API 는 앱마다 달라 이 패키지가 부르지 않는다 — 어드민에는 업로드 API 가 없어 버튼이 없다.
 */

const NAMESPACE = 'ogonggo-rich-text';

/** 이미지 업로드가 받는 형식. 백엔드가 그 밖의 형식은 400 으로 거절한다. */
const IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';

/**
 * 입력하는 마크다운을 곧바로 서식으로 바꾼다(`# `, `> `, `- `, `1. `, ```` ``` ````, `**굵게**` 등).
 * 링크(`[글](주소)`)는 뺀다 — 도구 막대의 링크와 달리 주소를 거르지 않아 `javascript:` 가 들어갈 수 있다.
 */
const MARKDOWN_TRANSFORMERS = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
];

const throwError = (error: Error) => {
  throw error;
};

/**
 * 읽어 온 본문을 편집기의 처음 상태로. Lexical 이 모르는 노드가 섞여 있으면 편집기가 통째로
 * 깨지므로, 미리 한 번 읽어 보고 실패하면 글자만 문단으로 옮긴다 — 화면은 살리고 글자는 잃지 않는다.
 */
function initialState(content: unknown): string | undefined {
  if (content === undefined || content === null || content === '') {
    return undefined;
  }
  const json = typeof content === 'string' ? content : JSON.stringify(content);
  try {
    createEditor({
      namespace: NAMESPACE,
      nodes: LEXICAL_NODES,
      onError: throwError,
    }).parseEditorState(json);
    return json;
  } catch {
    return plainTextState(json);
  }
}

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** 노드 아래의 글자를 모두 모은다. */
function collectText(node: unknown): string {
  if (!isObject(node)) {
    return '';
  }
  const own = typeof node.text === 'string' ? node.text : node.type === 'linebreak' ? '\n' : '';
  const children = Array.isArray(node.children) ? node.children : [];
  return own + children.map(collectText).join('');
}

/** 읽지 못한 본문의 글자만 문단으로 옮긴 상태. JSON 이 아니면 그 문자열을 글자로 쓴다. */
function plainTextState(json: string): string {
  let lines: string[];
  try {
    const parsed: unknown = JSON.parse(json);
    const root = isObject(parsed) && isObject(parsed.root) ? parsed.root : undefined;
    lines = root && Array.isArray(root.children) ? root.children.map(collectText) : [];
  } catch {
    lines = json.split('\n');
  }
  const paragraphs = lines.map((line) => ({
    type: 'paragraph',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    children: line
      ? [{ type: 'text', version: 1, text: line, format: 0, detail: 0, mode: 'normal', style: '' }]
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

function composerConfig(content: unknown, editable: boolean) {
  return {
    namespace: NAMESPACE,
    nodes: LEXICAL_NODES,
    theme: LEXICAL_THEME,
    editable,
    editorState: initialState(content),
    onError: throwError,
  };
}

export interface RichTextEditorProps {
  id: string;
  /**
   * 처음 상태. EditorState JSON 객체나 그 문자열. 편집기는 처음에 한 번만 읽는다 — 이후 값은
   * 편집기가 들고 있다. 다른 글로 바꾸려면 `key` 를 바꿔 새로 띄운다.
   */
  initialContent?: unknown;
  /** 본문이 바뀔 때마다. `text` 는 서식 없는 글자, `hasImage` 는 이미지가 하나라도 있는지. */
  onChange: (content: SerializedEditorState, text: string, hasImage: boolean) => void;
  placeholder: string;
  /** 이미지 한 장을 올리고 식별자와 주소를 돌려준다. 넘기지 않으면 이미지 버튼이 없다. */
  onUploadImage?: (file: File) => Promise<{ id: string; url: string } | undefined>;
}

export function RichTextEditor({
  id,
  initialContent,
  onChange,
  placeholder,
  onUploadImage,
}: RichTextEditorProps) {
  return (
    <LexicalComposer initialConfig={composerConfig(initialContent, true)}>
      <Toolbar onUploadImage={onUploadImage} />
      <div className="relative rounded-b-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id={id}
              className="min-h-48 px-3 py-2 text-sm text-gray-900 outline-none"
              aria-placeholder={placeholder}
              placeholder={
                <p className="pointer-events-none absolute top-2 left-3 text-sm text-gray-400">
                  {placeholder}
                </p>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin validateUrl={isHttpUrl} />
      <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(editorState: EditorState) => {
          const json = editorState.toJSON();
          // 읽기 구간 밖에서 알린다. 안에서 부르면 부모의 상태 갱신이 Lexical 읽기 중에 일어난다.
          const { text, hasImage } = editorState.read(() => {
            const root = $getRoot();
            return { text: root.getTextContent(), hasImage: $hasImage(root) };
          });
          onChange(json, text, hasImage);
        }}
      />
    </LexicalComposer>
  );
}

/**
 * 읽기 전용으로 그린다. 작성 화면의 미리보기가 쓴다 — 웹 상세 화면의 읽기(`lexicalHtml.ts`)는
 * 서버 전용이라 클라이언트 화면이 부를 수 없어, 같은 노드·클래스의 편집기를 편집 없이 띄운다.
 * `key` 로 내용이 바뀔 때마다 새로 띄운다(편집기는 처음 상태를 한 번만 읽는다).
 */
export function RichTextView({ content }: { content: unknown }) {
  return (
    <LexicalComposer key={JSON.stringify(content)} initialConfig={composerConfig(content, false)}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="text-sm text-gray-700 outline-none" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <LinkPlugin validateUrl={isHttpUrl} />
    </LexicalComposer>
  );
}

function $hasImage(node: LexicalNode): boolean {
  return $isImageNode(node) || ($isElementNode(node) && node.getChildren().some($hasImage));
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url);
}

interface ActiveState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list: 'bullet' | 'number' | null;
  link: boolean;
}

const INACTIVE: ActiveState = {
  bold: false,
  italic: false,
  underline: false,
  list: null,
  link: false,
};

/** 커서가 있는 자리의 서식. 도구 막대 버튼이 눌린 모양으로 보이는 근거다. */
function readActiveState(editor: LexicalEditor): ActiveState {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return INACTIVE;
    }
    const parents = selection.anchor.getNode().getParents();
    const list = parents.find($isListNode);
    const listType = list?.getListType();
    return {
      bold: selection.hasFormat('bold'),
      italic: selection.hasFormat('italic'),
      underline: selection.hasFormat('underline'),
      list: listType === 'bullet' || listType === 'number' ? listType : null,
      link: [selection.anchor.getNode(), ...parents].some($isLinkNode),
    };
  });
}

function Toolbar({ onUploadImage }: Pick<RichTextEditorProps, 'onUploadImage'>) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState<ActiveState>(INACTIVE);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => editor.registerUpdateListener(() => setActive(readActiveState(editor))),
    [editor],
  );

  const format = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);

  const toggleList = (type: 'bullet' | 'number') => {
    if (active.list === type) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(
        type === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined,
      );
    }
  };

  const toggleLink = () => {
    if (active.link) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    setError(null);
    setLinkOpen((open) => !open);
  };

  // 링크 칸은 바깥 모집글 폼 안에 있다. 엔터가 폼을 제출하지 않게 막는다.
  const applyLink = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!isHttpUrl(url)) {
      setError('http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.');
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    setLinkUrl('');
    setLinkOpen(false);
    setError(null);
  };

  const insertImage = async (file: File) => {
    if (!onUploadImage) {
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const asset = await onUploadImage(file);
      if (!asset) {
        throw new Error('empty upload response');
      }
      editor.update(() => {
        $insertNodes([$createImageNode(asset.id, asset.url, file.name)]);
      });
    } catch {
      setError('이미지를 올리지 못했습니다. 파일 형식과 크기를 확인해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const buttons: { label: string; icon: string; pressed: boolean; onClick: () => void }[] = [
    {
      label: '굵게',
      icon: 'icon-[lucide--bold]',
      pressed: active.bold,
      onClick: () => format('bold'),
    },
    {
      label: '기울임',
      icon: 'icon-[lucide--italic]',
      pressed: active.italic,
      onClick: () => format('italic'),
    },
    {
      label: '밑줄',
      icon: 'icon-[lucide--underline]',
      pressed: active.underline,
      onClick: () => format('underline'),
    },
    {
      label: '글머리 기호 목록',
      icon: 'icon-[lucide--list]',
      pressed: active.list === 'bullet',
      onClick: () => toggleList('bullet'),
    },
    {
      label: '번호 매기기 목록',
      icon: 'icon-[lucide--list-ordered]',
      pressed: active.list === 'number',
      onClick: () => toggleList('number'),
    },
    { label: '링크', icon: 'icon-[lucide--link]', pressed: active.link, onClick: toggleLink },
  ];

  return (
    <div className="rounded-t-md border border-b-0 border-gray-300">
      <div className="flex items-center gap-1 px-3 py-2">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            aria-label={button.label}
            aria-pressed={button.pressed}
            // 누르는 동안 편집기의 선택이 풀리지 않게 한다. 풀리면 서식이 걸릴 자리가 사라진다.
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.onClick}
            className={cn(
              'flex size-7 cursor-pointer items-center justify-center rounded transition-colors',
              button.pressed
                ? 'bg-blue-50 text-blue-500'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
          >
            <span aria-hidden="true" className={`${button.icon} block size-4`} />
          </button>
        ))}
        {onUploadImage ? (
          <>
            <button
              type="button"
              aria-label="이미지"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex size-7 cursor-pointer items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-wait disabled:text-gray-300"
            >
              <span aria-hidden="true" className="icon-[lucide--image] block size-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) {
                  void insertImage(file);
                }
              }}
            />
          </>
        ) : null}
        {uploading ? (
          <span className="ml-2 text-xs text-gray-500">이미지를 올리는 중이에요.</span>
        ) : null}
      </div>
      {linkOpen ? (
        <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyLink(event);
              }
            }}
            placeholder="https://"
            aria-label="링크 주소"
            className="h-8 flex-1 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-8 cursor-pointer rounded bg-blue-500 px-3 text-sm text-white hover:bg-blue-600"
          >
            적용
          </button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="border-t border-gray-100 px-3 py-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
