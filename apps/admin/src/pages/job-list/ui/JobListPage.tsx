import { useNavigate } from 'react-router';
import { Callout, DataTable, Pagination, Select, type DataTableColumn } from '@ogonggo/ui';
import type { AdminJobSummary } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { useJobList } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  CONTENT_SORT_OPTIONS,
  CONTENT_SOURCE_OPTIONS,
  ContentSourceBadge,
  JOB_REVIEW_STATUS_OPTIONS,
  JobReviewStatusBadge,
  VISIBILITY_OPTIONS,
  VisibilityBadge,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 채용공고 목록.
 *
 * 읽기 전용이다. 강제 숨김은 운영자가 쿼리로 걸고 이 화면은 그 결과를 상태 뱃지로 보여준다
 * (PRD "하지 않는 것").
 *
 * 검수 상태 필터가 대시보드의 "검수 대기" 카드가 링크로 걸어 오는 자리다.
 */
export function JobListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    visibility: get('visibility'),
    source: get('source'),
    reviewStatus: get('reviewStatus'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useJobList(filters);

  const columns: DataTableColumn<AdminJobSummary>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-24',
      render: (row) => <VisibilityBadge value={row.visibility} />,
    },
    {
      key: 'source',
      header: '등록 경로',
      width: 'w-32',
      render: (row) => <ContentSourceBadge value={row.source} />,
    },
    {
      key: 'reviewStatus',
      header: '검수',
      width: 'w-28',
      render: (row) => <JobReviewStatusBadge value={row.reviewStatus} />,
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
      <PageHeader title="채용공고" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·회사 검색"
        />
        <Select
          options={VISIBILITY_OPTIONS}
          value={filters.visibility}
          onChange={(event) => setFilter('visibility', event.target.value)}
          aria-label="노출 여부"
        />
        <Select
          options={CONTENT_SOURCE_OPTIONS}
          value={filters.source}
          onChange={(event) => setFilter('source', event.target.value)}
          aria-label="등록 경로"
        />
        <Select
          options={JOB_REVIEW_STATUS_OPTIONS}
          value={filters.reviewStatus}
          onChange={(event) => setFilter('reviewStatus', event.target.value)}
          aria-label="검수 상태"
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
            onRowClick={(row) => navigate(`/content/jobs/${row.id}`)}
            isLoading={isPending}
            emptyMessage="조건에 맞는 채용공고가 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
