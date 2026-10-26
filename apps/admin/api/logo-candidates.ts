/**
 * 공고 원문 주소의 사이트에서 로고로 쓸 만한 아이콘을 모아 큰 순서로 돌려주는 서버리스 함수. 어드민 배포본의
 * `POST /logo-api/candidates` 가 `vercel.json` 의 rewrite 로 여기에 들어온다. 공고 편집의 `로고 추천` 이 쓴다.
 *
 * 브라우저가 남의 사이트 HTML 을 직접 읽지 못해서(CORS) 이 함수가 대신 읽는다. 후보는 `<link rel="icon">`·
 * `apple-touch-icon`·웹 앱 매니페스트의 icons·`og:image`, 그리고 선언이 없어도 흔히 있는 `/favicon.ico`·
 * `/apple-touch-icon.png` 다. 선언된 `sizes` 는 믿지 않고 실제 파일을 받아 크기를 잰다.
 * 로컬 어드민은 `vite.config.ts` 의 미들웨어가 이 파일의 `findLogoCandidates` 를 그대로 부른다.
 *
 * 받은 주소를 서버가 대신 여는 함수라 셋을 막는다.
 * - 호출자: 어드민 토큰이 아니면 돌려보낸다(`redash-query.ts` 의 `isAdmin`).
 * - 대상: http(s) 기본 포트만, 사설·루프백·링크 로컬 주소로 풀리는 호스트는 열지 않는다. 리다이렉트도 한
 *   번씩 다시 본다.
 * - 크기: 요청마다 시간과 읽는 바이트를 자른다.
 *
 * 원문이 채용 플랫폼이면 추천하지 않는다. 그 사이트의 아이콘은 회사가 아니라 플랫폼의 로고다.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isAdmin } from './redash-query.js';

/**
 * 채용 플랫폼 도메인. 이 도메인이나 그 하위 도메인이면 추천하지 않는다. 회사별 하위 도메인에 회사 아이콘을
 * 다는 채용 페이지 빌더(그리팅·나인하이어 등)는 넣지 않는다.
 */
const JOB_PLATFORM_DOMAINS = [
  'wanted.co.kr',
  'saramin.co.kr',
  'jobkorea.co.kr',
  'work24.go.kr',
  'work.go.kr',
  'incruit.com',
  'jobplanet.co.kr',
  'catch.co.kr',
  'linkedin.com',
  'rocketpunch.com',
  'albamon.com',
  'alba.co.kr',
  'career.programmers.co.kr',
  'rememberapp.co.kr',
  'jasoseol.com',
  'linkareer.com',
  'superookie.com',
  'peoplenjob.com',
  'indeed.com',
  'zighang.com',
  'ogonggo.co.kr',
  'letscareer.co.kr',
];

const PAGE_TIMEOUT_MS = 6_000;
const IMAGE_TIMEOUT_MS = 5_000;
const MAX_PAGE_BYTES = 1_000_000;
const MAX_MANIFEST_BYTES = 100_000;
const MAX_IMAGE_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
/** 크기를 재는 후보 수. 선언이 많은 사이트도 이만큼만 받는다. */
const MAX_CANDIDATES = 12;

/** 아이콘을 브라우저처럼 달라고 해야 주는 사이트가 있다. */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

export type LogoSource = 'icon' | 'apple-touch-icon' | 'manifest' | 'og:image' | 'favicon.ico';

export interface LogoCandidate {
  url: string;
  /** SVG 는 크기가 없다(벡터). */
  width: number | null;
  height: number | null;
  format: 'png' | 'jpeg' | 'gif' | 'webp' | 'ico' | 'svg';
  source: LogoSource;
}

export interface LogoCandidatesResult {
  candidates: LogoCandidate[];
}

export class LogoFailure extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'LogoFailure';
    this.status = status;
    this.code = code;
  }
}

/** `{ url }` 에서 주소만 꺼낸다. 맞지 않으면 `null`. */
export function parseLogoCandidatesInput(raw: unknown): { url: string } | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { url } = raw as Record<string, unknown>;
  return typeof url === 'string' && url.trim() !== '' ? { url: url.trim() } : null;
}

