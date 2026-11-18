import { lookup, type LookupAddress } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import type { LinkPreview } from '@/shared/api/linkPreview';

/**
 * 취준고민 답변의 링크 카드(`shared/ui/LinkPreviewCard.tsx`). `?url=` 페이지의 `og:title`·`og:description`·
 * `og:image` 를 읽어 돌려준다. 브라우저가 남의 페이지를 직접 읽으면 CORS 에 막혀서 서버가 대신 읽는다.
 *
 * 누구나 아무 주소나 넘길 수 있으므로 서버가 내부망을 대신 부르지 않게 막는다.
 * - http·https 만, 기본 포트(80·443)만 읽는다.
 * - 호스트를 DNS 로 풀어 사설·루프백·링크로컬 등 공인이 아닌 주소가 하나라도 나오면 연결하지 않는다.
 * - 리다이렉트는 직접 따라가며 매번 같은 검사를 한다(최대 3번).
 * - 4초 안에 끝나지 않거나 HTML 이 아니면 그만두고, `og:image` 가 나올 때까지(많아야 2MB)만 읽는다.
 *
 * 결과는 CDN 에 하루 캐시한다. 읽지 못하면 빈 미리보기(`{ url }`)를 주고, 카드는 그때 평범한 링크로 그린다.
 *
 * `/api/**` 는 백엔드로 넘어가는 rewrite 가 있어(`next.config.ts`) 이 경로는 그 밖에 둔다.
 */

const TIMEOUT_MS = 4000;
// 유튜브 영상 페이지는 `og:title` 이 800KB 쯤에 있다.
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

function isPublicIPv4(ip: string): boolean {
  const [a = 0, b = 0] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a === 169 && b === 254) return false; // 링크로컬, 클라우드 메타데이터
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a >= 224) return false; // 멀티캐스트·예약
  return true;
}

function isPublicIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPublicIPv4(ip);
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPublicIPv4(mapped[1]);
  if (lower === '::' || lower === '::1') return false;
  if (/^f[cd]/.test(lower)) return false; // ULA
  if (/^fe[89ab]/.test(lower)) return false; // 링크로컬
  if (lower.startsWith('ff')) return false; // 멀티캐스트
  return true;
}

/** 기본 포트의 http·https 이고 계정 정보가 없는 주소. 호스트가 IP 면 공인 IP 인지도 여기서 본다. */
function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (url.port && url.port !== '80' && url.port !== '443') return false;
  if (url.username || url.password) return false;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  return isIP(host) ? isPublicIP(host) : true;
}

/**
 * 연결할 때 쓰는 DNS 조회. 풀린 주소가 하나라도 공인이 아니면 연결하지 않는다. 검사한 주소로 바로 연결하므로
 * 검사와 연결 사이에 DNS 답이 바뀌어도(DNS rebinding) 내부망으로 가지 않는다.
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return callback(error, '', 0);
    if (addresses.length === 0 || !addresses.every((address) => isPublicIP(address.address))) {
      return callback(new Error('blocked address'), '', 0);
    }
    if (options.all) return (callback as (e: null, a: LookupAddress[]) => void)(null, addresses);
    const [first] = addresses;
    return callback(null, first?.address ?? '', first?.family ?? 4);
  });
};

interface RawResponse {
  status: number;
  location?: string;
  contentType: string;
  body: string;
}

function charsetOf(contentType: string): string {
  const charset = contentType.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase() ?? 'utf-8';
  try {
    new TextDecoder(charset);
    return charset;
  } catch {
    return 'utf-8';
  }
}

/**
 * 한 번 요청한다. Next 가 감싼 `fetch` 는 개발 서버에서 큰 응답의 본문 읽기를 끝까지 붙잡아(GitHub 메인
 * 20초) `node:http` 를 직접 쓴다. HTML 이 아니면 본문을 읽지 않는다.
 *
 * `</head>` 에서 멈추면 안 된다. Next 16 은 봇이 아닌 요청에 메타데이터를 `</head>` 뒤 본문으로 흘려
 * 보낸다(오공고 공고 상세는 `</head>` 가 2KB, `og:title` 이 70KB 쯤). `og:image` 가 든 조각을 받으면 태그가
 * 조각 경계에서 잘렸을 수 있어 한 조각을 더 받고 끊는다. 끝내 없으면 끝까지(많아야 2MB) 읽는다.
 */
