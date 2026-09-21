import type { MyAccountResponseRole } from '@ogonggo/api';

/** 기업 회원이 채용공고를 등록하는 화면(v5 PRD 3 절). */
export const COMPANY_JOB_REGISTER_HREF = '/mypage/company/posts/jobs/new';

/**
 * `공고 등록` 계열 버튼이 갈 곳. 공고를 등록하려면 기업 계정이 있어야 하므로, 기업 회원이면
 * 등록 폼으로 바로 보내고 그 밖에는 부르는 쪽이 정한 자리로 보낸다.
 *
 * `fallback` 이 자리마다 다른 것은 맥락이 달라서다 — 헤더의 `공고 등록` 은 기업 회원가입,
 * `ForBusinessBanner` 의 `무료로 공고 등록하기` 는 기업 회원 로그인이다. 등록 화면 주소만
 * 여기 한 곳에 둔다.
 */
export function companyJobRegisterHref(
  role: MyAccountResponseRole | undefined,
  fallback: string,
): string {
  return role === 'COMPANY' ? COMPANY_JOB_REGISTER_HREF : fallback;
}
