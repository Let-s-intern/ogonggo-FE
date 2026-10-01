/**
 * 사진 시안·건물 시안의 배경 후보. 무료로 쓸 수 있는 이미지 검색은 국내 기업 사진이 거의 없어
 * (Wikimedia Commons·Openverse 로 동원·토스를 찾으면 0건이거나 엉뚱한 사진이다) 두 곳에서 모은다.
 *
 * - 공고 원문 페이지의 대표 이미지(og:image). 키가 없어도 된다. 회사가 채용 페이지에 건 그림이다.
 * - 카카오(다음) 이미지 검색. `KAKAO_REST_API_KEY` 가 있을 때만.
 * - 네이버 이미지 검색. `NAVER_CLIENT_ID`·`NAVER_CLIENT_SECRET` 이 있을 때만.
 *
 * 두 검색 모두 저작권은 원 게시자에게 있으니 쓰기 전에 사람이 확인한다. 건물 사진은 사실상 이
 * 검색에서만 나온다 — 키가 없으면 건물 시안은 사람이 사진을 올려야 완성된다.
 */

export interface ImageCandidate {
  url: string;
  /** 후보 아래 작은 글씨. */
  source: string;
  /** 시안에 자동으로 넣어도 되는 후보. 건물 시안은 건물 검색 결과만 그렇다. */
  auto?: boolean;
}

export interface ImageCandidates {
  photo: ImageCandidate[];
  building: ImageCandidate[];
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

interface NaverImageItem {
  link: string;
  sizewidth: string;
  sizeheight: string;
}

async function naverImages(query: string): Promise<ImageCandidate[]> {
  const id = process.env.NAVER_CLIENT_ID?.trim();
  const secret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    return [];
  }
  try {
    const params = new URLSearchParams({ query, display: '12', filter: 'large' });
    const response = await fetch(`https://openapi.naver.com/v1/search/image?${params}`, {
      headers: { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { items?: NaverImageItem[] };
    return (body.items ?? [])
      .filter((item) => Number(item.sizewidth) >= 800 && isPublicUrl(item.link))
      .map((item) => ({ url: item.link, source: `네이버 검색: ${query}`, auto: true }));
  } catch {
    return [];
  }
}

interface KakaoImageDocument {
  image_url: string;
  width: number;
  height: number;
  display_sitename: string;
}

async function kakaoImages(query: string): Promise<ImageCandidate[]> {
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) {
    return [];
  }
  try {
    const params = new URLSearchParams({ query, size: '15', sort: 'accuracy' });
    const response = await fetch(`https://dapi.kakao.com/v2/search/image?${params}`, {
      headers: { Authorization: `KakaoAK ${key}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { documents?: KakaoImageDocument[] };
    return (body.documents ?? [])
      .filter((item) => item.width >= 800 && isPublicUrl(item.image_url))
      .map((item) => ({
        url: item.image_url,
        source: `카카오 검색: ${query} (${item.display_sitename})`,
        auto: true,
      }));
  } catch {
    return [];
  }
}

async function searchImages(query: string): Promise<ImageCandidate[]> {
  const [kakao, naver] = await Promise.all([kakaoImages(query), naverImages(query)]);
  return [...kakao, ...naver];
}

export async function findImages(
  companyName: string,
  sourceUrl?: string,
): Promise<ImageCandidates> {
  const [og, photo, building] = await Promise.all([
    ogImage(sourceUrl),
    searchImages(companyName),
    searchImages(`${companyName} 사옥`),
  ]);
  return { photo: [...og, ...photo], building: [...building, ...og] };
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
