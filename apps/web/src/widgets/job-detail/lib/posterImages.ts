export interface PosterImage {
  src: string;
  alt: string;
}

const IMG_TAG = /<img\b[^>]*>/gi;
const attr = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1];

/** jsoup 이 속성값에 남기는 엔티티만 되돌린다. */
const decode = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/**
 * 원문 HTML(`sourceHtml`)의 이미지들. 상세 탭 위 포스터 줄(`ui/PosterStrip.tsx`)이 쓴다.
 *
 * `sourceHtml` 은 BE 가 jsoup 으로 다시 써서 저장한 값이라(`JobSourceHtmlSanitizer.kt`) 속성이 늘
 * 큰따옴표로 감싸져 있다 — 파서 없이 정규식으로 읽는다. 크롤러가 상대 주소를 절대 주소로 바꿔 보내므로
 * `http(s)` 가 아닌 주소는 버린다. 같은 주소는 한 번만 둔다.
 */
export function extractPosterImages(sourceHtml: string | undefined): PosterImage[] {
  if (!sourceHtml) {
    return [];
  }
  const seen = new Set<string>();
  const images: PosterImage[] = [];
  for (const [tag] of sourceHtml.matchAll(IMG_TAG)) {
    const src = decode(attr(tag, 'src') ?? '').trim();
    if (!/^https?:\/\//i.test(src) || seen.has(src)) {
      continue;
    }
    seen.add(src);
    images.push({ src, alt: decode(attr(tag, 'alt') ?? '').trim() });
  }
  return images;
}
