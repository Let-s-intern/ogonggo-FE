import { useNavigate } from 'react-router';
import { Callout, DataTable, Pagination, Select, type DataTableColumn } from '@ogonggo/ui';
import type { InquirySummary } from '@ogonggo/api/src/mocks/fixtures/admin-inquiry';
import { useInquiryList } from '@/entities/inquiry/api/useInquiries';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  INQUIRY_CATEGORY_OPTIONS,
  INQUIRY_STATUS_OPTIONS,
  InquiryStatusBadge,
  inquiryCategoryLabel,
} from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 문의 목록.
 *
 * 대시보드의 "미답변 문의" 카드가 `?status=unanswered` 로 링크해 온다. 그 값은 드롭다운에
 * 없는 값이라 목 핸들러가 접수+처리중으로 풀어 준다 — 드롭다운은 빈 값으로 보이지만 목록은
 * 걸러진 상태이므로, 그 사실을 화면에 적어 둔다.
 */
export function InquiryListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const status = get('status');
  const filters = { page, keyword: get('keyword'), status, category: get('category') };
  const { data, isPending, isError } = useInquiryList(filters);

  const columns: DataTableColumn<InquirySummary>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'authorName', header: '작성자', width: 'w-28', render: (row) => row.authorName },
    {
      key: 'category',
      header: '분류',
      width: 'w-28',
      render: (row) => inquiryCategoryLabel(row.category),
    },
    {
      key: 'status',
      header: '처리 상태',
      width: 'w-28',
      render: (row) => <InquiryStatusBadge value={row.status} />,
    },
    {
      key: 'createdAt',
      header: '접수일',
      width: 'w-44',
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <>
      <PageHeader title="문의" />

      {status === 'unanswered' ? (
        <Callout className="mb-4">
          미답변(접수·처리중)만 보고 있습니다. 처리 상태를 바꾸면 이 조건이 풀립니다.
        </Callout>
      ) : null}

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·작성자 검색"
        />
        <Select
          options={INQUIRY_STATUS_OPTIONS}
          value={status === 'unanswered' ? '' : status}
          onChange={(event) => setFilter('status', event.target.value)}
          aria-label="처리 상태"
        />
        <Select
          options={INQUIRY_CATEGORY_OPTIONS}
          value={filters.category}
          onChange={(event) => setFilter('category', event.target.value)}
          aria-label="분류"
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
            onRowClick={(row) => navigate(`/support/inquiries/${row.id}`)}
            isLoading={isPending}
            emptyMessage="조건에 맞는 문의가 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
