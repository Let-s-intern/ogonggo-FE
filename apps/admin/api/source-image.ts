/**
 * 공고 원문 HTML 의 이미지(포스터 등)를 대신 받아 돌려주는 서버리스 함수. 어드민 배포본의 `POST /source-image-api`
 * 가 `vercel.json` 의 rewrite 로 여기에 들어온다. AI 비서의 `view_source_images` 가 쓴다
 * (`src/features/ai-assistant/model/images.ts`). 로컬 어드민은 `vite.config.ts` 의 미들웨어가 `fetchSourceImage` 를
 * 그대로 부른다.
 *
 * 브라우저가 남의 사이트 그림을 직접 받으면 CORS 로 캔버스가 막혀 줄이지 못한다. 공개 주소를 모델에게 그대로 넘기지
 * 않는 이유는 둘이다 — 핫링크를 막는 사이트가 많고, 모델 서버가 주소 하나를 못 받으면 요청 전체가 400 이다. 그래서
 * 이 함수가 받아 주고 브라우저가 줄여 data URI 로 싣는다.
 *
 * 받은 주소를 서버가 대신 여는 함수라 로고 추천(`logo-candidates.ts`)과 같은 셋을 막는다.
 * - 호출자: 어드민 토큰이 아니면 돌려보낸다(`redash-query.ts` 의 `isAdmin`).
 * - 대상: http(s) 기본 포트만, 사설·루프백 주소로 풀리는 호스트와 그리로 가는 리다이렉트는 열지 않는다(`safeFetch`).
 * - 크기: 시간(8초)과 읽는 바이트(4MB, Vercel 함수 응답 상한 4.5MB 아래)를 자른다. 그림(PNG·JPEG·GIF·WebP)만 돌려준다.
 */

import { isAdmin } from './redash-query.js';
import { LogoFailure, measureImage, safeFetch } from './logo-candidates.js';

const IMAGE_TIMEOUT_MS = 8_000;
const MAX_IMAGE_BYTES = 4_000_000;

const CONTENT_TYPES = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
} as const;

export class SourceImageFailure extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'SourceImageFailure';
    this.status = status;
    this.code = code;
  }
}

/** `{ url }` 에서 주소만 꺼낸다. 맞지 않으면 `null`. */
export function parseSourceImageInput(raw: unknown): { url: string } | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { url } = raw as Record<string, unknown>;
  return typeof url === 'string' && URL.canParse(url.trim()) ? { url: url.trim() } : null;
}

/** 그림을 받아 바이트와 형식을 돌려준다. 못 받으면 `SourceImageFailure`. */
export async function fetchSourceImage(
  rawUrl: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  let fetched: Awaited<ReturnType<typeof safeFetch>>;
  try {
    fetched = await safeFetch(new URL(rawUrl), MAX_IMAGE_BYTES, IMAGE_TIMEOUT_MS);
  } catch (error) {
    if (error instanceof LogoFailure) {
      throw new SourceImageFailure(error.status, error.code, error.message);
    }
    throw error;
  }
  if (!fetched) {
    throw new SourceImageFailure(
      502,
      'IMAGE_UNREACHABLE',
      '이미지를 받지 못했습니다(응답 없음, 오류, 또는 4MB 초과).',
    );
  }
  // 헤더(`content-type`)는 믿지 않고 파일 앞부분으로 형식을 본다. 아이콘·SVG 는 모델이 읽지 못하거나 쓸모가 없다.
  const format = measureImage(fetched.bytes)?.format;
  if (!format || !(format in CONTENT_TYPES)) {
    throw new SourceImageFailure(415, 'NOT_IMAGE', 'PNG·JPEG·GIF·WebP 그림이 아닙니다.');
  }
  return { bytes: fetched.bytes, contentType: CONTENT_TYPES[format as keyof typeof CONTENT_TYPES] };
}

function failure(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ status, code, message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdmin(request.headers.get('authorization')))) {
    return failure(401, 'UNAUTHORIZED', '어드민 로그인이 필요합니다.');
  }

  let input: { url: string } | null;
  try {
    input = parseSourceImageInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return failure(400, 'INVALID_REQUEST', '이미지 주소가 없습니다.');
  }

  try {
    const { bytes, contentType } = await fetchSourceImage(input.url);
    // `readLimited` 가 새 `ArrayBuffer` 로 모은 바이트다.
    return new Response(bytes as Uint8Array<ArrayBuffer>, {
      headers: { 'content-type': contentType, 'cache-control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof SourceImageFailure) {
      return failure(error.status, error.code, error.message);
    }
    throw error;
  }
}
