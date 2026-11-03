import { fetchAdExposures } from '@/entities/advertisement/api/adExposureApi';
import { AdJobRow } from '@/entities/advertisement/ui/AdJobRow';
import { MyApplications, type MyApplicationsQuery } from '@/widgets/my-applications';

export type MyApplicationsPageProps = MyApplicationsQuery;

/**
 * `/mypage/applications` 본문(PRD 3 절). 바깥 껍데기(사이드바·로그인 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 *
 * 맨 위에 지원일정 대시보드 광고 고정(`my_dashboard_scrap`, 1슬롯)을 둔다. 광고가 없으면 접힌다.
 */
export async function MyApplicationsPage(query: MyApplicationsPageProps) {
  const [dashboardAd] = await fetchAdExposures('MY_DASHBOARD_SCRAP');

  return (
    <div className="flex flex-col gap-6">
      <AdJobRow ad={dashboardAd} />
      <MyApplications query={query} />
    </div>
  );
}
