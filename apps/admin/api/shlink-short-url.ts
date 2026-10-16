/**
 * Shlink(`l.letscareer.co.kr`)에 단축링크를 만들어 주는 서버리스 함수. 어드민 배포본의
 * `POST /shlink-api/short-urls` 가 `vercel.json` 의 rewrite 로 여기에 들어온다.
 *
 * Shlink 의 API 키는 생성뿐 아니라 삭제·수정도 열어 주고, 생성만 허용하는 역할은 없다. 어드민은 정적
 * 파일이라 `VITE_` 변수에 넣으면 번들에 박히므로, 키는 이 함수의 서버 환경변수(`SHLINK_API_KEY`)에만 둔다.
 * 로컬 어드민은 `vite.config.ts` 의 프록시가 같은 일을 한다(검증은 하지 않는다).
 *
 * 이 함수는 키를 가진 열린 프록시가 되면 안 되어서 셋을 막는다.
 * - 호출자: 어드민 API 에 호출자의 토큰을 보내 보고 200 이 아니면 돌려보낸다. 이 서버는 토큰을 직접
 *   검증할 시크릿이 없다.
 * - 대상 주소: 오공고 웹 주소(`ALLOWED_LONG_URL_ORIGIN`) 만 단축한다.
 * - 요청 필드: `longUrl`·`title`·`tags` 만 읽는다. `customSlug`·`domain` 등은 받아도 버린다.
 */

/** 어드민 API 오리진. 버셀 rewrite 가 환경변수를 읽지 못해 `vercel.json` 처럼 주소를 파일에 적는다. */
const ADMIN_API_ORIGIN = 'https://p5itn5nbm4.execute-api.ap-northeast-2.amazonaws.com';

/** 호출자가 어드민 토큰을 가졌는지만 본다. 인자 없는 가벼운 어드민 전용 조회다. */
const ADMIN_PROBE_URL = `${ADMIN_API_ORIGIN}/api/v1/admin/jobs/today`;

/** 단축을 허용하는 긴 주소의 오리진. 어드민이 만드는 링크는 모두 오공고 웹 주소다. */
const ALLOWED_LONG_URL_ORIGIN = 'https://www.ogonggo.co.kr';

const MAX_TAGS = 10;
const UPSTREAM_TIMEOUT_MS = 15_000;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** 렛츠커리어 SSO 함수와 같은 봉투(`status`·`code`·`message`)로 답한다. 화면이 `code` 로 문구를 가른다. */
function failure(status: number, code: string, message: string): Response {
  return json(status, { status, code, message });
}

async function isAdmin(authorization: string | null): Promise<boolean> {
  if (!authorization?.startsWith('Bearer ')) {
    return false;
  }
  try {
    const response = await fetch(ADMIN_PROBE_URL, {
      headers: { authorization },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

interface ShortUrlInput {
  longUrl: string;
  title?: string;
  tags: string[];
}

/** 허용한 필드만 꺼낸다. 맞지 않으면 `null`. */
function parseInput(raw: unknown): ShortUrlInput | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { longUrl, title, tags } = raw as Record<string, unknown>;
  if (typeof longUrl !== 'string') {
    return null;
  }
  try {
    if (new URL(longUrl).origin !== ALLOWED_LONG_URL_ORIGIN) {
      return null;
    }
  } catch {
    return null;
  }
  if (title !== undefined && typeof title !== 'string') {
    return null;
  }
  const tagList = tags ?? [];
  if (
    !Array.isArray(tagList) ||
    tagList.length > MAX_TAGS ||
    !tagList.every((tag) => typeof tag === 'string')
  ) {
    return null;
  }
  return { longUrl, title, tags: tagList };
}

export async function POST(request: Request): Promise<Response> {
  const apiUrl = process.env.SHLINK_API_URL;
  const apiKey = process.env.SHLINK_API_KEY;
  if (!apiUrl || !apiKey) {
    return failure(503, 'SHLINK_NOT_CONFIGURED', '단축링크 서버 설정이 없습니다.');
  }

  if (!(await isAdmin(request.headers.get('authorization')))) {
    return failure(401, 'UNAUTHORIZED', '어드민 로그인이 필요합니다.');
  }

  let input: ShortUrlInput | null;
  try {
    input = parseInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return failure(400, 'INVALID_REQUEST', '단축할 수 없는 요청입니다.');
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiUrl.replace(/\/+$/, '')}/rest/v3/short-urls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
      // 같은 긴 주소·태그면 새로 만들지 않고 있던 링크를 돌려받는다. 모달을 다시 눌러도 늘지 않는다.
      body: JSON.stringify({ ...input, findIfExists: true }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return failure(502, 'SHLINK_UNREACHABLE', '단축링크 서버에 연결하지 못했습니다.');
  }

  // Shlink 의 상태 코드와 본문을 그대로 넘긴다. 키가 틀리면 401 이 오는데, 그대로 두면 화면이 어드민
  // 로그인 만료로 읽으므로 502 로 바꿔 설정 문제임을 드러낸다.
  if (upstream.status === 401) {
    return failure(502, 'SHLINK_KEY_REJECTED', '단축링크 서버가 API 키를 거부했습니다.');
  }
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
