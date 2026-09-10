import { useNavigate } from 'react-router';
import { Badge, Callout, DataTable, Pagination, Select, type DataTableColumn } from '@ogonggo/ui';
import type { AdminSideStudy } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { useSideStudyList } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  CONTENT_SORT_OPTIONS,
  SIDE_STUDY_KIND_OPTIONS,
  sideStudyKindLabel,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 사이드·스터디 목록.
 *
 * 백엔드 도메인이 아직 없다(`ogonggo-core` 의 `StudyPackage.kt` 는 주석 하나뿐이다). 이 화면이
 * 어떤 칸을 요구하는지가 그 도메인의 칸을 정한다 — 프론트 주도 개발에서 순서가 뒤집힌 자리다
 * (PRD "콘텐츠 · 사이드·스터디").
 */
export function SideStudyListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    kind: get('kind'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useSideStudyList(filters);

  const columns: DataTableColumn<AdminSideStudy>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    {
      key: 'kind',
      header: '종류',
      width: 'w-36',
      render: (row) => <Badge tone="neutral">{sideStudyKindLabel(row.kind)}</Badge>,
    },
    { key: 'author', header: '모집장', width: 'w-32', render: (row) => row.authorNickname },
    {
      key: 'applied',
      header: '모집',
      align: 'right',
      width: 'w-24',
      render: (row) => `${row.appliedCount}/${row.capacity}`,
    },
    {
      key: 'closed',
      header: '상태',
      width: 'w-24',
      render: (row) => (
        <Badge tone={row.closed ? 'neutral' : 'success'}>{row.closed ? '마감' : '모집 중'}</Badge>
      ),
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
      <PageHeader title="사이드·스터디" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·모집장 검색"
        />
        <Select
          options={SIDE_STUDY_KIND_OPTIONS}
          value={filters.kind}
          onChange={(event) => setFilter('kind', event.target.value)}
          aria-label="종류"
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
            onRowClick={(row) => navigate(`/content/side-studies/${row.id}`)}
            isLoading={isPending}
            emptyMessage="조건에 맞는 글이 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
