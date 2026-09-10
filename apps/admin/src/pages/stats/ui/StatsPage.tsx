import { Badge, Callout, DataTable, Pagination, Select, type DataTableColumn } from '@ogonggo/ui';
import { useContentMetrics, type ContentMetricRow } from '@/entities/stats/api/useContentMetrics';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar } from '@/widgets/list-toolbar';
import { formatCount, formatRate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'JOB', label: '채용공고' },
  { value: 'BOOTCAMP', label: '부트캠프' },
];

const PERIOD_OPTIONS = [
  { value: '', label: '전체 기간' },
  { value: '7', label: '최근 7일 등록' },
  { value: '30', label: '최근 30일 등록' },
  { value: '90', label: '최근 90일 등록' },
];

const SORT_OPTIONS = [
  { value: 'VIEW_COUNT', label: '조회순' },
  { value: 'CLICK_COUNT', label: '클릭순' },
  { value: 'CLICK_RATE', label: '클릭률순' },
];

/**
 * 통계. 지금은 콘텐츠별 조회·클릭 지표 한 표다.
 *
 * 하위 메뉴를 두지 않는다. 표가 하나뿐인데 "통계 > 콘텐츠 지표"로 한 단 더 들어가게 하면
 * 클릭만 늘고 얻는 것이 없다. 지면 지표가 붙을 때 그때 나눈다.
 *
 * 클릭률에 "로그인 사용자 기준"을 적는다. 백엔드 `JobSourceUrlClick` 이 `user_id` 를 필수 칸으로
 * 잡고 있어 비로그인 클릭이 기록되지 않는데, 조회 수는 로그인 여부와 무관하게 오른다. 그래서
 * 이 값은 실제보다 낮다 — 숨기지 않고 화면에 적는다(PRD "통계 · 콘텐츠 지표").
 *
 * 기간 필터도 조회가 일어난 시점이 아니라 등록일 기준이다. `JobMetric` 이 누적 조회 수만 들고
 * 있어 기간별 조회를 뽑을 원본이 없다.
 */
export function StatsPage() {
  const { get, page, setFilter, setPage } = useListQuery();

  const filters = {
    page,
    contentType: get('contentType'),
    registeredWithinDays: get('registeredWithinDays'),
    sort: get('sort', 'VIEW_COUNT'),
  };

  const { data, isPending, isError } = useContentMetrics(filters);

  const columns: DataTableColumn<ContentMetricRow>[] = [
    {
      key: 'contentType',
      header: '종류',
      width: 'w-28',
      render: (row) => (
        <Badge tone="neutral">{row.contentType === 'JOB' ? '채용공고' : '부트캠프'}</Badge>
      ),
    },
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'viewCount',
      header: '조회 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.viewCount),
    },
    {
      key: 'sourceClickCount',
      header: '클릭 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.sourceClickCount),
    },
    {
      key: 'clickRate',
      header: '클릭률',
      align: 'right',
      width: 'w-24',
      render: (row) => formatRate(row.sourceClickCount, row.viewCount),
    },
    {
      key: 'bookmarkCount',
      header: '북마크',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.bookmarkCount),
    },
  ];

  return (
    <>
      <PageHeader title="통계" />

      <Callout className="mb-4">
        클릭률은 로그인 사용자 기준입니다. 원문 이동 기록이 로그인 사용자만 남아 실제보다 낮게
        나옵니다. 기간 필터는 콘텐츠 등록일 기준입니다.
      </Callout>

      <ListToolbar>
        <Select
          options={CONTENT_TYPE_OPTIONS}
          value={filters.contentType}
          onChange={(event) => setFilter('contentType', event.target.value)}
          aria-label="콘텐츠 종류"
        />
        <Select
          options={PERIOD_OPTIONS}
          value={filters.registeredWithinDays}
          onChange={(event) => setFilter('registeredWithinDays', event.target.value)}
          aria-label="기간"
        />
        <Select
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(event) => setFilter('sort', event.target.value)}
          className="ml-auto"
          aria-label="정렬"
        />
      </ListToolbar>

      {isError ? (
        <Callout tone="error">지표를 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => `${row.contentType}-${row.id}`}
            isLoading={isPending}
            emptyMessage="조건에 맞는 콘텐츠가 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
