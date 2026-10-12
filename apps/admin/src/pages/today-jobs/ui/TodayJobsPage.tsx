import { useEffect, useState } from 'react';
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
import { useReplaceTodayJobs, useTodayJobList } from '@/entities/today-job/api/useTodayJobs';
import { RecommendationFields } from '@/features/today-job/ui/RecommendationFields';
import { isRecommendationValid } from '@/features/today-job/lib/validate';
import { PageHeader } from '@/widgets/page-header';
import { SearchBox } from '@/widgets/list-toolbar';
import { RecruitmentStatusBadge, VisibilityBadge } from '@/shared/config/labels';

/**
 * 사용자 홈이 위에서부터 몇 건을 보여 주는가. 웹의 `TodayJobs` 가 앞 네 건만 쓴다
 * (`apps/web/src/widgets/today-jobs/ui/TodayJobs.tsx` 의 `TOP_COUNT`). 사용자용 API 가 숨긴
 * 공고를 먼저 빼므로 이 네 건은 표의 앞 네 행이 아니라 노출 중인 앞 네 건이다.
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
 * 사용자 홈의 네 건에 들지 못하는 노출 공고의 id.
 *
 * 비노출 공고는 세지 않고 담지도 않는다. 사용자용 API 가 먼저 빼고, 표에는 이미 비노출 배지가 있다.
 */
function idsBeyondUserView(rows: TodayJobRow[]): Set<number> {
  const ids = new Set<number>();
  let visibleBefore = 0;
  for (const row of rows) {
    if (row.visibility === 'HIDDEN') {
      continue;
    }
    if (visibleBefore >= USER_VISIBLE_COUNT) {
      ids.add(row.id);
    }
    visibleBefore += 1;
  }
  return ids;
}

/**
 * 서버에서 새로 받은 목록이 화면을 연 뒤(또는 마지막으로 맞춘 뒤)의 서버 상태와 같은지 본다.
 *
 * 순서와 문구가 같으면 같다. 노출·모집 상태는 다른 화면(채용공고 목록)에서도 바뀌는 값이고
 * 이 저장이 덮어쓰는 것이 아니라서 보지 않는다.
 */
