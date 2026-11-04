import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Callout, Card, CardTitle, Chip, EmptyState, cn } from '@ogonggo/ui';
import {
  type NewJob,
  useNewJobDetail,
  useNewJobQueue,
  usePrefetchNewJobDetail,
} from '@/entities/new-job/api/useNewJobQueue';
import { ContentSourceBadge, VisibilityBadge } from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';
import { PageHeader } from '@/widgets/page-header';
import { AnalysisPane } from './AnalysisPane';
import { SourcePane } from './SourcePane';

type Filter = 'uninspected' | 'inspected' | 'hidden' | 'all';

const FILTERS: { value: Filter; label: string; matches: (job: NewJob) => boolean }[] = [
  { value: 'uninspected', label: '미검수', matches: (job) => !job.inspectedAt },
  { value: 'inspected', label: '검수 완료', matches: (job) => Boolean(job.inspectedAt) },
  { value: 'hidden', label: '비노출', matches: (job) => job.visibility === 'HIDDEN' },
  { value: 'all', label: '전체', matches: () => true },
];

/** `2026-11-04` -> `11월 4일`. */
const monthDay = (date: string) => {
  const [, month, day] = date.split('-').map(Number);
  return `${month}월 ${day}일`;
};

/**
 * 오늘 올라온 공고 검수(LC-3567). 가장 최근 수집 묶음의 크롤러·고용24 공고를 한 건씩 넘기며, 왼쪽에 우리가 만든 값,
 * 오른쪽에 원문을 나란히 놓고 본다.
 *
 * 공고는 이미 게시돼 있다. 검수 대기(`pages/review-queue`)와 달리 사전 승인이 아니라 사후 확인이고, 판정을 모으지
 * 않고 누를 때마다 바로 저장한다(PRD 결정 필요 4). 조작은 검수 대기에서 옮겼다 — 한 건씩 보기, A/D 로 앞뒤,
 * 칸 안만 스크롤, 들어오자마자 키가 먹게 포커스 잡기, 마지막 동작 되돌리기.
 */
