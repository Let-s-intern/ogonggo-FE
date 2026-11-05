import { useSearchParams } from 'react-router';
import { Callout, DataTable, Pagination, Tabs, Toggle, type DataTableColumn } from '@ogonggo/ui';
import {
  enumLabel,
  type AdminBootcampSummaryResponse,
  type AdminJobSummaryResponse,
} from '@ogonggo/api/src/admin';
import {
  useBootcampList,
  useJobList,
  usePatchBootcamp,
  usePatchJob,
} from '@/entities/content/api/useContent';
import { RecruitmentStatusBadge } from '@/shared/config/labels';
import { formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 목록 줄. 공고별 우선 노출(`priorityExposed`)은 백엔드 LC-3573 이 목록·상세 응답에 더한다. 생성 타입에 아직 없어
 * 덧붙이고, 없으면 켬(백엔드 기본값)으로 읽는다. LC-3573 배포 뒤 코드젠으로 바꾼다.
 */
type JobRow = AdminJobSummaryResponse & { priorityExposed?: boolean };
type BootcampRow = AdminBootcampSummaryResponse & { priorityExposed?: boolean };

type PostingKind = 'jobs' | 'bootcamps';

const KIND_TABS = [
  { value: 'jobs', label: '채용공고' },
  { value: 'bootcamps', label: '부트캠프' },
] as const;

/**
 * 우선 노출 대상(기업회원이 올린 마감 전 공고)만 서버 필터로 받는다. 채용공고는 계산한 모집 상태
 * (`recruitmentStatus`), 부트캠프는 저장된 모집 상태(`status`)가 모집 중인 것이다. 부트캠프의 임시저장(`DRAFT`)은
 * 공개 목록에 나가지 않아 뺀다.
 */
const JOB_FILTERS = {
  keyword: '',
  visibility: '',
  source: 'COMPANY',
  reviewStatus: '',
  recruitmentStatus: 'RECRUITING',
  sort: 'REGISTERED_AT',
};

const BOOTCAMP_FILTERS = {
  keyword: '',
  status: 'RECRUITING',
  visibility: '',
  source: 'COMPANY',
  reviewStatus: '',
  sort: 'REGISTERED_AT',
};

/** 마감일. 상시 모집은 마감일이 없다. */
function deadlineOf(row: { recruitmentType: string; recruitmentEndAt?: string }) {
  if (row.recruitmentType === 'ALWAYS_OPEN') {
    return '상시';
  }
  return row.recruitmentEndAt ? formatDate(row.recruitmentEndAt) : '-';
}

export interface PriorityPostingListProps {
  /** 전체 스위치. 꺼져 있으면 공고별 값은 저장만 되고 공개 목록에 쓰이지 않는다. 모르면 `undefined`. */
  globalEnabled: boolean | undefined;
}

/**
 * 마감 전 기업회원 채용공고·부트캠프와 줄마다의 우선 노출 토글.
 *
 * 탭과 쪽은 주소(`?tab=`, `?page=`)에 둔다. 다른 목록 화면과 같다(`useListQuery`).
 *
 * 전체 스위치가 꺼져 있어도 토글은 막지 않는다. 미리 골라 두고 전체 스위치를 켜는 순서도 있어서다. 대신 지금은
 * 반영되지 않는다고 목록 위에 알린다.
 */
export function PriorityPostingList({ globalEnabled }: PriorityPostingListProps) {
  const [searchParams] = useSearchParams();
  const { page, setFilter } = useListQuery();
  const kind: PostingKind = searchParams.get('tab') === 'bootcamps' ? 'bootcamps' : 'jobs';

  return (
    <div className="flex flex-col gap-4 pt-4">
      {globalEnabled === false ? (
        <Callout tone="warning">
          전체 스위치가 꺼져 있어 공고별 설정은 지금 공개 목록에 반영되지 않아요. 바꾼 값은 저장되고
          전체 스위치를 켜면 그때부터 쓰여요.
        </Callout>
      ) : null}

      <Tabs
        items={KIND_TABS}
        value={kind}
        // 탭을 바꾸면 쪽을 1 로 되돌린다(`setFilter`). 채용공고 3쪽을 보다 부트캠프로 가면 빈 화면일 수 있다.
        onValueChange={(next) => setFilter('tab', next === 'jobs' ? '' : next)}
        aria-label="공고 종류"
      />

      {kind === 'jobs' ? <JobTable page={page} /> : <BootcampTable page={page} />}
    </div>
  );
}

function JobTable({ page }: { page: number }) {
  const { setPage } = useListQuery();
  const { data, isPending, isError } = useJobList({ ...JOB_FILTERS, page });

  const columns: DataTableColumn<JobRow>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'employmentType',
      header: '고용 형태',
      width: 'w-28',
      render: (row) => enumLabel('JobEmploymentType', row.employmentType),
    },
    { key: 'deadline', header: '마감일', width: 'w-32', render: deadlineOf },
    {
      key: 'recruitmentStatus',
      header: '모집 상태',
      width: 'w-28',
      render: (row) => (
        <RecruitmentStatusBadge enumName="JobRecruitmentStatus" value={row.recruitmentStatus} />
      ),
    },
    {
      key: 'priorityExposed',
      header: '우선 노출',
      width: 'w-32',
      render: (row) => <JobPriorityToggle job={row} />,
    },
  ];

  if (isError) {
    return <Callout tone="error">채용공고 목록을 불러오지 못했습니다.</Callout>;
  }
  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={isPending}
        emptyMessage="마감 전 기업회원 채용공고가 없습니다."
      />
      <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
    </>
  );
}

