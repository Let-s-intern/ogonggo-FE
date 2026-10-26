import { getAccessToken } from './accessToken';

/**
 * 원문 주소 사이트의 아이콘을 로고 후보로 받는 작은 클라이언트. 공고 편집의 `로고 추천` 이 쓴다.
 *
 * `shlink.ts` 와 같은 이유로 `httpClient` 를 쓰지 않는다 — 이 호출의 실패는 남의 사이트 사정일 수 있다.
 *
 * `/logo-api/**` 는 dev 에서 `vite.config.ts` 의 미들웨어가, 배포본에서 `vercel.json` 의 rewrite 가 부르는
 * 서버리스 함수(`api/logo-candidates.ts`) 가 받는다.
 */

const CANDIDATES_PATH = '/logo-api/candidates';

/** `api/logo-candidates.ts` 의 응답 한 줄. */
export interface LogoCandidate {
  url: string;
  /** SVG 는 크기가 없다(벡터). */
  width: number | null;
  height: number | null;
  format: 'png' | 'jpeg' | 'gif' | 'webp' | 'ico' | 'svg';
  source: 'icon' | 'apple-touch-icon' | 'manifest' | 'og:image' | 'favicon.ico';
}

export class LogoCandidatesError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'LogoCandidatesError';
    this.status = status;
  }
}

/** 후보를 로고 칸에 넣기 좋은 순서로 돌려준다. 하나도 없으면 빈 배열이다. */
export async function fetchLogoCandidates(sourceUrl: string): Promise<LogoCandidate[]> {
  const token = getAccessToken();
  const response = await fetch(CANDIDATES_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url: sourceUrl }),
  });

  let body: { candidates?: LogoCandidate[]; message?: string } | undefined;
  try {
    body = await response.json();
  } catch {
    // JSON 이 아닌 본문(게이트웨이 오류 등). 아래에서 상태 코드로 알린다.
  }

  if (!response.ok) {
    throw new LogoCandidatesError(
      response.status,
      body?.message ?? `로고 후보를 가져오지 못했습니다(${response.status}).`,
    );
  }
  if (!Array.isArray(body?.candidates)) {
    throw new LogoCandidatesError(response.status, '로고 후보 응답을 읽지 못했습니다.');
  }
  return body.candidates;
}
