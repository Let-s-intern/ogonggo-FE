import type { MouseEvent } from 'react';
import { reissueAccessToken } from '@ogonggo/api';
import type { ReissueAccessTokenBody } from './authResponses';
import { getRefreshToken, saveAccessToken } from './authTokens';

/**
 * 웹의 로그인 상태로 어드민 콘솔에 들어간다. 헤더의 `어드민` 항목이 누를 때 부른다.
 *
 * 어드민은 다른 도메인이라 이 저장소의 토큰을 읽지 못한다. 그래서 액세스 토큰을 새로 받아
 * `어드민/login#accessToken=...` 으로 보내고, 어드민 로그인 화면이 그것을 꺼내 관리자 확인을 거쳐
 * 저장한다(`apps/admin/src/pages/login/ui/LoginPage.tsx` 의 `takeHandoffToken`). 프래그먼트라
 * 서버 로그와 `Referer` 에는 실리지 않는다.
 *
 * 들고 있는 토큰을 그대로 넘기지 않고 새로 받는 이유. 액세스 토큰은 탭마다 따로 두어서
 * (`sessionStorage`) 새 탭이면 없고, 있어도 만료가 가까울 수 있다. 어드민은 재발급을 하지 않으므로
 * 받자마자 끊기지 않게 막 발급된 30분짜리를 넘긴다.
 *
 * 재발급이 실패하면 토큰 없이 어드민으로 보낸다 — 어드민 로그인 화면이 뜰 뿐이다.
 */
export async function goToAdmin(adminOrigin: string): Promise<void> {
  const target = new URL('/login', adminOrigin);
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      // 성공 응답이 스펙에 빠져 생성 타입이 오류 응답뿐이다. authResponses.ts 주석에 이유가 있다.
      const body = (await reissueAccessToken({
        refreshToken,
      })) as unknown as ReissueAccessTokenBody;
      saveAccessToken(body.data.accessToken);
      // 리프레시 토큰도 넘긴다. 어드민의 `오공고 웹으로` 가 웹에 로그인을 되돌려 줄 때 쓴다
      // (`apps/admin/src/shared/api/webHandoff.ts`).
      target.hash = new URLSearchParams({
        accessToken: body.data.accessToken,
        refreshToken,
      }).toString();
    } catch {
      // 위 주석대로 토큰 없이 간다.
    }
  }
  window.location.assign(target.toString());
}

/**
 * `어드민` 링크의 `onClick`. 그냥 누른 것만 가로챈다 — 새 탭 열기(Cmd·Ctrl·Shift, 가운데 버튼)는
 * `href` 대로 두어 어드민 로그인 화면이 뜬다.
 */
export function onAdminLinkClick(adminOrigin: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    void goToAdmin(adminOrigin);
  };
}