export function NewJobReviewPage() {
  const { data, isPending, isError } = useNewJobQueue();
  const prefetch = usePrefetchNewJobDetail();

  const [filter, setFilter] = useState<Filter>('uninspected');
  /**
   * 칩을 고른 순간의 목록. 검수 완료한 건이 `미검수` 에서 바로 빠지면 뒤 건이 당겨져 하나를 건너뛴다. 칩을 다시
   * 누를 때만 새로 거른다.
   */
  const [ids, setIds] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const byId = useMemo(() => new Map(items.map((job) => [job.id, job])), [items]);

  const applyFilter = useCallback(
    (next: Filter) => {
      const rule = FILTERS.find((entry) => entry.value === next)!;
      setFilter(next);
      setIds(items.filter(rule.matches).map((job) => job.id));
      setIndex(0);
    },
    [items],
  );

  // 처음 받았을 때 기본 칩으로 거른다.
  useEffect(() => {
    if (data && ids === null) {
      applyFilter(filter);
    }
  }, [data, ids, filter, applyFilter]);

  const list = useMemo(
    () => (ids ?? []).flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
    [ids, byId],
  );
  const current = list[index];
  const detail = useNewJobDetail(current?.id);

  // 다음 건을 미리 받는다.
  const nextId = list[index + 1]?.id;
  useEffect(() => {
    if (nextId !== undefined) {
      prefetch(nextId);
    }
  }, [nextId, prefetch]);

  // 다른 건으로 넘어가면 두 칸을 맨 위로 돌린다.
  useEffect(() => {
    analysisRef.current?.scrollTo({ top: 0 });
    sourceRef.current?.scrollTo({ top: 0 });
  }, [current?.id]);

  // 들어오자마자 키가 먹도록 화면에 포커스를 준다. 이유는 검수 대기와 같다.
  useEffect(() => {
    if (isPending || list.length === 0) {
      return;
    }
    const frame = requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [isPending, list.length]);

  const move = useCallback(
    (delta: number) =>
      setIndex((previous) => {
        const next = previous + delta;
        return next < 0 || next >= list.length ? previous : next;
      }),
    [list.length],
  );

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError) {
    return (
      <>
        <PageHeader title="오늘 올라온 공고" />
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      </>
    );
  }

  const counts = Object.fromEntries(
    FILTERS.map((entry) => [entry.value, items.filter(entry.matches).length]),
  ) as Record<Filter, number>;

  return (
    <div ref={rootRef} tabIndex={-1} className="outline-none">
      <PageHeader
        title="오늘 올라온 공고"
        action={
          data?.batchDate ? (
            <p className="text-sm text-gray-500">
              {monthDay(data.batchDate)} 수집분 · {items.length}건
            </p>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((entry) => (
            <Chip
              key={entry.value}
              tone={filter === entry.value ? 'blue' : 'gray'}
              aria-pressed={filter === entry.value}
              onClick={() => applyFilter(entry.value)}
            >
              {entry.label} {counts[entry.value]}
            </Chip>
          ))}
        </div>
        {list.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => move(-1)}
                disabled={index === 0}
                aria-label="이전 건"
                title="이전 건 (A)"
              >
                ← 이전
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => move(1)}
                disabled={index >= list.length - 1}
                aria-label="다음 건"
                title="다음 건 (D)"
              >
                다음 →
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {index + 1} / {list.length}
            </p>
          </div>
        ) : null}
      </div>

      {!data?.batchDate ? (
        <EmptyState
          title="수집된 공고가 없습니다"
          description="크롤러가 공고를 수집하면 가장 최근 수집일의 공고가 여기에 올라옵니다."
        />
      ) : !current ? (
        <EmptyState
          title={`${FILTERS.find((entry) => entry.value === filter)!.label} 공고가 없습니다`}
          description="다른 칩을 눌러 보세요. 크롤러와 고용24가 기준 수집일에 올린 공고만 봅니다. 비즈니스 회원 공고는 검수 대기에서 봅니다."
        />
      ) : (
        <>
          <Card className={cn(current.inspectedAt && 'border-green-500 ring-1 ring-green-100')}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <ContentSourceBadge value={current.source} />
                  <VisibilityBadge value={current.visibility} />
                  {current.inspectedAt ? <Badge tone="success">검수 완료</Badge> : null}
                  <span className="text-sm text-gray-500">{current.companyName}</span>
                  <span className="text-sm text-gray-400">공고 {current.id}</span>
                </div>
                <CardTitle className="break-words">{current.title}</CardTitle>
                <p className="pt-1 text-sm text-gray-500">
                  등록 {formatDateTime(current.registeredAt)}
                  {current.inspectedAt ? ` · 검수 완료 ${formatDateTime(current.inspectedAt)}` : ''}
                </p>
              </div>
            </div>
          </Card>

          {/*
            두 칸은 각자 스크롤한다. 본문 폭이 944px(비서 패널을 닫은 1280px 화면) 아래면 위아래로 쌓는다 — 비서
            패널을 열면 본문이 400px 줄어 화면 폭이 아니라 본문 폭으로 가른다.
          */}
          <div className="@container mt-4">
            <div className="grid gap-4 @min-[944px]:grid-cols-2">
              <Card className="min-w-0 p-0">
                <div
                  ref={analysisRef}
                  tabIndex={-1}
                  className="overflow-y-auto p-4 outline-none @min-[944px]:h-[calc(100vh-19rem)]"
                >
                  <h2 className="pb-4 text-base font-bold text-gray-900">공고 분석</h2>
                  {detail.data ? (
                    <AnalysisPane job={detail.data} />
                  ) : detail.isError ? (
                    <Callout tone="error">상세를 불러오지 못했습니다.</Callout>
                  ) : (
                    <p className="text-sm text-gray-500">불러오는 중입니다.</p>
                  )}
                </div>
              </Card>
              <Card className="min-w-0 @min-[944px]:h-[calc(100vh-19rem)]">
                {detail.data ? (
                  <SourcePane ref={sourceRef} job={detail.data} className="h-full" />
                ) : (
                  <p className="text-sm text-gray-500">불러오는 중입니다.</p>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
