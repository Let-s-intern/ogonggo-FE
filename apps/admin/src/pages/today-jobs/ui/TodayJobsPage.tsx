import { useState } from 'react';
import {
  Button,
  Callout,
  DataTable,
  Modal,
  Pagination,
  cn,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminJobSummaryResponse, AdminTodayJobSummaryResponse } from '@ogonggo/api/src/admin';
import { useJobList } from '@/entities/content/api/useContent';
import { useTodayJobList } from '@/entities/today-job/api/useTodayJobs';
import { RecommendationFields } from '@/features/today-job/ui/RecommendationFields';
import { isRecommendationValid } from '@/features/today-job/lib/validate';
import { PageHeader } from '@/widgets/page-header';
import { SearchBox } from '@/widgets/list-toolbar';
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

/** 비교할 때 앞뒤 공백은 보지 않는다. 서버에는 공백을 뺀 값을 보낸다. */
const sameText = (a: string, b: string): boolean => a.trim() === b.trim();

/**
 * 서버에서 받은 목록(`baseline`)과 화면 상태(`rows`)가 얼마나 다른지 센다.
 *
 * 새로 든 행, 빠진 행, 문구가 바뀐 행을 한 건씩 세고, 남은 행들의 순서가 달라졌으면 한 건을
 * 더한다. 한 행을 옮기면 이웃한 행의 자리도 함께 바뀌므로 자리가 바뀐 행마다 세지 않는다.
 */