function isSameList(server: AdminTodayJobSummaryResponse[], baseline: TodayJobRow[]): boolean {
  return (
    server.length === baseline.length &&
    server.every((job, index) => {
      const before = baseline[index];
      return (
        before !== undefined &&
        job.id === before.id &&
        job.recommendationTitle === before.recommendationTitle &&
        job.recommendationDescription === before.recommendationDescription
      );
    })
  );
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
  const { data, refetch } = useTodayJobList();
  const replaceMutation = useReplaceTodayJobs();

  // 서버 상태. 저장하지 않은 변경을 세고, 저장 직전에 다른 곳에서 바뀌었는지 보는 기준이다.
  const [baseline, setBaseline] = useState<TodayJobRow[]>(() => serverJobs.map(toRow));
  const [rows, setRows] = useState<TodayJobRow[]>(() => serverJobs.map(toRow));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  /** 저장 직전 목록 확인과 `새로 불러오기` 의 요청 중. */
  const [isChecking, setIsChecking] = useState(false);
  const [isConflict, setIsConflict] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** 저장이 끝났음을 화면에 남긴다. 다음 변경이나 저장 시도에서 사라진다. */
  const [isSaved, setIsSaved] = useState(false);

  const isSaving = isChecking || replaceMutation.isPending;

  const changeCount = countChanges(baseline, rows);
  const canSave =
    changeCount > 0 &&
    rows.every((row) =>
      isRecommendationValid({
        title: row.recommendationTitle,
        description: row.recommendationDescription,
      }),
    );

  // 고친 것이 없는 동안은 서버 목록이 바뀌면 따라간다. 다른 화면에서 돌아오면 캐시에 남은 예전
  // 목록이 먼저 그려지고 새 목록은 그 뒤에 도착한다. 이 상태가 처음 값만 들고 있으면 예전 목록을
  // 계속 보게 된다. 고치는 중이면 건드리지 않고 저장할 때 `isConflict` 로 알린다.
  useEffect(() => {
    if (!data || changeCount > 0) {
      return;
    }
    const fresh = data.map(toRow);
    if (JSON.stringify(fresh) !== JSON.stringify(baseline)) {
      setBaseline(fresh);
      setRows(fresh);
      setIsConflict(false);
    }
  }, [data, baseline, changeCount]);

  const updateRecommendation = (id: number, title: string, description: string) => {
    setIsSaved(false);
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, recommendationTitle: title, recommendationDescription: description }
          : row,
      ),
    );
  };

  /** 화면 상태와 비교 기준을 서버 목록으로 맞춘다. 고치던 내용은 사라진다. */
  const syncWithServer = (list: AdminTodayJobSummaryResponse[]) => {
    const next = list.map(toRow);
    setBaseline(next);
    setRows(next);
    setIsConflict(false);
  };

  /**
   * 저장한다. 먼저 목록을 다시 받아, 화면을 연 뒤에 서버 목록이 바뀌었으면 보내지 않고 알린다.
   *
   * 전체 교체 API 라 그대로 보내면 다른 운영자가 그 사이에 한 일을 덮어쓴다. 확인과 전송 사이의
   * 틈은 남는다 — 이 확인은 덮어쓰기 창을 줄일 뿐 막지는 못한다.
   */
  const save = async () => {
    setSaveError(null);
    setIsConflict(false);
    setIsSaved(false);
    setIsChecking(true);
    const latest = await refetch();
    setIsChecking(false);

    if (latest.isError || !latest.data) {
      setSaveError('저장하기 전에 최신 목록을 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
      return;
    }
    if (!isSameList(latest.data, baseline)) {
      setIsConflict(true);
      return;
    }

    // 서버에는 앞뒤 공백을 뺀 문구를 보낸다. 검증이 그 길이로 판정했다.
    const jobs = rows.map((row) => ({
      jobId: row.id,
      recommendationTitle: row.recommendationTitle.trim(),
      recommendationDescription: row.recommendationDescription.trim(),
    }));
    replaceMutation.mutate(
      { jobs },
      {
        onSuccess: async (changed) => {
          setIsSaved(true);
          // 저장 응답이 서버가 정한 값(공고의 현재 상태 포함)의 바뀐 목록이다. 훅이 쿼리 캐시도 이
          // 목록으로 맞춰 두었으므로, 이어지는 재조회가 실패해도 화면이 예전 목록으로 돌아가지 않는다.
          if (changed) {
            syncWithServer(changed);
            return;
          }
          await reload();
        },
        onError: () => {
          setSaveError(
            '저장하지 못했습니다. 고치던 내용은 그대로 두었습니다. 문구 길이와 공고를 확인한 뒤 다시 시도해 주세요.',
          );
        },
      },
    );
  };

  /** 서버 목록을 다시 받아 화면을 그것으로 바꾼다. */
  const reload = async () => {
    setSaveError(null);
    setIsChecking(true);
    const latest = await refetch();
    setIsChecking(false);
    if (latest.isError || !latest.data) {
      setSaveError('목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
      return;
    }
    syncWithServer(latest.data);
  };

  /** 한 칸 위(`-1`)나 아래(`1`)로 옮긴다. 끝에서는 옮기지 않는다. */
  const moveRow = (index: number, delta: -1 | 1) => {
    setIsSaved(false);
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
    setIsSaved(false);
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
    setIsSaved(false);
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const beyondUserView = idsBeyondUserView(rows);

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
          {beyondUserView.has(row.id) ? (
            <span className="block pt-1 text-xs text-orange-600">
              사용자 화면 네 건에 들지 않습니다.
            </span>
          ) : null}
        </>
      ),
    },
    { key: 'companyName', header: '회사', width: 'w-32', render: (row) => row.companyName },
    {
      key: 'recommendation',
      header: '추천 문구',
      width: 'w-72',
      render: (row) => (
        <RecommendationFields
          idPrefix={`today-job-${row.id}`}
          disabled={isSaving}
          value={{ title: row.recommendationTitle, description: row.recommendationDescription }}
          onChange={(next) => updateRecommendation(row.id, next.title, next.description)}
        />
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: (row) => <StatusBadges row={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-52',
      render: (row) => {
        const index = rows.indexOf(row);
        return (
          <span className="flex gap-1 whitespace-nowrap">
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.title} 위로`}
              disabled={isSaving || index === 0}
              onClick={() => moveRow(index, -1)}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.title} 아래로`}
              disabled={isSaving || index === rows.length - 1}
              onClick={() => moveRow(index, 1)}
            >
              아래로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.title} 빼기`}
              className="border-red-200 text-error hover:bg-red-50"
              disabled={isSaving}
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
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span
              className={cn(
                'text-sm',
                changeCount > 0 ? 'font-medium text-orange-600' : 'text-gray-500',
              )}
            >
              저장하지 않은 변경 {changeCount}건
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onClick={() => setIsPickerOpen(true)}
            >
              공고 추가
            </Button>
            <Button size="sm" disabled={!canSave || isSaving} onClick={() => void save()}>
              {isSaving ? '저장 중' : '저장'}
            </Button>
          </div>
        }
      />
      {isConflict ? (
        <Callout tone="warning" className="mb-4 flex items-center justify-between gap-4">
          <span>
            다른 곳에서 목록이 바뀌었습니다. 저장하지 않았습니다. 새로 불러오면 지금 고치고 있는
            내용은 사라집니다.
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            disabled={isSaving}
            onClick={() => void reload()}
          >
            새로 불러오기
          </Button>
        </Callout>
      ) : null}
      {saveError ? (
        <Callout tone="error" className="mb-4">
          {saveError}
        </Callout>
      ) : null}
      {isSaved ? (
        <Callout tone="success" className="mb-4">
          저장했습니다.
        </Callout>
      ) : null}
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

  const { data, isError } = useJobList({
    page,
    keyword,
    visibility: 'VISIBLE',
    source: '',
    reviewStatus: '',
    recruitmentStatus: '',
    sort: 'REGISTERED_AT',
  });

  // 쪽이나 검색어가 바뀌면 새 쿼리 키라 `data` 가 비는 동안이 생긴다. 그동안 표와 쪽 번호가
  // 사라지면 모달이 접혔다 펴지고 방금 누른 번호 버튼이 DOM 에서 빠져 초점을 잃는다. 마지막으로
  // 받은 목록을 들고 있다가 새 목록이 올 때까지 흐리게 둔다.
  const [shown, setShown] = useState(data);
  if (data && data !== shown) {
    setShown(data);
  }
  const isRefreshing = !data && shown !== undefined;

  const columns: DataTableColumn<AdminJobSummaryResponse>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'select',
      header: '선택',
      width: 'w-24',
      render: (row) => {
        const isSelected = selectedIds.has(row.id);
        // `disabled` 로 두면 누르는 즉시 초점을 잃어, 여러 건을 연달아 고를 때마다 모달 처음부터 다시
        // 탭해야 한다. 초점은 남기고 눌려도 아무 일 없게 한다.
        return (
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${row.title} ${isSelected ? '선택됨' : '추가'}`}
            aria-disabled={isSelected}
            className={cn(isSelected && 'cursor-not-allowed text-gray-400 hover:bg-transparent')}
            onClick={() => {
              if (!isSelected) {
                onAdd(row);
              }
            }}
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
          <div
            className={cn(
              'max-h-[50vh] overflow-y-auto rounded-lg transition-opacity',
              isRefreshing && 'opacity-50',
            )}
          >
            <DataTable
              columns={columns}
              rows={shown?.items ?? []}
              rowKey={(row) => row.id}
              isLoading={shown === undefined}
              emptyMessage="조건에 맞는 공고가 없습니다."
            />
          </div>
          <Pagination page={page} totalPages={shown?.pageInfo.totalPages ?? 1} onChange={setPage} />
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
