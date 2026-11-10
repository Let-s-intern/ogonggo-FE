import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Callout, DataTable, Pagination, Select, Toggle, type DataTableColumn } from '@ogonggo/ui';
import type { AdminJobSummaryResponse } from '@ogonggo/api/src/admin';
import {
  listAllIds,
  useJobIdLookup,
  useJobList,
  usePatchJob,
} from '@/entities/content/api/useContent';
import { useReplaceTodayJobs, useTodayJobList } from '@/entities/today-job/api/useTodayJobs';
import { JobPriorityToggle } from '@/features/priority-exposed';
import { ProxyRegisterButton } from '@/features/proxy-registration';
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
  ALL_FILTER_VALUE,
  withExplicitAll,
} from '@/shared/config/labels';
import { formatCount, formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';
import { JobReviewDialog } from './JobReviewDialog';
import { PickToggle, type PickNotice } from './PickToggle';

/** 목록 줄. 원문 주소(`sourceUrl`)는 백엔드 LC-3572 가 목록 응답에 싣는다. */
type AdminJobSummary = AdminJobSummaryResponse;

/**
 * 채용공고 목록.
 *
 * 읽기 전용이다. 강제 숨김은 운영자가 쿼리로 걸고 이 화면은 그 결과를 상태 뱃지로 보여준다
 * (PRD "하지 않는 것").
 *
 * 검수 상태 필터가 대시보드의 "검수 대기" 카드가 링크로 걸어 오는 자리다.
 *
 * 행을 누르면 오늘 올라온 공고와 같은 편집 창(`JobReviewDialog`)을 연다(2026-11-05 사용자). 연 공고는 주소의
 * `?edit=<id>` 에 적어 새로고침·뒤로 가기가 그대로 따른다. 상세 페이지는 창 안 링크로 간다.
 */
/**
 * 비즈니스 구역 목록(`/business/jobs`, `/business/bootcamps`)이 같은 화면을 쓸 때 넘긴다. 등록 경로를 비즈니스 등록으로
 * 묶고 그 필터를 숨긴다(2026-11-05 사용자: 비즈니스 등록 채용공고·부트캠프를 유저 쪽과 비슷하게 따로 본다).
 */
export interface ContentListScope {
  /** 고정할 등록 경로. 주면 등록 경로 필터가 사라진다. */
  fixedSource?: 'COMPANY';
  /** 화면 제목. 없으면 기본 제목. */
  title?: string;
}

export function JobListPage({ fixedSource, title }: ContentListScope = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { get, page, setFilter, setPage } = useListQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const editParam = Number(searchParams.get('edit'));
  const editId = Number.isInteger(editParam) && editParam > 0 ? editParam : null;

  const openEdit = (jobId: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('edit', String(jobId));
    // 이 화면에서 열었다는 표시. 닫을 때 기록을 하나 되돌려, 뒤로 가기가 닫힌 같은 목록을 한 번 더 밟지 않게 한다.
    setSearchParams(next, { state: { editOpenedHere: true } });
  };
  const closeEdit = () => {
    if ((location.state as { editOpenedHere?: boolean } | null)?.editOpenedHere) {
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  };

  // 비즈니스 구역은 모집 중인 공고만 기본으로 본다. `전체` 를 고르면 주소에 `ALL` 이 남는다(2026-11-06 사용자).
  const recruitmentStatusParam = get('recruitmentStatus', fixedSource ? 'RECRUITING' : '');

  const filters = {
    page,
    keyword: get('keyword'),
    visibility: get('visibility'),
    source: fixedSource ?? get('source'),
    reviewStatus: get('reviewStatus'),
    recruitmentStatus: recruitmentStatusParam === ALL_FILTER_VALUE ? '' : recruitmentStatusParam,
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
  // 고른 행과 검색 결과 전체는 페이지를 넘겨도 남고 필터가 바뀌면 풀린다.
  const selection = useRowSelection(items, JSON.stringify({ ...filters, page: undefined }));
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
      key: 'sourceUrl',
      header: '원문',
      width: 'w-16',
      render: (row) => <SourceLink url={row.sourceUrl} />,
    },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-32',
      render: (row) => <VisibilityToggle job={row} />,
    },
    // 비즈니스 구역 목록에서만 보인다. 기업회원 공고별 우선 노출(`features/priority-exposed`).
    ...(fixedSource === 'COMPANY'
      ? [
          {
            key: 'priorityExposed',
            header: '우선 노출',
            width: 'w-28',
            render: (row: AdminJobSummary) => <JobPriorityToggle job={row} />,
          },
        ]
      : []),
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
      render: (row) => (
        <ContentSourceBadge value={row.source} adminRegistered={row.adminRegistered} />
      ),
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
      <PageHeader
        title={title ?? '채용공고'}
        // 비즈니스 목록에서만 기업회원 대신 올린다(#594).
        action={fixedSource === 'COMPANY' ? <ProxyRegisterButton kind="jobs" /> : undefined}
      />

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
        {fixedSource ? null : (
          <Select
            options={CONTENT_SOURCE_OPTIONS}
            value={filters.source}
            onChange={(event) => setFilter('source', event.target.value)}
            aria-label="등록 경로"
          />
        )}
        <Select
          options={JOB_REVIEW_STATUS_OPTIONS}
          value={filters.reviewStatus}
          onChange={(event) => setFilter('reviewStatus', event.target.value)}
          aria-label="검수 상태"
        />
        <Select
          options={
            fixedSource
              ? withExplicitAll(JOB_RECRUITMENT_STATUS_OPTIONS)
              : JOB_RECRUITMENT_STATUS_OPTIONS
          }
          value={recruitmentStatusParam}
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
                postings={selection.selectedRows}
                allMatching={selection.allMatching}
                basket={utmBasket}
              />
            }
          />
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={(row) => openEdit(row.id)}
            isLoading={isPending || (page === 1 && idLookup.isLookingUp)}
            emptyMessage="조건에 맞는 채용공고가 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      {editId !== null ? <JobReviewDialog key={editId} jobId={editId} onClose={closeEdit} /> : null}
    </>
  );
}

/**
 * 목록에서 바로 노출을 끄고 켠다.
 *
 * 상세로 들어가 고치고 나오는 것이 노출 하나 때문이라면 왕복이 아깝다. 지면에서 급히 내려야
 * 할 때가 그런 경우다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 편집 창을 열어 멈추지 않으면 토글을 누르는 순간 창이
 * 뜬다.
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

/**
 * 원문 사이트로 가는 작은 아이콘 링크. 들어가지는지 눈으로 보고 같은 줄의 노출 토글로 바로 내리려는 것이다(2026-11-05
 * 사용자, 쿠팡 공고처럼 봇을 막는 사이트는 서버가 마감을 잡지 못한다). 처음에는 도메인 글자였다가 칸을 덜 차지하게
 * 아이콘으로 바꿨다(2026-11-05 사용자). 주소는 툴팁으로 보이고 읽기 프로그램에는 `원문 열기` 로 읽힌다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 편집 창을 연다. `http(s)` 주소가 아니면 링크를 걸지 않는다.
 */
function SourceLink({ url }: { url: string | undefined }) {
  if (!url || !/^https?:\/\//.test(url)) {
    return <span className="text-gray-400">-</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      aria-label="원문 열기"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex size-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600"
    >
      <span aria-hidden="true" className="icon-[lucide--external-link] block size-4" />
    </a>
  );
}
