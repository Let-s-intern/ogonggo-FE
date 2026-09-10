import { useNavigate } from 'react-router';
import { Callout, DataTable, Pagination, Select, type DataTableColumn } from '@ogonggo/ui';
import type { AdminBootcampSummary } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { useBootcampList } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  BOOTCAMP_STATUS_OPTIONS,
  BootcampStatusBadge,
  CONTENT_SORT_OPTIONS,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 부트캠프 목록.
 *
 * 채용공고와 칸 구성이 같지만 등록 경로와 검수 칸이 없다. 부트캠프는 크롤러만 넣고 비즈니스
 * 회원이 직접 올리지 않는다.
 */
export function BootcampListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    status: get('status'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useBootcampList(filters);

  const columns: DataTableColumn<AdminBootcampSummary>[] = [
    { key: 'title', header: '과정명', render: (row) => row.title },
    { key: 'companyName', header: '운영사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'status',
      header: '모집 상태',
      width: 'w-28',
      render: (row) => <BootcampStatusBadge value={row.status} />,
    },
    {
      key: 'viewCount',
      header: '조회 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.viewCount),
    },
    {
      key: 'registeredAt',
      header: '등록일',
      width: 'w-32',
      render: (row) => formatDate(row.registeredAt),
    },
  ];

  return (
    <>
      <PageHeader title="부트캠프" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="과정명·운영사 검색"
        />
        <Select
          options={BOOTCAMP_STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          aria-label="모집 상태"
        />
        <Select
          options={CONTENT_SORT_OPTIONS}
          value={filters.sort}
          onChange={(event) => setFilter('sort', event.target.value)}
          className="ml-auto"
          aria-label="정렬"
        />
      </ListToolbar>

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/content/bootcamps/${row.id}`)}
            isLoading={isPending}
            emptyMessage="조건에 맞는 부트캠프가 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
