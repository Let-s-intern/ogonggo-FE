import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import type { JSX } from 'react';

/**
 * 본문 이미지. 백엔드가 저장할 때 본문 JSON 에서 `type: "image"` 노드의 `imageId`·`src` 를 찾아
 * 올린 이미지(`POST /api/v1/images`)를 글에 연결한다(ogonggo-BE `ImageAssetManager.syncPostImages`).
 * 그래서 JSON 의 이름과 칸은 그 모양 그대로다 — `src` 가 업로드 응답의 `url` 과 다르면 저장이
 * 거절된다.
 *
 * 편집기(`RichTextEditor.tsx`)와 웹 상세 화면의 읽기(`apps/web/src/shared/lib/lexicalHtml.ts`)가
 * 같은 노드를 쓴다. 읽기는 서버에서 `exportDOM` 으로 `<img>` 를 만들고, 편집기는 `decorate` 로 그린다.
 *
 * 주소는 `http(s)` 만 받는다. 본문은 작성자가 보낸 JSON 이라 `javascript:` 같은 주소가 올 수 있다.
 */

export type SerializedImageNode = Spread<
  { imageId: string; src: string; altText: string },
  SerializedLexicalNode
>;

const IMAGE_CLASS = 'my-3 block h-auto max-w-full rounded-md';

const safeSrc = (src: string) => (/^https?:\/\//i.test(src) ? src : '');

export class ImageNode extends DecoratorNode<JSX.Element | null> {
  __imageId: string;
  __src: string;
  __altText: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__imageId, node.__src, node.__altText, node.__key);
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return $createImageNode(serialized.imageId, serialized.src, serialized.altText ?? '');
  }

  constructor(imageId: string, src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__imageId = imageId;
    this.__src = safeSrc(src);
    this.__altText = altText;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: 'image',
      version: 1,
      imageId: this.__imageId,
      src: this.__src,
      altText: this.__altText,
    };
  }

  exportDOM(): DOMExportOutput {
    // 걸러져 주소가 빈 이미지는 그리지 않는다. 빈 `<img>` 는 깨진 이미지로 보인다.
    if (!this.__src) {
      return { element: null };
    }
    const img = document.createElement('img');
    img.setAttribute('src', this.__src);
    img.setAttribute('alt', this.__altText);
    img.setAttribute('loading', 'lazy');
    img.className = IMAGE_CLASS;
    return { element: img };
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element | null {
    if (!this.__src) {
      return null;
    }
    return <img src={this.__src} alt={this.__altText} className={IMAGE_CLASS} />;
  }
}

export function $createImageNode(imageId: string, src: string, altText = ''): ImageNode {
  return $applyNodeReplacement(new ImageNode(imageId, src, altText));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
