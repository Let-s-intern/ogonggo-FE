/**
 * 어드민 API 가 방금 로그인한 토큰을 판단하지 못한 상태(401) 를 세션 동안 기억한다.
 *
 * 어드민 서버에 JWT 시크릿(`OGONGGO_AUTH_JWT_SECRET`) 이 없으면 토큰 파서가 모든 토큰을 `null`
 * 로 돌려, 올바른 관리자 토큰도 아무 문자열도 똑같이 401 이 된다(2026-09-22 실측: 토큰 없이 부른
 * 응답과 글자까지 같다). 그 401 은 "관리자가 아니다" 가 아니라 **"서버가 판단하지 못했다"** 이므로
 * 로그인을 막지 않는다(`pages/login/ui/LoginPage.tsx`). 대신 어느 메뉴를 눌러도 비어 있을 이유를
 * 화면에 남겨야 해서, 그 사실을 여기에 적어 두고 콘솔 전체가 읽는다
 * (`widgets/admin-layout/ui/AdminLayout.tsx` 의 안내, `app/providers.tsx` 의 401 처리).
 *
 * **판정은 실제 응답에서만 나온다.** 켜고 끄는 플래그가 아니라 로그인 때 받은 상태 코드의 기록이다.
 * 시크릿이 들어오면 다음 로그인이 200 을 받아 이 기록이 지워지고, 안내도 같이 사라진다 — 코드를
 * 고칠 일이 없다.
 *
 * `sessionStorage` 에 두는 이유는 토큰과 수명을 맞추기 위해서다(`./accessToken.ts`). 새로고침에는
 * 남고 탭을 닫으면 토큰과 함께 사라진다. 메모리에만 두면 새로고침한 순간 안내가 사라져서, 데이터가
 * 없는 이유를 다시 알 수 없게 된다.
 */
const STORAGE_KEY = 'ogonggo.admin.tokenUnverified';

/**
 * 콘솔 전체에 띄우는 안내. 계정을 고치러 가지 않도록 "권한" 이나 "로그인" 이라는 말을 쓰지 않는다.
 */
export const ADMIN_TOKEN_UNVERIFIED_MESSAGE =
  '관리자 서버가 로그인 토큰을 확인하지 못했습니다(401). 목록과 집계가 비어 있는 것은 이 때문이며 계정 문제가 아닙니다. 서버에 인증 설정이 반영되면 화면은 그대로 다시 채워집니다.';

export function isAdminTokenUnverified(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function setAdminTokenUnverified(unverified: boolean): void {
  if (unverified) {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    return;
  }
  sessionStorage.removeItem(STORAGE_KEY);
}
