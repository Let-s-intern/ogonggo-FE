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
import type { AdminRecruitmentPostSummaryResponse as AdminSideStudy } from '@ogonggo/api/src/admin';
import {
  listAllIds,
  useChangeVisibilities,
  useSideStudyList,
} from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { BulkVisibilityBar, selectionColumn, useRowSelection } from '@/widgets/bulk-visibility';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  CONTENT_SORT_OPTIONS,
  RECRUITMENT_STATUS_OPTIONS,
  RecruitmentStatusBadge,
  SIDE_STUDY_KIND_OPTIONS,
  VISIBILITY_OPTIONS,
  recruitmentPositionLabel,
  sideStudyKindLabel,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 사이드·스터디 목록(`GET /api/v1/admin/recruitment-posts`).
 *
 * 채용공고 목록과 같은 조작을 둔다 — 검색, 노출 필터, 행마다 노출 토글, 고른 행의 노출 일괄 변경.
 * 상세는 아직 백엔드가 없어 목에서만 열린다.
 */
export function SideStudyListPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    keyword: get('keyword'),
    visibility: get('visibility'),
    recruitmentType: get('recruitmentType'),
    recruitmentStatus: get('recruitmentStatus'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useSideStudyList(filters);
  const selection = useRowSelection(
    (data?.items ?? []).map((row) => row.id),
    JSON.stringify({ ...filters, page: undefined }),
  );

  const columns: DataTableColumn<AdminSideStudy>[] = [
    selectionColumn<AdminSideStudy>(selection),
    { key: 'title', header: '제목', render: (row) => row.title },
    {
      key: 'recruitmentType',
      header: '종류',
      width: 'w-36',
      render: (row) => <Badge tone="neutral">{sideStudyKindLabel(row.recruitmentType)}</Badge>,
    },
    {
      key: 'positions',
      header: '모집 직무',
      width: 'w-44',
      render: (row) =>
        row.positions.length > 0 ? (
          row.positions.map(recruitmentPositionLabel).join(' · ')
        ) : (
          <span className="text-gray-400">없음</span>
        ),
    },
    {
      key: 'author',
      header: '모집장',
      width: 'w-32',
      render: (row) => row.authorNickname ?? <span className="text-gray-400">프로필 없음</span>,
    },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-32',
      render: (row) => <VisibilityToggle post={row} />,
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
      <PageHeader title="사이드·스터디" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·모집장 검색"
        />
        <Select
          options={VISIBILITY_OPTIONS}
          value={filters.visibility}
          onChange={(event) => setFilter('visibility', event.target.value)}
          aria-label="노출 여부"
        />
        <Select
          options={SIDE_STUDY_KIND_OPTIONS}
          value={filters.recruitmentType}
          onChange={(event) => setFilter('recruitmentType', event.target.value)}
          aria-label="종류"
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
          <BulkVisibilityBar
            kind="side-studies"
            selection={selection}
            total={data?.pageInfo.totalElements ?? 0}
            loadAllIds={(limit) => listAllIds('side-studies', filters, limit)}
          />
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

/**
 * 목록에서 바로 노출을 끄고 켠다. 건별 수정 API 가 없어 일괄 변경 API 에 id 하나를 실어 보낸다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 토글을 누르는 순간 화면이
 * 넘어간다.
 */
function VisibilityToggle({ post }: { post: AdminSideStudy }) {
  const mutation = useChangeVisibilities('side-studies');
  const visible = post.visibility === 'VISIBLE';

  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={visible}
        disabled={mutation.isPending}
        label={visible ? '노출' : '비노출'}
        onChange={(next) =>
          mutation.mutate({ ids: [post.id], visibility: next ? 'VISIBLE' : 'HIDDEN' })
        }
      />
    </span>
  );
}
