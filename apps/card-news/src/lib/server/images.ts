/**
 * 썸네일 시안의 이미지 후보. 공고 원문 페이지의 대표 이미지(og:image)다 — 회사가 채용 페이지에 건
 * 그림이라 키 없이 받을 수 있다. 무료 이미지 검색(Wikimedia Commons·Openverse)은 국내 기업 사진이
 * 거의 없어 쓰지 않는다. 후보가 없으면 사람이 올린다.
 */

export interface ImageCandidate {
  url: string;
  /** 후보 아래 작은 글씨. */
  source: string;
}

export interface ImageCandidates {
  photo: ImageCandidate[];
}

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

/** `http(s)` 이고 사설·로컬 주소가 아닌 URL 만. 이 앱은 로그인이 없어 프록시가 아무 데나 가면 안 된다. */
export function isPublicUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }
  const host = url.hostname;
  return !(
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(':')
  );
}

async function ogImage(pageUrl: string | undefined): Promise<ImageCandidate[]> {
  if (!pageUrl || !isPublicUrl(pageUrl)) {
    return [];
  }
  try {
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(8_000),
    });
    const html = (await response.text()).slice(0, 300_000);
    const tags = html.match(
      /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/gi,
    );
    const urls = (tags ?? [])
      .map((tag) => /content=["']([^"']+)["']/i.exec(tag)?.[1])
      .filter((url): url is string => Boolean(url))
      .map((url) => new URL(url.replace(/&amp;/g, '&'), pageUrl).toString());
    return [...new Set(urls)].map((url) => ({ url, source: '공고 원문 대표 이미지' }));
  } catch {
    return [];
  }
}

export async function findImages(sourceUrl?: string): Promise<ImageCandidates> {
  return { photo: await ogImage(sourceUrl) };
}

/** 이미지를 받아 그대로 돌려준다. 브라우저가 다른 출처 이미지를 캔버스로 줄이면 CORS 에 막혀서다. */
export async function fetchImage(
  url: string,
): Promise<{ type: string; bytes: ArrayBuffer } | null> {
  if (!isPublicUrl(url)) {
    return null;
  }
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(10_000),
    });
    const type = response.headers.get('content-type') ?? '';
    const length = Number(response.headers.get('content-length') ?? 0);
    if (!response.ok || !/^image\/(png|jpe?g|webp|gif)/.test(type) || length > 12_000_000) {
      return null;
    }
    return { type, bytes: await response.arrayBuffer() };
  } catch {
    return null;
  }
}
