import {
  buildSocialLoginUrl,
  letsCareerCallbackUri,
  type LetsCareerSocialProvider,
} from '@/shared/api/letscareer';
import { savePendingSocialMethod } from '@/shared/lib/lastSignInMethod';
import { saveReturnPath } from '@/shared/lib/returnPath';

/**
 * 카카오·네이버 간편 로그인으로 떠난다. 로그인 화면과 가입 화면("또는 SNS 간편 회원 가입") 이 같이 쓴다 —
 * 처음이면 렛츠커리어가 계정을 만들므로 가입도 같은 동작이다(PRD "화면 > 일반 회원 가입").
 *
 * 간편 로그인은 렛츠커리어를 다녀온다. `redirect_uri` 에 쿼리를 붙일 수 없어(화이트리스트가 쿼리까지 비교한다)
 * 돌아갈 화면과 고른 수단은 떠나기 전에 `sessionStorage` 에 적고 콜백이 꺼낸다.
 */
export function startSocialSignIn(
  provider: LetsCareerSocialProvider,
  returnPath: string | null,
): void {
  saveReturnPath(returnPath);
  savePendingSocialMethod(provider);
  window.location.assign(buildSocialLoginUrl(provider, letsCareerCallbackUri()));
}
