import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ActionAlert,
  Button,
  Callout,
  Card,
  CardTitle,
  Checkbox,
  Chip,
  EmptyState,
} from '@ogonggo/ui';
import {
  type NewJob,
  useNewJobDetail,
  useNewJobQueue,
  usePrefetchNewJobDetail,
  useSetJobInspected,
  useSetJobVisibility,
} from '@/entities/new-job/api/useNewJobQueue';
import {
  requestAssistantQuestion,
  useAssistantBusy,
  useJobFillRequest,
} from '@/features/ai-assistant';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { ContentSourceBadge, VisibilityBadge } from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';
import { JobEditor } from '@/widgets/job-editor';
import { PageHeader } from '@/widgets/page-header';
import { useInlineJobEdit } from '../model/useInlineJobEdit';
import { AnalysisPane } from './AnalysisPane';
import { SourcePane } from './SourcePane';
import { useNewJobReviewShortcuts } from './useNewJobReviewShortcuts';

type Filter = 'uninspected' | 'inspected' | 'hidden' | 'all';

/** 되돌릴 수 있는 마지막 동작. 비노출은 노출로, 검수 완료 체크는 해제로 되돌린다. */
interface LastAction {
  kind: 'inspect' | 'hide';
  job: NewJob;
}

/** 한 번에 스크롤할 거리(px). 검수 대기와 같다. */
const SCROLL_STEP = 240;

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
 * 오늘 올라온 공고 검수(LC-3567). 오늘(KST) 등록된 크롤러·고용24 공고를 한 건씩 넘기며, 왼쪽에 우리가 만든 값,
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
  const [isEditing, setIsEditing] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState<{
    message: string;
    detail?: string;
    tone: 'success' | 'danger';
    nonce: number;
  } | null>(null);
  /** W/S 가 스크롤할 칸. 마우스가 마지막에 올라간 칸이다. */
  const scrollTargetRef = useRef<'analysis' | 'source'>('analysis');
  const setInspected = useSetJobInspected();
  const setVisibility = useSetJobVisibility();
  const isBusy = setInspected.isPending || setVisibility.isPending;

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
  /** 두 칸에서 그 자리에서 고치는 값(썸네일·분류·본문, 원문 칸 머리). */
  const inlineEdit = useInlineJobEdit(detail.data);
  const isAssistantBusy = useAssistantBusy();

  /*
   * 보고 있는 공고를 주소(`?job=`)에 적는다. AI 비서는 주소로 "이 공고" 를 알고(`api/assistant.ts` [대화]),
   * 수정 창 채우기(`fill_job_text`)가 이 화면을 떠나지 않아도 되는지 가른다. 읽지는 않는다 — 위치는 칩과 순서로 정한다.
   */
  const [, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (current) {
      setSearchParams({ job: String(current.id) }, { replace: true });
    }
  }, [current, setSearchParams]);

  // AI 비서가 이 공고의 수정 창을 채워 달라고 했다. 창을 열면 `JobEditor` 가 칸을 채운다. 저장은 하지 않는다.
  const fillRequest = useJobFillRequest(current?.id ?? null);
  useEffect(() => {
    if (fillRequest) {
      setIsEditing(true);
    }
  }, [fillRequest]);

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

  const focusRoot = useCallback(() => rootRef.current?.focus({ preventScroll: true }), []);

  const fail = useCallback((caught: unknown) => {
    setError(serverErrorMessage(caught) ?? '저장하지 못했습니다. 다시 시도해 주세요.');
  }, []);

  /**
   * 검수 완료 체크(2026-11-04 사용자: 검수 상태는 체크 표시 하나). 누르는 즉시 저장한다. 체크박스를 누르면 그 건에
   * 머물고, Space(`advance`)는 체크한 뒤 다음 건으로 간다. 이미 체크한 건에서 Space 는 요청 없이 다음 건으로만
   * 간다 — 연달아 누르며 훑다가 체크를 풀지 않게 한다. 해제는 체크박스로만 한다. 실패하면 그 건에 머문다.
   */
  const setChecked = useCallback(
    (checked: boolean, advance: boolean) => {
      if (!current || isBusy) {
        return;
      }
      focusRoot();
      if (checked === Boolean(current.inspectedAt)) {
        if (advance) {
          move(1);
        }
        return;
      }
      const job = current;
      setError('');
      setInspected.mutate(
        { jobId: job.id, inspected: checked },
        {
          onSuccess: () => {
            setLastAction(checked ? { kind: 'inspect', job } : null);
            if (advance) {
              // 다음 건으로 넘어가 체크 표시가 화면에서 사라지므로 무엇을 체크했는지 알린다.
              setAlert({
                message: '검수 완료로 체크했습니다.',
                detail: job.title,
                tone: 'success',
                nonce: Date.now(),
              });
              move(1);
            }
          },
          onError: fail,
        },
      );
    },
    [current, isBusy, focusRoot, move, setInspected, fail],
  );

  /** 비노출이면 다음 건으로 가고, 다시 노출이면 그 건에 머문다(고친 뒤 되살리는 경우다). */
  const toggleHidden = useCallback(() => {
    if (!current || isBusy) {
      return;
    }
    focusRoot();
    const job = current;
    const hiding = job.visibility !== 'HIDDEN';
    setError('');
    setVisibility.mutate(
      { jobId: job.id, visibility: hiding ? 'HIDDEN' : 'VISIBLE' },
      {
        onSuccess: () => {
          setAlert({
            message: hiding ? '비노출로 바꿨습니다.' : '다시 노출했습니다.',
            detail: job.title,
            tone: hiding ? 'danger' : 'success',
            nonce: Date.now(),
          });
          if (hiding) {
            setLastAction({ kind: 'hide', job });
            move(1);
          } else {
            setLastAction(null);
          }
        },
        onError: fail,
      },
    );
  }, [current, isBusy, focusRoot, move, setVisibility, fail]);

  const undo = useCallback(() => {
    if (!lastAction || isBusy) {
      return;
    }
    const { kind, job } = lastAction;
    const position = list.findIndex((entry) => entry.id === job.id);
    const onSuccess = () => {
      setLastAction(null);
      if (position >= 0) {
        setIndex(position);
      }
    };
    setError('');
    if (kind === 'inspect') {
      setInspected.mutate({ jobId: job.id, inspected: false }, { onSuccess, onError: fail });
    } else {
      setVisibility.mutate({ jobId: job.id, visibility: 'VISIBLE' }, { onSuccess, onError: fail });
    }
    focusRoot();
  }, [lastAction, isBusy, list, setInspected, setVisibility, fail, focusRoot]);

  const scrollBy = useCallback((amount: number) => {
    const target = scrollTargetRef.current === 'source' ? sourceRef : analysisRef;
    target.current?.scrollBy({ top: amount, behavior: 'auto' });
  }, []);

  const handlers = useMemo(
    () => ({
      scrollUp: () => scrollBy(-SCROLL_STEP),
      scrollDown: () => scrollBy(SCROLL_STEP),
      previous: () => move(-1),
      next: () => move(1),
      inspect: () => setChecked(true, true),
      toggleHidden,
      edit: () => setIsEditing(Boolean(detail.data)),
    }),
    [scrollBy, move, setChecked, toggleHidden, detail.data],
  );

  useNewJobReviewShortcuts({ enabled: !isEditing && current !== undefined, handlers });

  // 건을 옮기면 앞 건의 오류는 지운다.
  useEffect(() => setError(''), [current?.id]);

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
      {alert ? (
        <ActionAlert
          message={alert.message}
          detail={alert.detail}
          tone={alert.tone}
          nonce={alert.nonce}
          onDismiss={() => setAlert(null)}
        />
      ) : null}

      <PageHeader
        title="오늘 올라온 공고"
        action={
          data ? (
            <p className="text-sm text-gray-500">
              오늘({monthDay(data.date)}) · {items.length}건
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
          <div className="flex min-w-0 items-center gap-3">
            {lastAction ? (
              <button
                type="button"
                className="max-w-md truncate text-sm text-blue-600 underline"
                onClick={undo}
              >
                방금 {lastAction.kind === 'inspect' ? '검수 완료 체크' : '비노출'}한 「
                {lastAction.job.title}」 되돌리기
              </button>
            ) : null}
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

      {error ? (
        <Callout tone="error" className="mb-3">
          {error}
        </Callout>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="오늘 올라온 공고가 없습니다"
          description="크롤러와 고용24가 오늘 등록한 공고가 여기에 올라옵니다. 전날 공고는 자정이 지나면 빠집니다."
        />
      ) : !current ? (
        <EmptyState
          title={`${FILTERS.find((entry) => entry.value === filter)!.label} 공고가 없습니다`}
          description="다른 칩을 눌러 보세요. 크롤러와 고용24가 오늘 올린 공고만 봅니다. 비즈니스 회원 공고는 검수 대기에서 봅니다."
        />
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <ContentSourceBadge value={current.source} />
                  <VisibilityBadge value={current.visibility} />
                  <span className="text-sm text-gray-500">
                    {detail.data?.companyName ?? current.companyName}
                  </span>
                  <span className="text-sm text-gray-400">공고 {current.id}</span>
                </div>
                <CardTitle className="break-words">{detail.data?.title ?? current.title}</CardTitle>
                <p className="pt-1 text-sm text-gray-500">
                  등록 {formatDateTime(current.registeredAt)}
                  {current.inspectedAt ? ` · 검수 완료 ${formatDateTime(current.inspectedAt)}` : ''}
                </p>
              </div>

              {/* 키보드가 주 조작이지만 버튼도 둔다. 키 이름은 `title` 로 남긴다. */}
              <div className="flex shrink-0 items-center gap-2">
                {/*
                  누르는 즉시 저장하는 체크박스라 AI 비서가 칸 채우기로 누르지 않게 막는다(`data-ai-human-only`,
                  `features/ai-assistant/model/screen.ts`). 확정은 사람이 한다.
                */}
                <span data-ai-human-only title="검수 완료 체크 (Space 는 체크하고 다음 건)">
                  <Checkbox
                    checked={Boolean(current.inspectedAt)}
                    onChange={(checked) => setChecked(checked, false)}
                    disabled={isBusy}
                    label="검수 완료"
                    labelClassName="font-medium"
                  />
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  disabled={!detail.data}
                  title="내용 수정 (E)"
                >
                  내용 수정
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleHidden}
                  disabled={isBusy}
                  title={current.visibility === 'HIDDEN' ? '다시 노출 (H)' : '비노출 (H)'}
                >
                  {current.visibility === 'HIDDEN' ? '다시 노출' : '비노출'}
                </Button>
              </div>
            </div>
          </Card>

          {/*
            두 칸은 각자 스크롤한다. 본문 폭이 944px(비서 패널을 닫은 1280px 화면) 아래면 위아래로 쌓는다 — 비서
            패널을 열면 본문이 400px 줄어 화면 폭이 아니라 본문 폭으로 가른다.
          */}
          <div className="@container mt-4">
            <div className="grid gap-4 @min-[944px]:grid-cols-2">
              <Card
                className="min-w-0 p-0"
                onMouseEnter={() => (scrollTargetRef.current = 'analysis')}
              >
                <div
                  ref={analysisRef}
                  tabIndex={-1}
                  className="overflow-y-auto p-4 outline-none @min-[944px]:h-[calc(100vh-19rem)]"
                >
                  <h2 className="pb-4 text-base font-bold text-gray-900">공고 분석</h2>
                  {detail.data && inlineEdit ? (
                    <AnalysisPane job={detail.data} edit={inlineEdit} />
                  ) : detail.isError ? (
                    <Callout tone="error">상세를 불러오지 못했습니다.</Callout>
                  ) : (
                    <p className="text-sm text-gray-500">불러오는 중입니다.</p>
                  )}
                </div>
              </Card>
              <Card
                className="min-w-0 @min-[944px]:h-[calc(100vh-19rem)]"
                onMouseEnter={() => (scrollTargetRef.current = 'source')}
              >
                {detail.data ? (
                  <SourcePane
                    ref={sourceRef}
                    job={detail.data}
                    edit={inlineEdit ?? undefined}
                    className="h-full"
                    action={
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isAssistantBusy}
                        title={isAssistantBusy ? 'AI 비서가 답하는 중입니다' : undefined}
                        onClick={() => {
                          requestAssistantQuestion(`공고 ${current.id} 를 검수해줘`);
                          // 버튼에 포커스가 남으면 다음 Space 가 이 버튼을 다시 누른다.
                          focusRoot();
                        }}
                      >
                        AI 비서에게 검수 요청
                      </Button>
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-500">불러오는 중입니다.</p>
                )}
              </Card>
            </div>
          </div>

          {detail.data ? (
            <JobEditor
              open={isEditing}
              job={detail.data}
              onClose={() => {
                setIsEditing(false);
                focusRoot();
              }}
              onSaved={() =>
                setAlert({
                  message: '내용을 수정했습니다.',
                  // 본문을 고치면 백엔드가 분석을 다시 만든다. 검수 완료는 풀지 않는다(PRD 결정 필요 5).
                  detail: '본문을 고쳤다면 공고 분석은 다시 분석을 기다립니다.',
                  tone: 'success',
                  nonce: Date.now(),
                })
              }
            />
          ) : null}
        </>
      )}
    </div>
  );
}
