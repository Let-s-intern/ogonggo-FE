import { useState } from 'react';
import { Callout, DataTable, type DataTableColumn } from '@ogonggo/ui';
import type { AdminTodayJobSummaryResponse } from '@ogonggo/api/src/admin';
import { useTodayJobList } from '@/entities/today-job/api/useTodayJobs';
import { PageHeader } from '@/widgets/page-header';
import { RecruitmentStatusBadge, VisibilityBadge } from '@/shared/config/labels';

/**
 * 사용자 홈이 위에서부터 몇 건을 보여 주는가. 웹의 `TodayJobs` 가 앞 네 건만 쓴다
 * (`apps/web/src/widgets/today-jobs/ui/TodayJobs.tsx` 의 `TOP_COUNT`).
 */
const USER_VISIBLE_COUNT = 4;

/** 화면이 들고 있는 한 행. 서버 응답에서 이 화면이 쓰는 칸만 남긴다. */
type TodayJobRow = Pick<
  AdminTodayJobSummaryResponse,
  | 'id'
  | 'title'
  | 'companyName'
  | 'visibility'
  | 'recruitmentStatus'
  | 'recommendationTitle'
  | 'recommendationDescription'
>;

const toRow = (job: TodayJobRow): TodayJobRow => ({
  id: job.id,
  title: job.title,
  companyName: job.companyName,
  visibility: job.visibility,
  recruitmentStatus: job.recruitmentStatus,
  recommendationTitle: job.recommendationTitle,
  recommendationDescription: job.recommendationDescription,
});

/**
 * 오늘의 공고(사용자 홈의 오공고 PICK) 관리.
 *
 * 운영자가 홈에 나올 공고와 공고마다 붙는 추천 문구를 정한다.
 *
 * 편집 상태는 서버 목록을 한 번 받은 값에서 시작한다. 다시 받아 오는 쿼리가 화면 상태를 덮어쓰면
 * 고치던 문구가 사라지므로, 받아 온 뒤에 편집 화면을 그린다(`NoticeListPage` 의 `NoticeEditor` 와
 * 같은 이유다).
 */
export function TodayJobsPage() {
  const { data, isError } = useTodayJobList();

  if (data) {
    return <TodayJobsEditor serverJobs={data} />;
  }

  return (
    <>
      <PageHeader title="오늘의 공고" />
      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <p className="text-sm text-gray-500">불러오는 중입니다.</p>
      )}
    </>
  );
}

function TodayJobsEditor({ serverJobs }: { serverJobs: AdminTodayJobSummaryResponse[] }) {
  const [rows] = useState<TodayJobRow[]>(() => serverJobs.map(toRow));

  const columns: DataTableColumn<TodayJobRow>[] = [
    {
      key: 'order',
      header: '순서',
      width: 'w-16',
      render: (row) => rows.indexOf(row) + 1,
    },
    {
      key: 'title',
      header: '제목',
      render: (row) => (
        <>
          {row.title}
          {rows.indexOf(row) >= USER_VISIBLE_COUNT ? (
            <span className="block pt-1 text-xs text-orange-600">
              사용자 화면에는 나오지 않습니다.
            </span>
          ) : null}
        </>
      ),
    },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'recommendationTitle',
      header: '추천 제목',
      render: (row) => row.recommendationTitle,
    },
    {
      key: 'recommendationDescription',
      header: '추천 설명',
      render: (row) => row.recommendationDescription,
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-28',
      render: (row) => <StatusBadges row={row} />,
    },
  ];

  return (
    <>
      <PageHeader title="오늘의 공고" />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyMessage="선택한 공고가 없습니다."
      />
    </>
  );
}

/**
 * 사용자 화면에서 빠지거나 마감된 공고만 배지를 단다.
 *
 * 둘 다 해당하지 않는 보통의 행은 칸을 비우지 않고 `-` 를 둔다.
 */
function StatusBadges({ row }: { row: TodayJobRow }) {
  const isHidden = row.visibility === 'HIDDEN';
  const isClosed = row.recruitmentStatus === 'CLOSED';

  if (!isHidden && !isClosed) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {isHidden ? <VisibilityBadge value="HIDDEN" /> : null}
      {isClosed ? <RecruitmentStatusBadge value="CLOSED" /> : null}
    </span>
  );
}
