import type { MouseEvent } from 'react';
import { reissueAccessToken } from '@ogonggo/api';
import type { ReissueAccessTokenBody } from './authResponses';
import { getRefreshToken, saveAccessToken } from './authTokens';

/**
 * 비즈 오공고(`apps/business`) 주소. 비우면 운영 주소다. 로컬 biz(`http://localhost:4002`)로 보내 보려면
 * `.env.example` 대로 값을 넣는다.
 */
export const BIZ_ORIGIN = process.env.NEXT_PUBLIC_BIZ_ORIGIN || 'https://biz.ogonggo.co.kr';

/** biz 의 기업 회원 대시보드. 닉네임 메뉴의 `비즈 오공고` 와 기업 로그인 뒤 이동이 간다. */
export const BIZ_DASHBOARD_PATH = '/mypage/company';

/** 토큰을 붙이지 않은 biz 주소. 링크의 `href`(새 탭 열기)와 로그인하지 않은 사람이 간다. */
export function bizUrl(path: string): string {
  return new URL(path, BIZ_ORIGIN).toString();
}

/**
 * 웹의 로그인 상태로 biz 의 `path` 를 연다. 기업 회원 기능을 biz 로 옮기는 동안 웹의 기업 회원 입구(마이페이지
 * 배너·팝업, 닉네임 메뉴, 공고 등록, 기업 로그인 뒤 이동)가 부른다(이슈 #649).
 *
 * biz 는 다른 도메인이라 이 저장소의 토큰을 읽지 못한다. biz 의 인계 화면(`apps/business` 의 `/auth/handoff`)에
 * `#accessToken=…&refreshToken=…&next=<path>` 로 넘기면, biz 가 저장하고 주소에서 지운 뒤 `next` 로 보낸다.
 * 웹 → 어드민(`adminHandoff.ts`)과 같은 모양이고, 프래그먼트라 서버 로그와 `Referer` 에 실리지 않는다.
 *
 * 액세스 토큰은 새로 받아 넘긴다. 탭마다 따로 두어(`sessionStorage`) 없거나 만료가 가까울 수 있다. 리프레시
 * 토큰은 재발급해도 바뀌지 않아(BE `UserAuthService.reissueAccessToken`) 웹과 biz 가 같은 것을 함께 써도 된다.
 *
 * 리프레시 토큰이 없거나 재발급이 실패하면 토큰 없이 biz 로 보낸다 — biz 가 필요하면 로그인 화면을 띄운다.
 */
export async function goToBiz(path: string): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      // 성공 응답이 스펙에 빠져 생성 타입이 오류 응답뿐이다. authResponses.ts 주석에 이유가 있다.
      const body = (await reissueAccessToken({
        refreshToken,
      })) as unknown as ReissueAccessTokenBody;
      saveAccessToken(body.data.accessToken);
      const target = new URL('/auth/handoff', BIZ_ORIGIN);
      target.hash = new URLSearchParams({
        accessToken: body.data.accessToken,
        refreshToken,
        next: path,
      }).toString();
      window.location.assign(target.toString());
      return;
    } catch {
      // 위 주석대로 토큰 없이 간다.
    }
  }
  window.location.assign(bizUrl(path));
}

/**
 * 기업 회원이 웹에서 로그인했을 때(또는 이미 기업 회원으로 로그인 화면에 왔을 때) 늘 biz 로 간다(2026-11-11
 * 사용자). 돌아갈 곳이 기업 마이페이지면 biz 의 같은 경로로, 그 밖에는 biz 대시보드로 간다.
 */
export function goToBizAfterCompanySignIn(returnPath: string | null): void {
  void goToBiz(returnPath?.startsWith(BIZ_DASHBOARD_PATH) ? returnPath : BIZ_DASHBOARD_PATH);
}

/**
 * biz 링크의 `onClick`. 그냥 누른 것만 가로채 로그인을 들고 간다 — 새 탭 열기(Cmd·Ctrl·Shift, 가운데 버튼)는
 * `href` 대로 두어 biz 가 로그인 화면을 띄운다.
 */
export function onBizLinkClick(path: string, before?: () => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    before?.();
    void goToBiz(path);
  };
}
