import type { MouseEvent } from 'react';
import type { MyAccountResponseRole } from '@ogonggo/api';
import { bizUrl, onBizLinkClick } from '@/shared/api/bizHandoff';

/** 기업 회원이 채용공고를 등록하는 화면(v5 PRD 3 절). 웹과 biz 가 같은 경로를 쓴다. */
export const COMPANY_JOB_REGISTER_HREF = '/mypage/company/posts/jobs/new';

export interface CompanyJobRegisterLink {
  href: string;
  /** 기업 회원만 있다. 웹 로그인을 들고 biz 로 간다(`goToBiz`). */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * `공고 등록` 계열 버튼이 갈 곳. 비즈 오공고(biz)로 보낸다(이슈 #649). 헤더의 `공고 등록`, 모바일 메뉴의
 * `공고 등록하기`, `ForBusinessBanner` 의 `무료로 공고 등록하기` 가 같은 규칙이다.
 *
 * - 기업 회원: biz 등록 폼. 로그인을 들고 가서 다시 로그인하지 않는다.
 * - 그 밖(로그아웃, 일반 회원, 역할을 아직 모름): biz 로그인. 로그인하면 등록 폼으로 간다(`redirect`). 기업
 *   계정이 없는 사람은 그 화면의 `회원가입` 으로 간다. 일반 회원의 토큰은 넘기지 않는다 — biz 는 기업 회원
 *   전용이다.
 */
export function companyJobRegisterLink(
  role: MyAccountResponseRole | undefined,
  before?: () => void,
): CompanyJobRegisterLink {
  if (role === 'COMPANY') {
    return {
      href: bizUrl(COMPANY_JOB_REGISTER_HREF),
      onClick: onBizLinkClick(COMPANY_JOB_REGISTER_HREF, before),
    };
  }
  return {
    href: bizUrl(`/login?redirect=${encodeURIComponent(COMPANY_JOB_REGISTER_HREF)}`),
    onClick: before,
  };
}
