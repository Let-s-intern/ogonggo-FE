import { getAccessToken } from './accessToken';

/**
 * 단축링크(Shlink) 를 만드는 작은 클라이언트. UTM 링크 모달이 쓴다.
 *
 * `@ogonggo/api` 의 `httpClient` 를 쓰지 않는다. 그쪽은 401 을 받으면 어드민 로그인이 끝난 것으로 보고
 * 로그인 화면으로 돌려보내는데, 이 호출의 실패는 단축링크 서버 쪽 사정일 수 있다.
 *
 * `/shlink-api/**` 는 dev 에서 `vite.config.ts` 의 프록시가, 배포본에서 `vercel.json` 의 rewrite 가 부르는
 * 서버리스 함수(`api/shlink-short-url.ts`) 가 Shlink 로 넘긴다. API 키는 그쪽만 갖는다.
 */

const SHORT_URLS_PATH = '/shlink-api/short-urls';

export interface ShortUrlRequest {
  /** 단축할 주소. 오공고 웹 주소여야 한다(함수가 막는다). */
  longUrl: string;
  title: string;
  tags: string[];
}

export class ShortUrlError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ShortUrlError';
    this.status = status;
  }
}

interface ErrorBody {
  /** 함수가 내는 오류와 Shlink 가 내는 오류(`detail`) 둘 다 문구를 갖는다. */
  message?: string;
  detail?: string;
}

/** 단축링크를 만들고 `https://l.letscareer.co.kr/aB3dE` 같은 주소를 돌려준다. */
export async function createShortUrl(request: ShortUrlRequest): Promise<string> {
  const token = getAccessToken();
  const response = await fetch(SHORT_URLS_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    // `findIfExists` 는 같은 주소·태그면 있던 링크를 돌려받게 한다. 배포본의 함수는 스스로 붙이고, dev
    // 프록시는 본문을 그대로 넘기므로 여기서 함께 보낸다.
    body: JSON.stringify({ ...request, findIfExists: true }),
  });

  const text = await response.text().catch(() => '');
  let body: (ErrorBody & { shortUrl?: unknown }) | undefined;
  try {
    body = JSON.parse(text);
  } catch {
    // JSON 이 아닌 본문(게이트웨이 오류 등). 아래에서 상태 코드로 알린다.
  }

  if (!response.ok) {
    throw new ShortUrlError(
      response.status,
      body?.message ?? body?.detail ?? `단축링크를 만들지 못했습니다(${response.status}).`,
    );
  }
  if (typeof body?.shortUrl !== 'string') {
    throw new ShortUrlError(response.status, '단축링크 서버 응답을 읽지 못했습니다.');
  }
  return body.shortUrl;
}
