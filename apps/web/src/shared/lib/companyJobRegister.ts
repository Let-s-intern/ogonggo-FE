import type { MyAccountResponseRole } from '@ogonggo/api';

/** 기업 회원이 채용공고를 등록하는 화면(v5 PRD 3 절). */
export const COMPANY_JOB_REGISTER_HREF = '/mypage/company/posts/jobs/new';

/**
 * 기업 회원 로그인. 로그인하면 공고 등록 화면으로 간다(`redirect`). 기업 계정이 없는 사람은
 * 이 화면의 `회원가입` 으로 기업 회원가입에 닿는다.
 */
export const COMPANY_SIGN_IN_FOR_REGISTER_HREF = `/login?tab=company&redirect=${encodeURIComponent(
  COMPANY_JOB_REGISTER_HREF,
)}`;

/**
 * `공고 등록` 계열 버튼이 갈 곳. 공고를 등록하려면 기업 계정이 있어야 하므로, 기업 회원이면
 * 등록 폼으로 바로 보내고 그 밖에는(로그아웃, 일반 회원, 역할을 아직 모름) 기업 회원 로그인으로
 * 보낸다. 헤더의 `공고 등록` 과 `ForBusinessBanner` 의 `무료로 공고 등록하기` 가 같은 규칙이다
 * (2026-09-21, 전에는 헤더만 기업 회원가입으로 보냈다).
 *
 * 일반 회원으로 로그인한 채 와도 로그인 화면이 기업 탭을 그대로 보인다
 * (`views/login/ui/LoginPage.tsx`).
 */
export function companyJobRegisterHref(role: MyAccountResponseRole | undefined): string {
  return role === 'COMPANY' ? COMPANY_JOB_REGISTER_HREF : COMPANY_SIGN_IN_FOR_REGISTER_HREF;
}