function isJobPlatform(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return JOB_PLATFORM_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isPrivateIPv4(address: string): boolean {
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

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    return isPrivateIPv4(address);
  }
  const lower = address.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) {
    return isPrivateIPv4(mapped[1]);
  }
  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb') ||
    lower.startsWith('ff')
  );
}

/** 열어도 되는 주소인지 본다. 안 되면 `LogoFailure`. */
async function assertPublicUrl(url: URL): Promise<void> {
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.port !== '' || url.username) {
    throw new LogoFailure(400, 'BLOCKED_URL', '열 수 없는 주소입니다.');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  } catch {
    throw new LogoFailure(502, 'PAGE_UNREACHABLE', '사이트 주소를 찾지 못했습니다.');
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new LogoFailure(400, 'BLOCKED_URL', '열 수 없는 주소입니다.');
  }
}

/** 본문을 `maxBytes` 까지만 읽는다. 넘으면 `null`. */
async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes || !response.body) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * 리다이렉트를 한 번씩 확인하며 연다. 성공하면 최종 주소와 본문, 아니면 `null`.
 * 주소 확인에서 막히면 `LogoFailure` 를 그대로 던진다.
 */
async function safeFetch(
  start: URL,
  maxBytes: number,
  timeoutMs: number,
): Promise<{ url: URL; bytes: Uint8Array; contentType: string } | null> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicUrl(url);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': USER_AGENT, accept: '*/*' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return null;
    }
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    try {
      const bytes = await readLimited(response, maxBytes);
      return bytes ? { url, bytes, contentType: response.headers.get('content-type') ?? '' } : null;
    } catch {
      return null;
    }
  }
  return null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** 태그 하나의 속성을 소문자 이름으로 모은다. */
