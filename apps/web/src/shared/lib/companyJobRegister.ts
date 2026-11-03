import type { MyAccountResponseRole } from '@ogonggo/api';
import { businessUrl } from '@/shared/config/business';

/** 기업 회원이 채용공고를 등록하는 화면(v5 PRD 3 절). */
export const COMPANY_JOB_REGISTER_HREF = '/mypage/company/posts/jobs/new';

/** 비즈니스 앱의 공고 작성 화면. 기업회원의 공고 작성은 비즈니스로 옮겨 간다(광고 시스템 PRD). */
const BUSINESS_JOB_REGISTER_PATH = '/mypage/company/posts/jobs/new';

/**
 * `공고 등록` 계열 버튼이 갈 곳. 공고를 등록하려면 기업 계정이 있어야 하므로, 기업 회원이면
 * 비즈니스 앱의 등록 폼으로 바로 보내고 그 밖에는(로그아웃, 일반 회원, 역할을 아직 모름) 비즈니스 앱의
 * 기업 로그인으로 보낸다. 로그인하면 등록 폼으로 돌아온다(`redirect`). 헤더의 `공고 등록` 과
 * `ForBusinessBanner` 의 `무료로 공고 등록하기` 가 같은 규칙이다.
 *
 * 비로그인·일반 회원의 목적지는 `.claude/tasks/memos/결정-광고시스템-web-헤더진입점-2026-11-03.md` 에 적었다.
 */
export function companyJobRegisterHref(role: MyAccountResponseRole | undefined): string {
  return role === 'COMPANY'
    ? businessUrl(BUSINESS_JOB_REGISTER_PATH)
    : businessUrl(`/login?redirect=${encodeURIComponent(BUSINESS_JOB_REGISTER_PATH)}`);
}
