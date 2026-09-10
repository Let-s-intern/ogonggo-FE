import { Link } from 'react-router';
import { Callout, StatTile } from '@ogonggo/ui';
import { useDashboardSummary } from '@/entities/dashboard';

/**
 * 운영자가 로그인하면 처음 보는 화면 — **오늘 무엇을 해야 하는가의 요약판이다.**
 *
 * 숫자가 두 묶음으로 갈린다. 손을 대야 끝나는 일과, 손댈 것은 없지만 파이프라인이 도는지
 * 확인하는 유입이다. 한 줄에 섞으면 검수 대기 3건이 크롤링 40건 옆에서 같은 무게로 읽힌다.
 *
 * 모든 카드는 그 조건이 이미 걸린 목록으로 간다. 카드를 보고 필터를 손으로 다시 맞추게 하지
 * 않는다.
 */
export function DashboardPage() {
  const { data, isPending, isError } = useDashboardSummary();

  if (isError) {
    return (
      <>
        <h1 className="pb-6 text-xl font-bold text-gray-900">대시보드</h1>
        <Callout tone="error">불러오지 못했습니다.</Callout>
      </>
    );
  }

  if (isPending || !data) {
    return (
      <>
        <h1 className="pb-6 text-xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500">불러오는 중입니다.</p>
      </>
    );
  }

  const { todo, intake } = data;
  const remaining = todo.jobsPendingReview + todo.unansweredInquiries;

  return (
    <>
      <h1 className="pb-6 text-xl font-bold text-gray-900">대시보드</h1>

      <section className="pb-8">
        <div className="flex items-baseline justify-between pb-3">
          <h2 className="text-base font-bold text-gray-900">처리할 일</h2>
          <p className="text-sm text-gray-500">
            {remaining === 0 ? '남은 일이 없습니다.' : `모두 ${remaining}건`}
          </p>
        </div>

        {remaining === 0 ? (
          <Callout tone="success">검수 대기와 미답변 문의가 모두 처리됐습니다.</Callout>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <TileLink
              to="/content/jobs?reviewStatus=PENDING&source=COMPANY"
              label="검수 대기 공고"
              value={todo.jobsPendingReview}
              unit="건"
              urgent={todo.jobsPendingReview > 0}
            />
            <TileLink
              to="/support/inquiries?status=unanswered"
              label="미답변 문의"
              value={todo.unansweredInquiries}
              unit="건"
              urgent={todo.unansweredInquiries > 0}
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="pb-3 text-base font-bold text-gray-900">오늘 들어온 것</h2>
        <div className="grid grid-cols-4 gap-4">
          <TileLink
            to="/content/jobs?source=CRAWLER"
            label="크롤링 채용공고"
            value={intake.jobsCrawledToday}
            unit="건"
          />
          <TileLink
            to="/content/bootcamps"
            label="크롤링 부트캠프"
            value={intake.bootcampsCrawledToday}
            unit="건"
          />
          <TileLink
            to="/content/jobs?source=COMPANY"
            label="비즈니스 등록 공고"
            value={intake.jobsSubmittedToday}
            unit="건"
          />
          <TileLink
            to="/members/users?joinedWithinDays=7d"
            label="이번 주 신규 회원"
            value={intake.newMembersThisWeek}
            unit="명"
          />
        </div>
      </section>
    </>
  );
}

interface TileLinkProps {
  to: string;
  label: string;
  value: number;
  unit: string;
  /** 0 이 아닌 처리 대기 건수. 테두리로 눈에 띄게 한다. */
  urgent?: boolean;
}

/**
 * 누를 수 있는 숫자 카드.
 *
 * `StatTile` 자체를 링크로 만들지 않는다. `packages/ui` 는 Next 와 Vite 두 런타임에서 함께 쓰여
 * 라우터를 가정할 수 없어서, 링크는 쓰는 쪽이 감싼다.
 */
function TileLink({ to, label, value, unit, urgent = false }: TileLinkProps) {
  return (
    <Link to={to} className="block">
      <StatTile
        label={label}
        value={value}
        unit={unit}
        className={
          urgent
            ? 'border-orange-300 transition-colors hover:border-orange-400'
            : 'transition-colors hover:border-blue-300'
        }
      />
    </Link>
  );
}
