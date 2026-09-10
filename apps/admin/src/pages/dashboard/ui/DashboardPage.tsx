import { Link } from 'react-router';
import { Card, CardTitle, StatTile } from '@ogonggo/ui';
import { useDashboardSummary } from '@/entities/dashboard';
import { ViewCountTrend } from '@/widgets/view-count-trend';

/**
 * 운영자가 로그인하면 처음 보는 화면.
 *
 * 숫자 카드는 누르면 그 조건이 이미 걸린 목록으로 간다(PRD "대시보드"). 카드를 보고 필터를
 * 손으로 다시 맞추게 하지 않는다. 목록 화면들이 아직 자리만 있어서 쿼리스트링은 지금 아무
 * 효과가 없지만, 링크에 먼저 실어 둔다 — 목록이 붙을 때 이 파라미터를 읽으면 된다.
 */
export function DashboardPage() {
  const { data, isPending, isError } = useDashboardSummary();

  return (
    <>
      <h1 className="pb-6 text-xl font-bold text-gray-900">대시보드</h1>

      {isError ? (
        <Card>
          <CardTitle>불러오지 못했습니다</CardTitle>
        </Card>
      ) : null}

      {isPending ? <p className="text-sm text-gray-500">불러오는 중입니다.</p> : null}

      {data ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/support/inquiries?status=unanswered" className="block">
              <StatTile
                label="미답변 문의"
                value={data.unansweredInquiryCount}
                unit="건"
                className="transition-colors hover:border-blue-300"
              />
            </Link>
            <Link to="/content/jobs?registeredOn=today" className="block">
              <StatTile
                label="오늘 등록된 콘텐츠"
                value={data.todayContentCount}
                unit="건"
                className="transition-colors hover:border-blue-300"
              />
            </Link>
            <Link to="/members/users?joinedWithinDays=7" className="block">
              <StatTile
                label="이번 주 신규 회원"
                value={data.weeklyNewMemberCount}
                unit="명"
                className="transition-colors hover:border-blue-300"
              />
            </Link>
          </div>

          <Card className="mt-6">
            <CardTitle>최근 7일 조회 수</CardTitle>
            <div className="pt-4">
              <ViewCountTrend points={data.viewCountTrend} />
            </div>
          </Card>
        </>
      ) : null}
    </>
  );
}
