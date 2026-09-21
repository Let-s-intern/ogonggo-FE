import { CompanyProfile } from '@/widgets/company-profile';

/**
 * `/mypage/company/profile` 본문(v5 PRD 5 절). 바깥 껍데기(사이드바·로그인 가드·역할 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 */
export function CompanyProfilePage() {
  return <CompanyProfile />;
}
