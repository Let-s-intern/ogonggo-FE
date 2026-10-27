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
