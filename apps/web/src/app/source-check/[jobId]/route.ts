import { getPublicJob } from '@ogonggo/api';
import type { SuccessResponseUserJobDetailResponse } from '@ogonggo/api';

/**
 * 채용공고 원문이 아직 있는지 서버에서 확인한다(이슈 #479). 상시 채용은 마감일이 없어 원문이
 * 내려가도 크롤러가 다시 확인할 때까지 상세의 지원 버튼이 살아 있다. 브라우저는 CORS 때문에 남의
 * 사이트 응답 코드를 읽지 못해 여기서 대신 읽는다.
 *
 * 주소는 받지 않고 공고 id 만 받는다. 원문 주소는 백엔드 상세 응답에서 꺼낸다 — 주소를 받으면 아무
 * 곳이나 대신 불러 주는 통로가 된다.
 *
 * **404·410 만 마감이다.** 그리팅(greetinghr) 공고는 살아 있는 페이지에도 `마감된 공고입니다` 가
 * 번역 문자열로 들어 있어 본문 문구로는 가를 수 없다(2026-10-21 실측). 403·5xx·타임아웃은 봇만 막는
 * 사이트가 많아 살아 있는 것으로 본다 — 살아 있는 공고를 막는 쪽이 더 큰 사고다.
 *
 * 10분 캐시한다. 크롤러 재확인 주기 사이를 메우는 용도라 길게 두면 뜻이 없고, 짧으면 조회가 몰릴 때
 * 원문 사이트가 이 서버를 막는다. `/api/**` 는 백엔드로 넘어가는 rewrite 가 있어(`next.config.ts`)
 * 이 경로는 그 밖에 둔다.
 */
const TIMEOUT_MS = 3000;
const CACHE_SECONDS = 600;
const CLOSED_STATUSES = [404, 410];

async function isSourceGone(sourceUrl: string): Promise<boolean> {
  try {
    const upstream = await fetch(sourceUrl, {
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
  } catch {
    return false;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const jobId = Number((await params).jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return Response.json({ closed: false }, { status: 400 });
  }

  let sourceUrl: string | undefined;
  try {
    // `fetchJobDetail`(widgets/job-detail)과 같은 이유로 파싱된 body 를 그대로 받는다.
    const response = (await getPublicJob(jobId)) as unknown as SuccessResponseUserJobDetailResponse;
    sourceUrl = response.data?.sourceUrl;
  } catch {
    return Response.json({ closed: false });
  }

  const closed =
    sourceUrl && /^https?:\/\//.test(sourceUrl) ? await isSourceGone(sourceUrl) : false;
  return Response.json(
    { closed },
    { headers: { 'cache-control': `public, s-maxage=${CACHE_SECONDS}` } },
  );
}
