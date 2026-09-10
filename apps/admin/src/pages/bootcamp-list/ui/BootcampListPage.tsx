import { useNavigate } from 'react-router';
import { Callout, DataTable, Pagination, Select, Toggle, type DataTableColumn } from '@ogonggo/ui';
import type { AdminBootcampSummary } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { useBootcampList, usePatchBootcamp } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  RECRUITMENT_STATUS_OPTIONS,
  RecruitmentStatusBadge,
  CONTENT_SORT_OPTIONS,
  CONTENT_SOURCE_OPTIONS,
  ContentSourceBadge,
  JOB_REVIEW_STATUS_OPTIONS,
  JobReviewStatusBadge,
  VISIBILITY_OPTIONS,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 부트캠프 목록.
 *
 * **칸과 필터를 채용공고와 같게 둔다.** 비즈니스 회원은 부트캠프도 올리므로 노출·등록 경로·검수
 * 상태가 똑같이 있다. 한쪽에만 칸을 빼 두면 같은 일을 하러 두 화면을 오갈 때 조작이 달라진다.
 *
 * 모집 상태(`BootcampStatus`)만 채용공고에 없는 칸이다. 노출 여부와 다른 것이라 함께 둔다 —
 * 모집이 끝난 과정을 지면에 남겨 둘 수도, 모집 중인데 내릴 수도 있다.
 */
export function BootcampListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    recruitmentStatus: get('recruitmentStatus'),
    visibility: get('visibility'),
    source: get('source'),
    reviewStatus: get('reviewStatus'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useBootcampList(filters);

  const columns: DataTableColumn<AdminBootcampSummary>[] = [
    { key: 'title', header: '과정명', render: (row) => row.title },
    { key: 'companyName', header: '운영사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-32',
      render: (row) => <VisibilityToggle bootcamp={row} />,
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
      key: 'recruitmentStatus',
      header: '모집 상태',
      width: 'w-28',
      render: (row) => <RecruitmentStatusBadge value={row.recruitmentStatus} />,
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
          options={RECRUITMENT_STATUS_OPTIONS}
          value={filters.recruitmentStatus}
          onChange={(event) => setFilter('recruitmentStatus', event.target.value)}
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

/**
 * 목록에서 바로 노출을 끄고 켠다. 채용공고 목록의 같은 컴포넌트와 동작이 같다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 토글을 누르는 순간 화면이
 * 넘어간다.
 */
function VisibilityToggle({ bootcamp }: { bootcamp: AdminBootcampSummary }) {
  const patchMutation = usePatchBootcamp(bootcamp.id);
  const visible = bootcamp.visibility === 'VISIBLE';

  return (
    // 라벨이 줄바꿈되면 행 높이가 들쭉날쭉해진다.
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={visible}
        disabled={patchMutation.isPending}
        label={visible ? '노출' : '비노출'}
        onChange={(next) => patchMutation.mutate({ visibility: next ? 'VISIBLE' : 'HIDDEN' })}
      />
    </span>
  );
}