function countChanges(baseline: TodayJobRow[], rows: TodayJobRow[]): number {
  const baselineById = new Map(baseline.map((row) => [row.id, row]));
  const rowIds = new Set(rows.map((row) => row.id));

  let count = 0;
  for (const row of rows) {
    const before = baselineById.get(row.id);
    if (
      !before ||
      !sameText(before.recommendationTitle, row.recommendationTitle) ||
      !sameText(before.recommendationDescription, row.recommendationDescription)
    ) {
      count += 1;
    }
  }
  for (const before of baseline) {
    if (!rowIds.has(before.id)) {
      count += 1;
    }
  }

  const keptBefore = baseline.filter((row) => rowIds.has(row.id)).map((row) => row.id);
  const keptNow = rows.filter((row) => baselineById.has(row.id)).map((row) => row.id);
  if (keptBefore.some((id, index) => id !== keptNow[index])) {
    count += 1;
  }
  return count;
}

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
  // 서버 상태. 저장하지 않은 변경을 세는 기준이다.
  const [baseline] = useState<TodayJobRow[]>(() => serverJobs.map(toRow));
  const [rows, setRows] = useState<TodayJobRow[]>(() => serverJobs.map(toRow));
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const changeCount = countChanges(baseline, rows);
  const canSave =
    changeCount > 0 &&
    rows.every((row) =>
      isRecommendationValid({
        title: row.recommendationTitle,
        description: row.recommendationDescription,
      }),
    );

  const updateRecommendation = (id: number, title: string, description: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, recommendationTitle: title, recommendationDescription: description }
          : row,
      ),
    );
  };

  /** 한 칸 위(`-1`)나 아래(`1`)로 옮긴다. 끝에서는 옮기지 않는다. */
  const moveRow = (index: number, delta: -1 | 1) => {
    setRows((current) => {
      const target = index + delta;
      const moving = current[index];
      const neighbor = current[target];
      if (!moving || !neighbor) {
        return current;
      }
      const next = [...current];
      next[index] = neighbor;
      next[target] = moving;
      return next;
    });
  };

  /** 맨 끝에 붙인다. 문구는 비어 있어 저장하기 전에 채워야 한다. */
  const addRow = (job: AdminJobSummaryResponse) => {
    setRows((current) =>
      current.some((row) => row.id === job.id)
        ? current
        : [
            ...current,
            {
              id: job.id,
              title: job.title,
              companyName: job.companyName,
              visibility: job.visibility,
              recruitmentStatus: job.recruitmentStatus,
              recommendationTitle: '',
              recommendationDescription: '',
            },
          ],
    );
  };

  /** 화면 상태에서만 지운다. 서버는 저장할 때까지 그대로다. */
  const removeRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

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
      key: 'recommendation',
      header: '추천 문구',
      width: 'w-80',
      render: (row) => (
        <RecommendationFields
          idPrefix={`today-job-${row.id}`}
          value={{ title: row.recommendationTitle, description: row.recommendationDescription }}
          onChange={(next) => updateRecommendation(row.id, next.title, next.description)}
        />
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-28',
      render: (row) => <StatusBadges row={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-56',
      render: (row) => {
        const index = rows.indexOf(row);
        return (
          <span className="flex gap-1 whitespace-nowrap">
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.title} 위로`}
              disabled={index === 0}
              onClick={() => moveRow(index, -1)}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.title} 아래로`}
              disabled={index === rows.length - 1}
              onClick={() => moveRow(index, 1)}
            >
              아래로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.title} 빼기`}
              className="border-red-200 text-error hover:bg-red-50"
              onClick={() => removeRow(row.id)}
            >
              빼기
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="오늘의 공고"
        action={
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-sm',
                changeCount > 0 ? 'font-medium text-orange-600' : 'text-gray-500',
              )}
            >
              저장하지 않은 변경 {changeCount}건
            </span>
            <Button size="sm" variant="secondary" onClick={() => setIsPickerOpen(true)}>
              공고 추가
            </Button>
            <Button size="sm" disabled={!canSave}>
              저장
            </Button>
          </div>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyMessage="선택한 공고가 없습니다."
      />
      <JobPickerModal
        open={isPickerOpen}
        selectedIds={new Set(rows.map((row) => row.id))}
        onAdd={addRow}
        onClose={() => setIsPickerOpen(false)}
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

interface JobPickerModalProps {
  open: boolean;
  /** 이미 표에 든 공고. 다시 고를 수 없다. */
  selectedIds: Set<number>;
  onAdd: (job: AdminJobSummaryResponse) => void;
  onClose: () => void;
}

/**
 * 노출 중인 공고를 검색해 표에 더한다.
 *
 * 고르고도 닫지 않는다. 여러 건을 연달아 고르는 자리라 한 건마다 열고 닫게 하면 번거롭다.
 *
 * 안쪽은 열려 있을 때만 그린다. 닫혀 있는 동안 공고 목록을 부르지 않고, 다시 열면 검색어와
 * 페이지가 처음으로 돌아온다.
 */
function JobPickerModal({ open, selectedIds, onAdd, onClose }: JobPickerModalProps) {
  return (
    <Modal
      open={open}
      title="공고 추가"
      description="노출 중인 공고를 검색해 고릅니다. 고른 공고는 표 맨 끝에 붙습니다."
      onClose={onClose}
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      {open ? <JobPicker selectedIds={selectedIds} onAdd={onAdd} onClose={onClose} /> : null}
    </Modal>
  );
}

function JobPicker({ selectedIds, onAdd, onClose }: Omit<JobPickerModalProps, 'open'>) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useJobList({
    page,
    keyword,
    visibility: 'VISIBLE',
    source: '',
    reviewStatus: '',
    recruitmentStatus: '',
    sort: 'REGISTERED_AT',
  });

  const columns: DataTableColumn<AdminJobSummaryResponse>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'select',
      header: '선택',
      width: 'w-24',
      render: (row) => {
        const isSelected = selectedIds.has(row.id);
        return (
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${row.title} ${isSelected ? '선택됨' : '추가'}`}
            disabled={isSelected}
            onClick={() => onAdd(row)}
          >
            {isSelected ? '선택됨' : '추가'}
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <div className="pb-3">
        <SearchBox
          value={keyword}
          onSubmit={(next) => {
            setKeyword(next);
            setPage(1);
          }}
          placeholder="제목·회사 검색"
        />
      </div>

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <div className="max-h-[50vh] overflow-y-auto rounded-lg">
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(row) => row.id}
              isLoading={isPending}
              emptyMessage="조건에 맞는 공고가 없습니다."
            />
          </div>
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </>
  );
}