function requestOnce(url: URL, signal: AbortSignal): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const request = client.get(
      url,
      {
        signal,
        lookup: publicOnlyLookup,
        headers: { 'user-agent': 'ogonggo-link-preview', accept: 'text/html' },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const contentType = response.headers['content-type'] ?? '';
        const result = { status, location: response.headers.location, contentType };
        if (status !== 200 || !contentType.includes('text/html')) {
          response.destroy();
          return resolve({ ...result, body: '' });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        let sawImage = false;
        const finish = () => {
          const body = new TextDecoder(charsetOf(contentType)).decode(
            Buffer.concat(chunks).subarray(0, MAX_BYTES),
          );
          resolve({ ...result, body });
        };
        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          size += chunk.byteLength;
          if (size >= MAX_BYTES || sawImage) {
            response.destroy();
            finish();
            return;
          }
          sawImage = chunk.includes('og:image');
        });
        response.on('end', finish);
        response.on('error', reject);
      },
    );
    request.on('error', reject);
  });
}

async function fetchHtml(start: URL): Promise<{ html: string; finalUrl: URL } | null> {
  let url = start;
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isAllowedUrl(url)) return null;
    const response = await requestOnce(url, signal);
    if (response.status >= 300 && response.status < 400) {
      if (!response.location) return null;
      url = new URL(response.location, url);
      continue;
    }
    if (!response.body) return null;
    return { html: response.body, finalUrl: url };
  }
  return null;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const point =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(point) ? String.fromCodePoint(point) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/** `<meta property|name="…" content="…">` 를 속성 순서와 따옴표 종류에 상관없이 읽는다. */
function readMetaTags(html: string): Map<string, string> {
  const metas = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>();
    for (const [, name, , value] of tag.matchAll(/([a-z:-]+)\s*=\s*(["'])(.*?)\2/gi)) {
      if (name && value !== undefined) attributes.set(name.toLowerCase(), value);
    }
    const key = (attributes.get('property') ?? attributes.get('name'))?.toLowerCase();
    const content = attributes.get('content');
    if (key && content && !metas.has(key)) metas.set(key, decodeEntities(content).trim());
  }
  return metas;
}

function parsePreview(url: string, html: string, finalUrl: URL): LinkPreview {
  const metas = readMetaTags(html);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const pick = (...keys: string[]) => keys.map((key) => metas.get(key)).find(Boolean);

  let image = pick('og:image', 'og:image:url', 'twitter:image');
  try {
    // 이미지는 https 만 쓴다. 상대 주소는 읽은 페이지 기준으로 푼다.
    image = image ? new URL(image, finalUrl).toString() : undefined;
    if (image && !image.startsWith('https://')) image = undefined;
  } catch {
    image = undefined;
  }

  return {
    url,
    title:
      pick('og:title', 'twitter:title') ?? (titleTag ? decodeEntities(titleTag).trim() : undefined),
    description: pick('og:description', 'twitter:description', 'description'),
    image,
    siteName: pick('og:site_name') ?? finalUrl.hostname.replace(/^www\./, ''),
  };
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('url') ?? '';
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return Response.json({ url: raw } satisfies LinkPreview, { status: 400 });
  }

  let preview: LinkPreview = { url: raw };
  try {
    const page = await fetchHtml(target);
    if (page) preview = parsePreview(raw, page.html, page.finalUrl);
  } catch {
    // 시간 초과·연결 실패는 빈 미리보기로 둔다.
  }
  return Response.json(preview, { headers: { 'cache-control': CACHE_CONTROL } });
}
