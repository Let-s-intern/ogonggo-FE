'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { saveTokens } from '@/shared/api/authTokens';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';

/** 갈 곳이 없거나 받을 수 없는 값이면 대시보드다. */
const DEFAULT_NEXT = '/mypage/company';

/**
 * 오공고 웹이 넘긴 로그인을 받는다(이슈 #649). 웹의 기업 회원 입구(마이페이지 배너·팝업, 닉네임 메뉴, 공고 등록,
 * 기업 로그인 뒤 이동)가 `#accessToken=…&refreshToken=…&next=<경로>` 로 보낸다
 * (`apps/web/src/shared/api/bizHandoff.ts`). 웹의 `/auth/handoff`(어드민 → 웹)와 같은 모양이다.
 *
 * 토큰은 저장하기 전에 주소에서 먼저 지운다. 남겨 두면 주소창과 방문 기록에 리프레시 토큰이 남는다. 해시라 서버
 * 로그와 `Referer` 에는 실리지 않는다.
 *
 * 토큰은 따로 확인하지 않는다. 무효한 토큰이면 첫 요청의 401 에서 재발급이 실패하고, 그때 `shared/api/reissue.ts`
 * 가 토큰을 지우고 로그인 화면으로 보낸다. 기업 회원이 아닌 토큰이면 기업 화면의 로그인 안내가 뜬다.
 *
 * `next` 는 이 사이트 안의 경로만 받는다(`sanitizeReturnPath`). 누구나 주소를 만들 수 있어 다른 사이트로 보내는
 * 값을 따르면 열린 리다이렉트가 된다.
 *
 * 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 두 번째는 이미 지운 주소를 읽으므로 ref 로 한 번만 돈다.
 */
export function AuthHandoffPage() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      saveTokens({ accessToken, refreshToken });
    }
    router.replace(sanitizeReturnPath(params.get('next')) ?? DEFAULT_NEXT);
  }, [router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-5">
      <p role="status" className="text-sm text-gray-500">
        로그인하는 중입니다...
      </p>
    </main>
  );
}
