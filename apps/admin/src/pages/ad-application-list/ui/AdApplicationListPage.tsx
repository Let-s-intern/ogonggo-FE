import { Link } from 'react-router';
import { Callout, Pagination, Select, type SelectOption } from '@ogonggo/ui';
import {
  AD_APPLICATION_STATUS_LABELS,
  useAdApplicationList,
  type AdApplicationSummary,
} from '@/entities/advertisement/api/useAdvertisements';
import { AdApplicationStatusBadge } from '@/entities/advertisement/ui/AdApplicationStatusBadge';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import { PageHeader } from '@/widgets/page-header';

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: '진행 단계 전체' },
  ...Object.entries(AD_APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

/**
 * 광고 신청 목록(PRD `어드민 > 구좌 세팅`). 광고 문의(`pages/ad-inquiry-list`)처럼 한 줄에 카드 하나이고, 카드를 누르면
 * 상세에서 신청 항목 묶음을 한 번에 확정·배치한다. 조건은 URL 쿼리에 있어 상세에서 돌아와도 남는다.
 */
export function AdApplicationListPage() {
  const { get, page, setPage, setFilter } = useListQuery();
  const filters = { page, status: get('status'), keyword: get('keyword') };
  const { data, isPending, isError } = useAdApplicationList(filters);
  const items = data?.items ?? [];

  return (
    <>
      <PageHeader title="광고 신청" />
      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="신청번호·기업명·공고명 검색"
        />
        <Select
          aria-label="진행 단계"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
        />
        {data ? (
          <span className="text-sm text-gray-500">
            {formatCount(data.pageInfo.totalElements)}건
          </span>
        ) : null}
      </ListToolbar>

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          {isPending ? (
            <p className="py-10 text-center text-sm text-gray-400">불러오는 중</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">조건에 맞는 신청이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((application) => (
                <li key={application.id}>
                  <AdApplicationCard application={application} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}

function AdApplicationCard({ application }: { application: AdApplicationSummary }) {
  return (
    <Link
      to={`/business/ad-applications/${application.id}`}
      className="block rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AdApplicationStatusBadge application={application} />
          <h2 className="text-lg font-bold text-gray-900">{application.companyName}</h2>
          <span className="text-sm text-gray-700">{application.postTitle}</span>
        </div>
        <time
          dateTime={application.receivedAt}
          className="shrink-0 text-sm whitespace-nowrap text-gray-500"
        >
          {formatDateTime(application.receivedAt)}
        </time>
      </div>
      <p className="mt-1 text-xs text-gray-500">{application.applicationNo}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {application.items.map((item) => (
          <li key={item.id} className="rounded-sm bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {item.placementName} · {formatDate(item.startDate)} ~ {formatDate(item.endDate)}
            {item.couponApplied ? ' · 쿠폰' : ''}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-gray-900">
        {formatCount(application.amount.total)}원
        <span className="text-gray-500"> · {application.paid ? '입금 확인됨' : '입금 전'}</span>
      </p>
      {application.rejection ? (
        <p className="mt-1 text-sm text-error">반려 사유 · {application.rejection.reason}</p>
      ) : null}
    </Link>
  );
}
