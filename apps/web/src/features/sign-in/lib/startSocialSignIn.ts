import {
  buildSocialLoginUrl,
  letsCareerCallbackUri,
  type LetsCareerSocialProvider,
} from '@/shared/api/letscareer';
import { savePendingSocialMethod } from '@/shared/lib/lastSignInMethod';
import { saveReturnPath } from '@/shared/lib/returnPath';

/**
 * Referer 를 보내지 않고 이동한다. `window.location.assign` 은 Referer 를 끌 수 없어 `rel="noreferrer"` 링크를 눌러서
 * 간다. 리다이렉트를 거쳐도 처음에 정해진 Referer 없음이 유지된다.
 */
function navigateWithoutReferrer(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noreferrer';
  link.referrerPolicy = 'no-referrer';
  document.body.append(link);
  link.click();
  link.remove();
}

/**
 * 카카오·네이버 간편 로그인으로 떠난다. 로그인 화면과 가입 화면("또는 SNS 간편 회원 가입") 이 같이 쓴다 —
 * 처음이면 렛츠커리어가 계정을 만들므로 가입도 같은 동작이다(PRD "화면 > 일반 회원 가입").
 *
 * 간편 로그인은 렛츠커리어를 다녀온다. `redirect_uri` 에 쿼리를 붙일 수 없어(화이트리스트가 쿼리까지 비교한다)
 * 돌아갈 화면과 고른 수단은 떠나기 전에 `sessionStorage` 에 적고 콜백이 꺼낸다.
 *
 * 네이버는 Referer 를 앱에 등록된 서비스 URL(렛츠커리어)과 비교해 다르면 로그인 폼도 보이기 전에 `disp_stat=208`
 * 오류로 보낸다. 오공고에서 떠나면 Referer 가 `https://www.ogonggo.co.kr/` 라 막힌다. Referer 가 없거나
 * 렛츠커리어이면 통과한다(2026-10-15 curl 로 확인). 서비스 URL 은 하나만 둘 수 있어 오공고를 더할 수 없다.
 * 카카오는 이 검사를 하지 않아 기존대로 이동한다.
 */
export function startSocialSignIn(
  provider: LetsCareerSocialProvider,
  returnPath: string | null,
): void {
  saveReturnPath(returnPath);
  savePendingSocialMethod(provider);
  const url = buildSocialLoginUrl(provider, letsCareerCallbackUri());
  if (provider === 'naver') {
    navigateWithoutReferrer(url);
    return;
  }
  window.location.assign(url);
}
