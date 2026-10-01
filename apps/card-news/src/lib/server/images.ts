import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * 썸네일 시안의 이미지 후보. 공고 원문 페이지의 대표 이미지(og:image)다 — 회사가 채용 페이지에 건
 * 그림이라 키 없이 받을 수 있다. 무료 이미지 검색(Wikimedia Commons·Openverse)은 국내 기업 사진이
 * 거의 없어 쓰지 않는다. 후보가 없으면 사람이 올린다.
 *
 * 서버가 바깥 주소를 받으러 가므로 내부망으로 새지 않게 막는다(`safeFetch`). 브라우저는 주소를
 * 넘기지 않고 공고 번호와 후보 순번만 넘긴다(`/api/images/proxy`).
 */

export interface ImageCandidate {
  url: string;
  /** 후보 아래 작은 글씨. */
  source: string;
  /** 이 앱 출처로 이미지를 받는 주소. 편집 화면은 `url` 대신 이것을 쓴다. */
  proxyPath: string;
}

export interface ImageCandidates {
  photo: ImageCandidate[];
}

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const MAX_REDIRECTS = 3;

/** 사설·루프백·링크 로컬·예약 대역. 클라우드 메타데이터(169.254.169.254)도 여기에 든다. */
function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped?.[1]) {
      return isPrivateAddress(mapped[1]);
    }
    return (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80')
    );
  }
  const [a = 0, b = 0] = address.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/** `http(s)` 이고, 호스트가 가리키는 모든 IP 가 공개 대역인 주소만. */
async function isPublicUrl(raw: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}

/**
 * 공개 주소만 받는 fetch. 리다이렉트는 따라가되 넘어갈 때마다 다시 검사한다 — 공개 주소가 내부
 * 주소로 돌려보내는 우회를 막는다.
 */
async function safeFetch(raw: string, timeoutMs: number): Promise<Response | null> {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!(await isPublicUrl(current))) {
      return null;
    }
    const response = await fetch(current, {
      headers: { 'User-Agent': BROWSER_UA },
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  return null;
}

async function ogImageUrls(pageUrl: string | undefined): Promise<string[]> {
  if (!pageUrl) {
    return [];
  }
  try {
    const response = await safeFetch(pageUrl, 8_000);
    if (!response?.ok) {
      return [];
    }
    const html = (await response.text()).slice(0, 300_000);
    const tags = html.match(
      /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/gi,
    );
    const urls = (tags ?? [])
      .map((tag) => /content=["']([^"']+)["']/i.exec(tag)?.[1])
      .filter((url): url is string => Boolean(url))
      .map((url) => new URL(url.replace(/&amp;/g, '&'), pageUrl).toString());
    return [...new Set(urls)];
  } catch {
    return [];
  }
}

export async function findImages(
  jobId: number,
  sourceUrl: string | undefined,
): Promise<ImageCandidates> {
  const urls = await ogImageUrls(sourceUrl);
  return {
    photo: urls.map((url, index) => ({
      url,
      source: '공고 원문 대표 이미지',
      proxyPath: `/api/images/proxy?jobId=${jobId}&index=${index}`,
    })),
  };
}

/**
 * 공고의 `index` 번째 후보 이미지를 받아 그대로 돌려준다. 브라우저가 다른 출처 이미지를 캔버스로
 * 줄이면 CORS 에 막혀서 이 앱이 대신 받는다. 주소는 공고 원문에서 다시 읽는다 — 브라우저가 준 주소로
 * 요청하지 않는다.
 */
export async function fetchCandidateImage(
  sourceUrl: string | undefined,
  index: number,
): Promise<{ type: string; bytes: ArrayBuffer } | null> {
  const url = (await ogImageUrls(sourceUrl))[index];
  if (!url) {
    return null;
  }
  try {
    const response = await safeFetch(url, 10_000);
    const type = response?.headers.get('content-type') ?? '';
    const length = Number(response?.headers.get('content-length') ?? 0);
    if (!response?.ok || !/^image\/(png|jpe?g|webp|gif)/.test(type) || length > 12_000_000) {
      return null;
    }
    return { type, bytes: await response.arrayBuffer() };
  } catch {
    return null;
  }
}
