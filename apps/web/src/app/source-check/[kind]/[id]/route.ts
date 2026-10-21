import { getPublicBootcamp, getPublicJob } from '@ogonggo/api';
import type {
  SuccessResponseUserBootcampDetailResponse,
  SuccessResponseUserJobDetailResponse,
} from '@ogonggo/api';

/**
 * 상세의 지원·신청 링크가 열리는 주소인지 서버에서 확인한다(이슈 #479, #482). 원문이 내려갔거나
 * 잘못 등록된 링크를 사용자에게 보여 주지 않으려는 것이다. 브라우저는 CORS 때문에 남의 사이트 응답
 * 코드를 읽지 못해 여기서 대신 읽는다.
 *
 * 주소는 받지 않고 종류와 id 만 받는다. 링크는 백엔드 상세 응답에서 꺼낸다 — 주소를 받으면 아무
 * 곳이나 대신 불러 주는 통로가 된다.
 *
 * **깨진 것으로 보는 경우는 셋이다.** 404·410, 없는 도메인·접속 거부, http(s) 주소로 읽히지 않는 값
 * (`https://` 가 빠진 `www.…` 는 버튼에서 오공고 안의 상대 경로가 된다). 본문 문구로는 가르지 않는다 —
 * 그리팅(greetinghr) 공고는 살아 있는 페이지에도 `마감된 공고입니다` 가 번역 문자열로 들어 있다
 * (2026-10-21 실측). 403·5xx·타임아웃은 봇만 막거나 잠깐 느린 사이트가 많아 살아 있는 것으로 본다 —
 * 살아 있는 링크를 막는 쪽이 더 큰 사고다.
 *
 * 고용24·새싹은 없는 과정에도 200 을 줘서 원문이 내려간 것은 잡지 못한다(2026-10-21 실측).
 *
 * 10분 캐시한다. 크롤러 재확인 주기 사이를 메우는 용도라 길게 두면 뜻이 없고, 짧으면 조회가 몰릴 때
 * 원문 사이트가 이 서버를 막는다. `/api/**` 는 백엔드로 넘어가는 rewrite 가 있어(`next.config.ts`)
 * 이 경로는 그 밖에 둔다.
 */
const TIMEOUT_MS = 3000;
const CACHE_SECONDS = 600;
const CLOSED_STATUSES = [404, 410];
/** 다시 해도 같은 결과가 나오는 연결 실패. `EAI_AGAIN`(DNS 일시 오류)은 넣지 않는다. */
const UNREACHABLE_CODES = ['ENOTFOUND', 'ECONNREFUSED'];

type Kind = 'jobs' | 'bootcamps';

/** `fetchJobDetail`·`fetchBootcampDetail`(widgets)과 같은 이유로 파싱된 body 를 그대로 받는다. */
async function fetchApplyHref(kind: Kind, id: number): Promise<string | undefined> {
  if (kind === 'jobs') {
    const response = (await getPublicJob(id)) as unknown as SuccessResponseUserJobDetailResponse;
    return response.data?.sourceUrl;
  }
  const response = (await getPublicBootcamp(
    id,
  )) as unknown as SuccessResponseUserBootcampDetailResponse;
  return response.data?.applicationMethod === 'EXTERNAL_PAGE'
    ? response.data.applicationUrl
    : undefined;
}

async function isBroken(href: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return true;
  }
  if (url.protocol === 'mailto:') {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return true;
  }

  try {
    const upstream = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // 기본 UA 는 봇으로 보고 403 을 주는 곳이 있다.
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
      },
    });
    await upstream.body?.cancel();
    return CLOSED_STATUSES.includes(upstream.status);
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code;
    return code !== undefined && UNREACHABLE_CODES.includes(code);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id: rawId } = await params;
  const id = Number(rawId);
  if ((kind !== 'jobs' && kind !== 'bootcamps') || !Number.isInteger(id) || id <= 0) {
    return Response.json({ closed: false }, { status: 400 });
  }

  let href: string | undefined;
  try {
    href = await fetchApplyHref(kind, id);
  } catch {
    return Response.json({ closed: false });
  }

  const closed = href ? await isBroken(href) : false;
  return Response.json(
    { closed },
    { headers: { 'cache-control': `public, s-maxage=${CACHE_SECONDS}` } },
  );
}