function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([^\s=<>/"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[(match[1] ?? '').toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

interface Declared {
  url: URL;
  source: LogoSource;
}

function resolve(href: string | undefined, base: URL): URL | null {
  if (!href || href.startsWith('data:')) {
    return null;
  }
  try {
    const url = new URL(href, base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** HTML 의 `<link>`·`<meta>` 에서 아이콘 선언과 매니페스트 주소를 꺼낸다. */
function declaredInHtml(html: string, pageUrl: URL): { icons: Declared[]; manifest: URL | null } {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd === -1 ? html : html.slice(0, headEnd);
  const baseHref = head.match(/<base\b[^>]*>/i);
  const base = (baseHref && resolve(attributes(baseHref[0]).href, pageUrl)) || pageUrl;
  const icons: Declared[] = [];
  let manifest: URL | null = null;

  for (const [tag] of head.matchAll(/<(?:link|meta)\b[^>]*>/gi)) {
    const attrs = attributes(tag);
    const rel = (attrs.rel ?? '').toLowerCase().split(/\s+/);
    if (tag.slice(1, 5).toLowerCase() === 'link') {
      // `mask-icon` 은 한 가지 색으로 칠할 윤곽이라 로고로 쓸 수 없다.
      const source: LogoSource | null = rel.some((r) => r.startsWith('apple-touch-icon'))
        ? 'apple-touch-icon'
        : rel.includes('icon')
          ? 'icon'
          : null;
      const url = resolve(attrs.href, base);
      if (source && url) {
        icons.push({ url, source });
      } else if (rel.includes('manifest') && url) {
        manifest = url;
      }
      continue;
    }
    const property = (attrs.property ?? attrs.name ?? '').toLowerCase();
    if (
      property === 'og:image' ||
      property === 'og:image:url' ||
      property === 'og:image:secure_url'
    ) {
      const url = resolve(attrs.content, base);
      if (url) {
        icons.push({ url, source: 'og:image' });
      }
    }
  }
  return { icons, manifest };
}

async function declaredInManifest(manifestUrl: URL): Promise<Declared[]> {
  const fetched = await safeFetch(manifestUrl, MAX_MANIFEST_BYTES, IMAGE_TIMEOUT_MS).catch(
    () => null,
  );
  if (!fetched) {
    return [];
  }
  try {
    const manifest = JSON.parse(new TextDecoder().decode(fetched.bytes)) as { icons?: unknown };
    if (!Array.isArray(manifest.icons)) {
      return [];
    }
    return manifest.icons.flatMap((icon: unknown) => {
      const src = (icon as { src?: unknown } | null)?.src;
      const url = typeof src === 'string' ? resolve(src, fetched.url) : null;
      return url ? [{ url, source: 'manifest' as const }] : [];
    });
  } catch {
    return [];
  }
}

type Measured = Pick<LogoCandidate, 'width' | 'height' | 'format'>;

function pngSize(bytes: Uint8Array, view: DataView, at = 0): Measured | null {
  const signature = [0x89, 0x50, 0x4e, 0x47];
  if (bytes.length < at + 24 || signature.some((b, i) => bytes[at + i] !== b)) {
    return null;
  }
  return { width: view.getUint32(at + 16), height: view.getUint32(at + 20), format: 'png' };
}

function icoSize(bytes: Uint8Array, view: DataView): Measured | null {
  if (bytes.length < 6 || view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) {
    return null;
  }
  const count = view.getUint16(4, true);
  let best: Measured | null = null;
  for (let i = 0; i < count && 6 + i * 16 + 16 <= bytes.length; i += 1) {
    const entry = 6 + i * 16;
    let width = bytes[entry] || 256;
    let height = bytes[entry + 1] || 256;
    // 256 이상은 0 으로 적힌다. 안에 든 PNG 가 있으면 그 크기가 정확하다.
    const embedded = pngSize(bytes, view, view.getUint32(entry + 12, true));
    if (embedded) {
      width = embedded.width ?? width;
      height = embedded.height ?? height;
    }
    if (!best || width * height > (best.width ?? 0) * (best.height ?? 0)) {
      best = { width, height, format: 'ico' };
    }
  }
  return best;
}

function jpegSize(bytes: Uint8Array, view: DataView): Measured | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }
    const marker = view.getUint8(offset + 1);
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      return {
        width: view.getUint16(offset + 7),
        height: view.getUint16(offset + 5),
        format: 'jpeg',
      };
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function gifSize(bytes: Uint8Array, view: DataView): Measured | null {
  const head = new TextDecoder().decode(bytes.slice(0, 4));
  return head === 'GIF8' && bytes.length >= 10
    ? { width: view.getUint16(6, true), height: view.getUint16(8, true), format: 'gif' }
    : null;
}

function webpSize(bytes: Uint8Array, view: DataView): Measured | null {
  const text = new TextDecoder().decode(bytes.slice(0, 16));
  if (bytes.length < 30 || text.slice(0, 4) !== 'RIFF' || text.slice(8, 12) !== 'WEBP') {
    return null;
  }
  const chunk = text.slice(12, 16);
  if (chunk === 'VP8 ') {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
      format: 'webp',
    };
  }
  if (chunk === 'VP8L') {
    const bits = view.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, format: 'webp' };
  }
  if (chunk === 'VP8X') {
    const width = 1 + (view.getUint16(24, true) | (view.getUint8(26) << 16));
    const height = 1 + (view.getUint16(27, true) | (view.getUint8(29) << 16));
    return { width, height, format: 'webp' };
  }
  return null;
}

/** 파일 앞부분으로 형식과 크기를 읽는다. 그림이 아니면 `null`. */
export function measureImage(bytes: Uint8Array): Measured | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const measured =
    pngSize(bytes, view) ??
    icoSize(bytes, view) ??
    jpegSize(bytes, view) ??
    gifSize(bytes, view) ??
    webpSize(bytes, view);
  if (measured) {
    return measured.width && measured.height ? measured : null;
  }
  const text = new TextDecoder().decode(bytes.slice(0, 2048)).toLowerCase();
  return text.includes('<svg') ? { width: null, height: null, format: 'svg' } : null;
}

/** 로고 칸에 넣기 좋은 순서. 정사각형에 가까운 것 먼저, 그 안에서 SVG, 그다음 짧은 변이 긴 것. */
function compareCandidates(a: LogoCandidate, b: LogoCandidate): number {
  const squareish = (c: LogoCandidate) =>
    c.width === null ||
    c.height === null ||
    Math.max(c.width, c.height) <= 1.5 * Math.min(c.width, c.height);
  const side = (c: LogoCandidate) =>
    c.width === null || c.height === null ? Number.POSITIVE_INFINITY : Math.min(c.width, c.height);
  return Number(squareish(b)) - Number(squareish(a)) || side(b) - side(a);
}

export async function findLogoCandidates(rawUrl: string): Promise<LogoCandidatesResult> {
  let pageUrl: URL;
  try {
    pageUrl = new URL(rawUrl);
  } catch {
    throw new LogoFailure(400, 'INVALID_URL', '원문 주소 형식이 아닙니다.');
  }
  if (isJobPlatform(pageUrl.hostname)) {
    throw new LogoFailure(
      422,
      'JOB_PLATFORM',
      '채용 플랫폼 주소라 로고를 추천할 수 없습니다. 회사 사이트의 아이콘이 아니에요.',
    );
  }

  // 페이지가 봇을 막아도(403 등) 사이트 루트의 기본 아이콘은 열리는 일이 많아 계속 간다.
  const page = await safeFetch(pageUrl, MAX_PAGE_BYTES, PAGE_TIMEOUT_MS);
  const finalUrl = page?.url ?? pageUrl;
  if (page && isJobPlatform(finalUrl.hostname)) {
    throw new LogoFailure(
      422,
      'JOB_PLATFORM',
      '원문 주소가 채용 플랫폼으로 이동해 로고를 추천할 수 없습니다.',
    );
  }
  const { icons, manifest } = page
    ? declaredInHtml(new TextDecoder().decode(page.bytes), finalUrl)
    : { icons: [], manifest: null };
  const declared = [
    ...icons,
    ...(manifest ? await declaredInManifest(manifest) : []),
    { url: new URL('/apple-touch-icon.png', finalUrl), source: 'apple-touch-icon' as const },
    { url: new URL('/favicon.ico', finalUrl), source: 'favicon.ico' as const },
  ];

  const unique = new Map<string, Declared>();
  for (const item of declared) {
    if (!unique.has(item.url.href)) {
      unique.set(item.url.href, item);
    }
  }

  const measured = await Promise.all(
    [...unique.values()].slice(0, MAX_CANDIDATES).map(async ({ url, source }) => {
      const fetched = await safeFetch(url, MAX_IMAGE_BYTES, IMAGE_TIMEOUT_MS).catch(() => null);
      const size = fetched ? measureImage(fetched.bytes) : null;
      return size ? { url: fetched!.url.href, source, ...size } : null;
    }),
  );

  // 다른 선언이 리다이렉트로 같은 파일에 닿기도 한다.
  const byUrl = new Map<string, LogoCandidate>();
  for (const candidate of measured) {
    if (candidate && !byUrl.has(candidate.url)) {
      byUrl.set(candidate.url, candidate);
    }
  }
  return { candidates: [...byUrl.values()].sort(compareCandidates) };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** 다른 함수들과 같은 봉투(`status`·`code`·`message`)로 답한다. 화면이 `message` 를 그대로 보인다. */
function failure(status: number, code: string, message: string): Response {
  return json(status, { status, code, message });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdmin(request.headers.get('authorization')))) {
    return failure(401, 'UNAUTHORIZED', '어드민 로그인이 필요합니다.');
  }

  let input: { url: string } | null;
  try {
    input = parseLogoCandidatesInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return failure(400, 'INVALID_REQUEST', '원문 주소가 없습니다.');
  }

  try {
    return json(200, await findLogoCandidates(input.url));
  } catch (error) {
    if (error instanceof LogoFailure) {
      return failure(error.status, error.code, error.message);
    }
    throw error;
  }
}
