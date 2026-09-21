import { CompanyPosts, type CompanyPostsQuery } from '@/widgets/company-posts';

export type CompanyPostsPageProps = CompanyPostsQuery;

/**
 * `/mypage/company/posts` 본문(v5 PRD 2 절). 바깥 껍데기(사이드바·로그인 가드·역할 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 */
export function CompanyPostsPage(query: CompanyPostsPageProps) {
  return <CompanyPosts query={query} />;
}
