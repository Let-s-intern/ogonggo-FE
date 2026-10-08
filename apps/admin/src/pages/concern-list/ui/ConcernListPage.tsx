import { useNavigate } from 'react-router';
import {
  Badge,
  Callout,
  DataTable,
  Pagination,
  Select,
  Toggle,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminConcernSummaryResponse as AdminConcern } from '@ogonggo/api/src/admin';
import {
  listAllIds,
  useChangeVisibilities,
  useConcernList,
} from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { BulkVisibilityBar, selectionColumn, useRowSelection } from '@/widgets/bulk-visibility';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  CONCERN_CATEGORY_OPTIONS,
  CONTENT_SORT_OPTIONS,
  VISIBILITY_OPTIONS,
  concernCategoryLabel,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 취준고민 고민글 목록(`GET /api/v1/admin/concerns`).
 *
 * 사이드·스터디 목록과 같은 조작을 둔다 — 검색, 노출·카테고리 필터, 행마다 노출 토글, 고른 행의
 * 노출 일괄 변경. 숨긴 글은 사용자 화면에서 없는 글과 같다.
 */
export function ConcernListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    visibility: get('visibility'),
    category: get('category'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useConcernList(filters);
  const selection = useRowSelection(
    (data?.items ?? []).map((row) => row.id),
    JSON.stringify({ ...filters, page: undefined }),
  );

  const columns: DataTableColumn<AdminConcern>[] = [
    selectionColumn<AdminConcern>(selection),
    { key: 'title', header: '제목', render: (row) => row.title },
    {
      key: 'category',
      header: '카테고리',
      width: 'w-32',
      render: (row) => <Badge tone="neutral">{concernCategoryLabel(row.category)}</Badge>,
    },
    {
      key: 'author',
      header: '작성자',
      width: 'w-32',
      render: (row) => row.authorNickname ?? <span className="text-gray-400">프로필 없음</span>,
    },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-32',
      render: (row) => <VisibilityToggle concern={row} />,
    },
    {
      key: 'official',
      header: '공식 답변',
      width: 'w-24',
      render: (row) =>
        row.hasOfficialComment ? (
          <Badge tone="main">있음</Badge>
        ) : (
          <span className="text-gray-400">없음</span>
        ),
    },
    {
      key: 'commentCount',
      header: '답변 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.commentCount),
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
      <PageHeader title="취준고민" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·작성자 검색"
        />
        <Select
          options={VISIBILITY_OPTIONS}
          value={filters.visibility}
          onChange={(event) => setFilter('visibility', event.target.value)}
          aria-label="노출 여부"
        />
        <Select
          options={CONCERN_CATEGORY_OPTIONS}
          value={filters.category}
          onChange={(event) => setFilter('category', event.target.value)}
          aria-label="카테고리"
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
          <BulkVisibilityBar
            kind="concerns"
            selection={selection}
            total={data?.pageInfo.totalElements ?? 0}
            loadAllIds={(limit) => listAllIds('concerns', filters, limit)}
          />
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/content/concerns/${row.id}`)}
            isLoading={isPending}
            emptyMessage="조건에 맞는 글이 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}

/**
 * 목록에서 바로 노출을 끄고 켠다. 건별 수정 API 가 없어 일괄 변경 API 에 id 하나를 실어 보낸다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 토글을 누르는 순간 화면이
 * 넘어간다.
 */
function VisibilityToggle({ concern }: { concern: AdminConcern }) {
  const mutation = useChangeVisibilities('concerns');
  const visible = concern.visibility === 'VISIBLE';

  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={visible}
        disabled={mutation.isPending}
        label={visible ? '노출' : '비노출'}
        onChange={(next) =>
          mutation.mutate({ ids: [concern.id], visibility: next ? 'VISIBLE' : 'HIDDEN' })
        }
      />
    </span>
  );
}
