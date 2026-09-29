import { getAccessToken, getRefreshToken } from './accessToken';

/**
 * 오공고 웹 주소. 비우면 운영 주소다. 로컬 웹(`http://localhost:4000`)으로 보내 보려면 `.env.example`
 * 대로 값을 넣는다.
 */
const WEB_ORIGIN = import.meta.env.VITE_OGONGGO_WEB_ORIGIN || 'https://www.ogonggo.co.kr';

/** 토큰을 붙이지 않은 주소. 새 탭 열기(Cmd·Ctrl·가운데 버튼)의 `href` 로 쓴다. */
export const WEB_HOME = WEB_ORIGIN;

/**
 * `오공고 웹으로` 가 가는 곳. 들고 있는 두 토큰을 웹의 인계 화면(`apps/web` 의 `/auth/handoff`)에
 * `#accessToken=…&refreshToken=…` 으로 넘긴다. 웹이 저장하고 주소에서 지운 뒤 홈으로 보낸다.
 * 웹 → 어드민(`apps/web/src/shared/api/adminHandoff.ts`)과 같은 모양이고, 프래그먼트라 서버 로그와
 * `Referer` 에 실리지 않는다.
 *
 * 액세스 토큰이 이미 만료됐어도 넘긴다. 웹은 401 을 받으면 리프레시 토큰으로 재발급한다
 * (`apps/web/src/shared/api/reissue.ts`).
 *
 * 리프레시 토큰이 없으면 웹 첫 화면만 연다 — 웹은 리프레시 토큰이 있어야 로그인으로 본다. 이 저장이
 * 생기기 전에 로그인한 세션이 그렇다.
 */
export function webHandoffHref(): string {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) {
    return WEB_ORIGIN;
  }
  const target = new URL('/auth/handoff', WEB_ORIGIN);
  target.hash = new URLSearchParams({ accessToken, refreshToken }).toString();
  return target.toString();
}
