import { MyApplications, type MyApplicationsQuery } from '@/widgets/my-applications';

export type MyApplicationsPageProps = MyApplicationsQuery;

/**
 * `/mypage/applications` 본문(PRD 3 절). 바깥 껍데기(사이드바·로그인 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 */
export function MyApplicationsPage(query: MyApplicationsPageProps) {
  return <MyApplications query={query} />;
}
