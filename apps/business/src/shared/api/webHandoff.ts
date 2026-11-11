import type { MouseEvent } from 'react';
import { reissueAccessToken } from '@ogonggo/api';
import { OGONGGO_WEB_ORIGIN } from '@/shared/config/site';
import type { ReissueAccessTokenBody } from './authResponses';
import { getRefreshToken, saveAccessToken } from './authTokens';

/**
 * 오공고 웹(`apps/web`)으로 로그인을 들고 간다(이슈 #649). 웹 → biz(`apps/web/src/shared/api/bizHandoff.ts`)의 반대
 * 방향이다.
 *
 * 웹은 다른 도메인이라 이 저장소의 토큰을 읽지 못한다. 웹의 인계 화면(`apps/web` 의 `/auth/handoff`)에
 * `#accessToken=…&refreshToken=…` 으로 넘기면 웹이 저장하고 주소에서 지운 뒤 홈으로 보낸다. 어드민의 `오공고 웹으로`
 * 와 같은 모양이고, 프래그먼트라 서버 로그와 `Referer` 에 실리지 않는다.
 *
 * 액세스 토큰은 새로 받아 넘긴다. 탭마다 따로 두어(`sessionStorage`) 없거나 만료가 가까울 수 있다. 리프레시 토큰은
 * 재발급해도 바뀌지 않아 웹과 biz 가 함께 쓴다. 리프레시 토큰이 없거나 재발급이 실패하면 로그인 없이 웹 홈을 연다.
 */
export async function goToWeb(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      // 성공 응답이 스펙에 빠져 생성 타입이 오류 응답뿐이다(`shared/api/reissue.ts` 와 같다).
      const body = (await reissueAccessToken({
        refreshToken,
      })) as unknown as ReissueAccessTokenBody;
      saveAccessToken(body.data.accessToken);
      const target = new URL('/auth/handoff', OGONGGO_WEB_ORIGIN);
      target.hash = new URLSearchParams({
        accessToken: body.data.accessToken,
        refreshToken,
      }).toString();
      window.location.assign(target.toString());
      return;
    } catch {
      // 위 주석대로 로그인 없이 간다.
    }
  }
  window.location.assign(OGONGGO_WEB_ORIGIN);
}

/**
 * `오늘의 공고 웹으로` 링크의 `onClick`. 그냥 누른 것만 가로챈다 — 새 탭 열기(Cmd·Ctrl·Shift, 가운데 버튼)는
 * `href`(웹 홈) 대로 둔다.
 */
export function onWebLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  void goToWeb();
}
