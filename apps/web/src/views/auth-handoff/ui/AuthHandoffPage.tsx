'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { saveTokens } from '@/shared/api/authTokens';
import { exchangeLetsCareerToken, pathAfterLetsCareerSignIn } from '@/shared/api/letsCareerSignIn';

/**
 * 다른 서비스에서 넘어온 로그인을 받는다. 주소의 해시로 두 가지가 온다.
 *
 * - `#accessToken=…&refreshToken=…`: 어드민이 넘기는 오공고 토큰(`apps/admin/src/shared/api/webHandoff.ts`).
 *   그대로 저장한다.
 * - `#__sso=<렛츠커리어 액세스>|<렛츠커리어 리프레시>`: 렛츠커리어 웹 헤더의 `오늘의 공고` 가 넘기는 렛츠커리어
 *   토큰(`lets-intern-client` 의 `apps/web/src/common/layout/header/ogonggoHref.ts`). 오공고 토큰으로
 *   바꿔 저장한다. 오공고 계정이 없으면 이 교환에서 만들어지고(`isNewUser`) 커리어 정보 화면으로 간다.
 *   렛츠커리어 → 오공고 방향도 오공고 → 렛츠커리어(`shared/api/letsCareerHandoff.ts`)와 같은 `#__sso=` 다.
 *
 * 토큰은 저장하기 전에 주소에서 먼저 지운다. 남겨 두면 주소창과 방문 기록에 리프레시 토큰이 남는다. 해시라
 * 서버 로그와 `Referer` 에는 실리지 않는다.
 *
 * 오공고 토큰은 따로 확인하지 않는다. 무효한 토큰이면 첫 요청의 401 에서 재발급이 실패하고, 그때
 * `shared/api/reissue.ts` 가 토큰을 지우고 로그인 화면으로 보낸다. 이메일 로그인과 같은 길이다.
 *
 * 렛츠커리어 토큰은 교환이 실패하면(액세스 토큰 만료, 서버 오류 등) 홈으로만 보낸다. 서비스를 오가려고 누른
 * 것이라 로그인 화면의 오류 문구를 보여 주지 않고, 로그인하지 않은 채로 열린다.
 *
 * 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 두 번째는 이미 지운 주소를 읽으므로 ref 로 한 번만 돈다
 * (`views/letscareer-callback/ui/LetsCareerCallbackPage.tsx` 와 같다).
 */
export function AuthHandoffPage() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);

    const [letsCareerAccessToken, letsCareerRefreshToken] = (params.get('__sso') ?? '').split('|');
    if (letsCareerAccessToken && letsCareerRefreshToken) {
      exchangeLetsCareerToken(letsCareerAccessToken, letsCareerRefreshToken)
        .then(({ isNewUser }) => router.replace(pathAfterLetsCareerSignIn(isNewUser, null)))
        .catch(() => router.replace('/'));
      return;
    }

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      saveTokens({ accessToken, refreshToken });
    }
    router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-5">
      <p role="status" className="text-sm text-gray-500">
        로그인하는 중입니다...
      </p>
    </main>
  );
}
