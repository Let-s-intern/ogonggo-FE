/**
 * 렛츠커리어 가이드북 `description`(Lexical 에디터 상태 JSON 문자열)에서 이미지 노드의 주소를 순서대로 뽑는다.
 * 마케팅팀이 올린 상세 이미지가 이 안에 들어 있다. 글자는 읽지 않는다 — 판매 화면은 이미지 줄만 보인다.
 *
 * 이미지는 문단이나 링크 안에 들어 있기도 해서 트리를 깊이 우선으로 훑는다. 읽지 못하거나 모양이 다르면 빈 목록이다.
 * 주소는 `http(s)` 만 받는다.
 */

export interface DescriptionImage {
  src: string;
  alt: string;
}

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function collect(node: unknown, found: DescriptionImage[]): void {
  if (!isObject(node)) {
    return;
  }
  if (node.type === 'image' && typeof node.src === 'string' && /^https?:\/\//.test(node.src)) {
    found.push({ src: node.src, alt: typeof node.altText === 'string' ? node.altText : '' });
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collect(child, found);
    }
  }
}

export function extractDescriptionImages(description: string | null): DescriptionImage[] {
  if (!description) {
    return [];
  }
  let state: unknown;
  try {
    state = JSON.parse(description);
  } catch {
    return [];
  }
  const found: DescriptionImage[] = [];
  collect(isObject(state) ? state.root : null, found);
  return found;
}
