import { getLetsCareerTokens } from './authTokens';

/**
 * 렛츠커리어 웹 주소. 비우면 운영 주소다 — 헤더의 렛츠커리어 마크가 늘 갈 곳이 있어야 해서
 * 어드민 주소(`NEXT_PUBLIC_ADMIN_ORIGIN`)처럼 항목을 숨기지 않는다. 개발 서버로 보내 보려면
 * `.env.example` 대로 값을 넣는다.
 */
const LETSCAREER_WEB_ORIGIN =
  process.env.NEXT_PUBLIC_LETSCAREER_WEB_ORIGIN || 'https://www.letscareer.co.kr';

/**
 * 렛츠커리어 쪽 유입 분석에서 오공고 헤더를 거쳐 온 방문을 가르는 값. 토큰 유무와 상관없이 늘 붙인다.
 */
const UTM_PARAMS = {
  utm_source: 'ogonggo',
  utm_medium: 'referral',
  utm_campaign: 'service_toggle',
  utm_content: 'header_logo',
} as const;

function letsCareerHomeUrl(): URL {
  const url = new URL('/', LETSCAREER_WEB_ORIGIN);
  for (const [key, value] of Object.entries(UTM_PARAMS)) {
    url.searchParams.set(key, value);
  }
  return url;
}

/**
 * 헤더의 렛츠커리어 마크가 가는 곳. 로그인 때 받아 둔 렛츠커리어 토큰이 있으면
 * `#__sso=<accessToken>|<refreshToken>` 을 붙여 렛츠커리어에서도 로그인된 채로 열리게 한다.
 *
 * 받는 쪽은 렛츠커리어 web 의 공용 로그인 스토어다(`lets-intern-client` 의
 * `packages/store/src/useAuthStore.ts` `consumeSsoHashIfPresent`). 렛츠커리어 web 이 자기 admin·mentor 로
 * 넘어갈 때 쓰는 형식 그대로다(같은 저장소 `apps/web/src/common/utils/crossAppUrl.ts`). 프래그먼트라 서버
 * 로그와 `Referer` 에 실리지 않고, 받는 쪽이 읽자마자 주소에서 지운다.
 *
 * 액세스 토큰이 이미 만료됐어도 그대로 넘긴다. 렛츠커리어가 리프레시 토큰으로 스스로 갱신하고, 갱신은
 * 리프레시 토큰을 바꾸지 않는다(`lets-career-server` `TokenProvider.reissueAccessToken`) — 그래서 같은
 * 토큰으로 몇 번을 넘어가도 된다.
 *
 * 토큰이 없으면(로그아웃, 기업 회원, 이 저장이 생기기 전에 로그인한 사람) 렛츠커리어 첫 화면만 연다.
 */
export function letsCareerWebHref(): string {
  const target = letsCareerHomeUrl();
  const tokens = getLetsCareerTokens();
  if (!tokens) {
    return target.toString();
  }
  target.hash = `__sso=${encodeURIComponent(`${tokens.accessToken}|${tokens.refreshToken}`)}`;
  return target.toString();
}

/** 토큰을 붙이지 않은(UTM 만 붙인) 주소. 서버 렌더와 새 탭 열기(가운데 버튼 등)의 `href` 로 쓴다. */
export const LETSCAREER_WEB_HOME = letsCareerHomeUrl().toString();

/**
 * 렛츠커리어 챌린지 상세 주소(`lets-intern-client` 의 `app/(user)/program/challenge/[id]`). 교육·부트캠프
 * 상세의 추천(`widgets/lets-career-recommend`)이 쓴다. 헤더 로고와 같은 UTM 이되 캠페인과 자리를 가른다.
 */
export function letsCareerChallengeUrl(challengeId: number): string {
  const url = new URL(`/program/challenge/${challengeId}`, LETSCAREER_WEB_ORIGIN);
  url.searchParams.set('utm_source', UTM_PARAMS.utm_source);
  url.searchParams.set('utm_medium', UTM_PARAMS.utm_medium);
  url.searchParams.set('utm_campaign', 'cross_sell');
  url.searchParams.set('utm_content', 'detail_sidebar');
  return url.toString();
}

/**
 * 렛츠커리어 멘토링 목록(`lets-intern-client` 의 `/program?catalog=mentoring` — `/live-mentoring` 이 여기로
 * 넘긴다). 채용공고 상세의 `멘토한테 마지막 검토받기` 가 쓴다.
 */
export function letsCareerMentoringUrl(): string {
  const url = new URL('/program', LETSCAREER_WEB_ORIGIN);
  url.searchParams.set('catalog', 'mentoring');
  url.searchParams.set('utm_source', UTM_PARAMS.utm_source);
  url.searchParams.set('utm_medium', UTM_PARAMS.utm_medium);
  url.searchParams.set('utm_campaign', 'cross_sell');
  url.searchParams.set('utm_content', 'detail_mentor_review');
  return url.toString();
}

/** 산업 트렌드 리포트 판매 화면이 렛츠커리어로 보낼 때의 UTM. 자리(`utm_content`)만 호출마다 다르다. */
function industryReportUtm(url: URL, content: 'landing_buy' | 'mypage_reports'): void {
  url.searchParams.set('utm_source', UTM_PARAMS.utm_source);
  url.searchParams.set('utm_medium', UTM_PARAMS.utm_medium);
  url.searchParams.set('utm_campaign', 'industry_report');
  url.searchParams.set('utm_content', content);
}

/** 로그인 때 받아 둔 렛츠커리어 토큰이 있으면 `#__sso` 를 붙인다. 없으면 그대로 둔다(`letsCareerWebHref` 참고). */
function withSso(url: URL): string {
  const tokens = getLetsCareerTokens();
  if (tokens) {
    url.hash = `__sso=${encodeURIComponent(`${tokens.accessToken}|${tokens.refreshToken}`)}`;
  }
  return url.toString();
}

/**
 * 렛츠커리어 가이드북 구매 팝업 주소(`/guidebook/purchase/{id}`). 결제가 끝나고 창이 닫히지 않으면 렛츠커리어가
 * `returnUrl`(그 상품의 오공고 판매 상세 주소)로 같은 창을 옮긴다. 허용 목록 검증은 렛츠커리어가 한다.
 *
 * 브라우저에서 구매 버튼을 누를 때 부른다 — 토큰은 `localStorage` 에서 읽는다. 토큰이 없으면(`#__sso` 없이)
 * 열리고, 렛츠커리어가 로그인을 요구하면 팝업 안에서 끝낸다.
 */
export function letsCareerGuidebookPurchaseUrl(guidebookId: number, returnUrl: string): string {
  const url = new URL(`/guidebook/purchase/${guidebookId}`, LETSCAREER_WEB_ORIGIN);
  industryReportUtm(url, 'landing_buy');
  url.searchParams.set('returnUrl', returnUrl);
  return withSso(url);
}

/**
 * 렛츠커리어 가이드북 구매 목록 전용 경로. 마이페이지 `내 리포트` 의 iframe 과 새 창 링크가 같은 주소를 쓴다.
 *
 * 경로 `/guidebook/my` 는 렛커 Push 3 의 제안이다. 렛츠커리어에서 다르게 정하면 이 상수만 바꾼다.
 */
const GUIDEBOOK_PURCHASES_PATH = '/guidebook/my';

export function letsCareerGuidebookPurchasesUrl(): string {
  const url = new URL(GUIDEBOOK_PURCHASES_PATH, LETSCAREER_WEB_ORIGIN);
  industryReportUtm(url, 'mypage_reports');
  return withSso(url);
}
