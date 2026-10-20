import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Callout, DataTable, Pagination, Select, Toggle, type DataTableColumn } from '@ogonggo/ui';
import type { AdminJobSummaryResponse as AdminJobSummary } from '@ogonggo/api/src/admin';
import {
  listAllIds,
  useJobIdLookup,
  useJobList,
  usePatchJob,
} from '@/entities/content/api/useContent';
import { useReplaceTodayJobs, useTodayJobList } from '@/entities/today-job/api/useTodayJobs';
import { PageHeader } from '@/widgets/page-header';
import { BulkVisibilityBar, selectionColumn, useRowSelection } from '@/widgets/bulk-visibility';
import { UtmBasketBar, UtmLinksButton, useUtmBasket } from '@/widgets/utm-links';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import {
  CONTENT_SORT_OPTIONS,
  CONTENT_SOURCE_OPTIONS,
  ContentSourceBadge,
  JOB_REVIEW_STATUS_OPTIONS,
  JobReviewStatusBadge,
  JOB_RECRUITMENT_STATUS_OPTIONS,
  RecruitmentStatusBadge,
  VISIBILITY_OPTIONS,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';
import { PickToggle, type PickNotice } from './PickToggle';

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
    recruitmentStatus: get('recruitmentStatus'),
    sort: get('sort', 'REGISTERED_AT'),
  };

  const { data, isPending, isError } = useJobList(filters);
  // 목록 API 의 검색어는 제목·회사명만 맞춘다. 숫자만 적었으면 그 번호의 공고도 따로 찾는다.
  const idLookup = useJobIdLookup(filters.keyword);
  // 찾은 공고는 1쪽 맨 위에 붙인다. 총 건수와 쪽 계산은 목록 응답 그대로 두고, 노출·검수 같은
  // 필터를 화면에서 흉내 내지 않는다 — 번호로 찾은 공고는 필터와 무관하게 보인다.
  const foundJob = page === 1 ? idLookup.job : undefined;
  const items = data?.items ?? [];
  const rows = foundJob ? [foundJob, ...items.filter((row) => row.id !== foundJob.id)] : items;
  // 목록 결과에 없던 공고. 일괄 선택은 목록 결과(총 건수와 검색 결과 전체)를 기준으로 하므로 이
  // 행은 선택 칸을 비운다. 노출은 행의 토글로 바꾼다.
  const extraJobId = foundJob && !items.some((row) => row.id === foundJob.id) ? foundJob.id : null;
  // 채용공고 목록 응답에는 PICK 여부가 없다. 오늘의 공고를 따로 받아 id 로 맞춘다.
  const todayJobs = useTodayJobList();
  const pickedIds = new Set((todayJobs.data ?? []).map((job) => job.id));
  // 오늘의 공고를 한 번도 받지 못했으면 켜졌는지 꺼졌는지를 모른다.
  const isPickUnknown = todayJobs.data === undefined;
  const replaceMutation = useReplaceTodayJobs();
  // 한 건만 더하고 빼는 API 가 없어 요청마다 목록을 통째로 받고 보낸다. 요청이 오가는 동안은 어느
  // 행이든 PICK 을 못 바꾸게 한다. 두 요청이 겹치면 먼저 보낸 변경을 나중 것이 덮어쓴다.
  const isPickLocked = isPickUnknown || todayJobs.isFetching || replaceMutation.isPending;
  const [pickNotice, setPickNotice] = useState<PickNotice | null>(null);
  // 검색 결과 전체를 고른 것은 페이지를 넘겨도 남고 필터가 바뀌면 풀린다.
  const selection = useRowSelection(
    items.map((row) => row.id),
    JSON.stringify({ ...filters, page: undefined }),
  );
  // 검색을 바꿔도 남는, UTM 링크용으로 담아 둔 공고.
  const utmBasket = useUtmBasket();
  const checkboxColumn = selectionColumn<AdminJobSummary>(selection);

  const columns: DataTableColumn<AdminJobSummary>[] = [
    {
      ...checkboxColumn,
      render: (row) =>
        row.id === extraJobId ? (
          <span className="text-gray-400">-</span>
        ) : (
          checkboxColumn.render(row)
        ),
    },
    {
      key: 'title',
      header: '제목',
      render: (row) => (
        <>
          {row.title}
          {row.id === foundJob?.id ? (
            <span className="block pt-1 text-xs text-gray-500">공고 번호로 찾은 공고입니다.</span>
          ) : null}
        </>
      ),
    },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-32',
      render: (row) => <VisibilityToggle job={row} />,
    },
    {
      key: 'pick',
      header: 'PICK',
      width: 'w-24',
      render: (row) => (
        <PickToggle
          job={row}
          picked={pickedIds.has(row.id)}
          disabled={isPickLocked}
          replace={replaceMutation.mutateAsync}
          onNotice={setPickNotice}
        />
      ),
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
      render: (row) => (
        <RecruitmentStatusBadge enumName="JobRecruitmentStatus" value={row.recruitmentStatus} />
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
      <PageHeader title="채용공고" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·회사·공고 번호 검색"
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
          options={JOB_RECRUITMENT_STATUS_OPTIONS}
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

      {isPickUnknown && todayJobs.isError ? (
        <Callout tone="warning" className="mb-4">
          오공고 PICK을 불러오지 못해 PICK 칸을 바꿀 수 없습니다. 나머지 목록은 그대로 쓸 수
          있습니다.
        </Callout>
      ) : null}

      {pickNotice ? (
        <Callout tone={pickNotice.tone} className="mb-4">
          {pickNotice.message}
        </Callout>
      ) : null}

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <UtmBasketBar kind="jobs" basket={utmBasket} />
          <BulkVisibilityBar
            kind="jobs"
            selection={selection}
            total={data?.pageInfo.totalElements ?? 0}
            loadAllIds={(limit) => listAllIds('jobs', filters, limit)}
            actions={
              <UtmLinksButton
                kind="jobs"
                postings={rows.filter((row) => selection.selected.has(row.id))}
                allMatching={selection.allMatching}
                basket={utmBasket}
              />
            }
          />
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/content/jobs/${row.id}`)}
            isLoading={isPending || (page === 1 && idLookup.isLookingUp)}
            emptyMessage="조건에 맞는 채용공고가 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}

/**
 * 목록에서 바로 노출을 끄고 켠다.
 *
 * 상세로 들어가 고치고 나오는 것이 노출 하나 때문이라면 왕복이 아깝다. 지면에서 급히 내려야
 * 할 때가 그런 경우다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세로 가는 링크라 멈추지 않으면 토글을 누르는 순간 화면이
 * 넘어간다.
 */
function VisibilityToggle({ job }: { job: AdminJobSummary }) {
  const patchMutation = usePatchJob(job.id);
  const visible = job.visibility === 'VISIBLE';

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