function BootcampTable({ page }: { page: number }) {
  const { setPage } = useListQuery();
  const { data, isPending, isError } = useBootcampList({ ...BOOTCAMP_FILTERS, page });

  const columns: DataTableColumn<BootcampRow>[] = [
    { key: 'title', header: '과정명', render: (row) => row.title },
    { key: 'companyName', header: '운영사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'operationType',
      header: '운영 방식',
      width: 'w-28',
      render: (row) => enumLabel('BootcampOperationType', row.operationType),
    },
    { key: 'deadline', header: '마감일', width: 'w-32', render: deadlineOf },
    {
      key: 'status',
      header: '모집 상태',
      width: 'w-28',
      render: (row) => (
        <RecruitmentStatusBadge enumName="BootcampRecruitmentStatus" value={row.status} />
      ),
    },
    {
      key: 'priorityExposed',
      header: '우선 노출',
      width: 'w-32',
      render: (row) => <BootcampPriorityToggle bootcamp={row} />,
    },
  ];

  if (isError) {
    return <Callout tone="error">부트캠프 목록을 불러오지 못했습니다.</Callout>;
  }
  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={isPending}
        emptyMessage="마감 전 기업회원 부트캠프가 없습니다."
      />
      <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
    </>
  );
}

/**
 * 켜짐은 서버 값에서 온다. 누른 순간 뒤집지 않고, 저장이 끝나 목록을 다시 받으면 뒤집힌다(`usePatchJob` 이
 * 목록을 무효화한다). 그래서 실패하면 이전 값에 남는다.
 */
function JobPriorityToggle({ job }: { job: JobRow }) {
  const patchMutation = usePatchJob(job.id);
  return (
    <PriorityToggle
      checked={job.priorityExposed ?? true}
      isPending={patchMutation.isPending}
      isError={patchMutation.isError}
      onChange={(next) => patchMutation.mutate({ priorityExposed: next })}
    />
  );
}

function BootcampPriorityToggle({ bootcamp }: { bootcamp: BootcampRow }) {
  const patchMutation = usePatchBootcamp(bootcamp.id);
  return (
    <PriorityToggle
      checked={bootcamp.priorityExposed ?? true}
      isPending={patchMutation.isPending}
      isError={patchMutation.isError}
      onChange={(next) => patchMutation.mutate({ priorityExposed: next })}
    />
  );
}

function PriorityToggle({
  checked,
  isPending,
  isError,
  onChange,
}: {
  checked: boolean;
  isPending: boolean;
  isError: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    // 라벨이 줄바꿈되면 행 높이가 들쭉날쭉해진다.
    <span className="whitespace-nowrap">
      <Toggle
        checked={checked}
        disabled={isPending}
        label={checked ? '켜짐' : '꺼짐'}
        onChange={onChange}
      />
      {isError ? (
        <span className="block pt-1 text-xs text-red-500">저장하지 못했습니다.</span>
      ) : null}
    </span>
  );
}
