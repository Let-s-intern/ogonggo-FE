import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router';
import {
  ActionAlert,
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  EmptyState,
  Modal,
  Textarea,
} from '@ogonggo/ui';
import {
  useReviewQueue,
  useSaveReviewDecisions,
  type ReviewDecisionInput,
  type ReviewQueueItem,
} from '@/entities/review/api/useReviewQueue';
import { PageHeader } from '@/widgets/page-header';
import { formatDateTime } from '@/shared/lib/format';
import { useRejectFormShortcuts, useReviewShortcuts } from './useReviewShortcuts';

/** 한 번에 스크롤할 거리(px). 한 화면을 통째로 넘기지 않아 읽던 자리를 잃지 않는다. */
const SCROLL_STEP = 240;

interface Decision {
  item: ReviewQueueItem;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

const keyOf = (item: ReviewQueueItem) => `${item.type}:${item.id}`;

/**
 * 검수 대기 큐. 키보드로 한 건씩 넘기며 판정하고, 끝나면 한 번에 저장한다.
 *
 * 목록이 아니라 한 건씩 보여준다. 표에서 행을 열고 닫으며 수십 건을 처리하면 클릭이 건당
 * 네 번이고, 그 흐름으로는 밀린 큐가 줄지 않는다.
 *
 * 대상은 비즈니스 회원이 올린 채용공고와 부트캠프뿐이다. 크롤러 수집분은 우리가 고른
 * 사이트에서 긁어온 것이라 한 건씩 통과시킬 대상이 아니다.
 *
 * **판정은 화면에 모아 두고 마지막에 한 번 저장한다.** 키 하나로 통과되는 화면이라 오조작이
 * 실제로 일어나는데, 건마다 즉시 보내면 되돌리기도 왕복이 필요하고 그 사이 화면이 멈춘다.
 * 대신 저장 전에 창을 닫으면 판정이 날아가므로 그때 브라우저가 묻게 해 둔다.
 */
export function ReviewQueuePage() {
  const { data, isPending, isError } = useReviewQueue();
  const saveMutation = useSaveReviewDecisions();

  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map());
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [lastDecided, setLastDecided] = useState<Decision | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    detail?: string;
    tone: 'success' | 'danger';
    nonce: number;
  } | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const queue = useMemo(() => data ?? [], [data]);
  const current = queue[index];
  const currentDecision = current ? decisions.get(keyOf(current)) : undefined;
  const isSaved = saveMutation.isSuccess;
  const allDecided = queue.length > 0 && decisions.size === queue.length;

  // 다른 건으로 넘어가면 본문을 맨 위로 돌린다. 앞 건에서 아래까지 읽고 넘어왔는데 다음 건이
  // 중간부터 보이면 첫 문단을 놓친다.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [index]);

  /**
   * 들어오자마자 키가 먹도록 화면에 포커스를 준다.
   *
   * 주소로 바로 들어오거나 새로고침하면 포커스가 어디에도 없어서 첫 Space 가 아무 데도 가지
   * 않는다. 운영자는 "안 되는 화면"으로 읽고 마우스로 한 번 클릭한 뒤에야 쓰게 된다.
   *
   * 의존성이 `isPending` 인 이유는 로딩 중에는 이 요소가 아직 없기 때문이다. 빈 배열로 두면
   * 마운트 시점에 `rootRef.current` 가 null 이고, 데이터가 온 뒤로는 다시 돌지 않아 포커스가
   * 영영 잡히지 않는다.
   */
  useEffect(() => {
    if (!isPending) {
      rootRef.current?.focus({ preventScroll: true });
    }
  }, [isPending]);

  const hasUnsaved = decisions.size > 0 && !isSaved;

  /** 탭을 닫거나 새로고침할 때. 브라우저가 대신 묻는다. */
  useEffect(() => {
    if (!hasUnsaved) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  /**
   * 좌측 메뉴로 다른 화면에 갈 때.
   *
   * `beforeunload` 는 탭을 닫거나 새로고침할 때만 뜬다. 앱 안에서 라우트를 옮기는 것은
   * 브라우저가 보기에 이동이 아니라서, 이것이 없으면 열다섯 건을 판정하고 메뉴 하나를 눌렀을 때
   * 아무 말 없이 전부 사라진다.
   */
  const blocker = useBlocker(hasUnsaved);

  const move = useCallback(
    (delta: number) => {
      setIndex((previous) => {
        const next = previous + delta;
        return next < 0 || next >= queue.length ? previous : next;
      });
    },
    [queue.length],
  );

  /**
   * 즉시 스크롤한다. `behavior: 'smooth'` 로 두면 W/S 를 연달아 눌렀을 때 앞선 애니메이션이
   * 취소되면서 마지막 한 번만, 그것도 도중까지만 움직인다 — 세 번 눌러 5px 가 갔다.
   */
  const scrollBy = useCallback((amount: number) => {
    bodyRef.current?.scrollBy({ top: amount, behavior: 'auto' });
  }, []);

  const record = useCallback(
    (decision: 'APPROVED' | 'REJECTED', rejectReason?: string) => {
      if (!current) {
        return;
      }
      const entry: Decision = { item: current, decision, reason: rejectReason };
      setDecisions((previous) => new Map(previous).set(keyOf(current), entry));
      setLastDecided(entry);
      setAlert({
        message: decision === 'APPROVED' ? '허용되었습니다.' : '반려했습니다.',
        detail: current.title,
        tone: decision === 'APPROVED' ? 'success' : 'danger',
        nonce: Date.now(),
      });
      setIsRejecting(false);
      setReason('');
      move(1);
    },
    [current, move],
  );

  const approve = useCallback(() => record('APPROVED'), [record]);

  const openReject = useCallback(() => {
    if (current) {
      // 이미 반려한 건을 다시 열면 쓰던 사유가 그대로 있어야 한다.
      setReason(decisions.get(keyOf(current))?.reason ?? '');
      setIsRejecting(true);
    }
  }, [current, decisions]);

  const submitReject = useCallback(() => {
    const trimmed = reason.trim();
    if (trimmed.length > 0) {
      record('REJECTED', trimmed);
    }
  }, [record, reason]);

  const cancelReject = useCallback(() => {
    setIsRejecting(false);
    setReason('');
    // 모달이 닫히면 포커스를 화면으로 되돌린다. 안 그러면 단축키가 갈 곳을 잃는다.
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const undo = useCallback(() => {
    if (!lastDecided) {
      return;
    }
    setDecisions((previous) => {
      const next = new Map(previous);
      next.delete(keyOf(lastDecided.item));
      return next;
    });
    const position = queue.findIndex((entry) => keyOf(entry) === keyOf(lastDecided.item));
    if (position >= 0) {
      setIndex(position);
    }
    setLastDecided(null);
  }, [lastDecided, queue]);

  const handlers = useMemo(
    () => ({
      scrollUp: () => scrollBy(-SCROLL_STEP),
      scrollDown: () => scrollBy(SCROLL_STEP),
      previous: () => move(-1),
      next: () => move(1),
      approve,
      openReject,
    }),
    [scrollBy, move, approve, openReject],
  );

  useReviewShortcuts({ enabled: !isRejecting && !isSaved, handlers });
  useRejectFormShortcuts(reasonRef, { submit: submitReject, cancel: cancelReject });

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError) {
    return (
      <>
        <PageHeader title="검수 대기" />
        <Callout tone="error">큐를 불러오지 못했습니다.</Callout>
      </>
    );
  }

  if (isSaved) {
    return (
      <>
        <PageHeader title="검수 대기" />
        <EmptyState
          title={`${decisions.size}건을 저장했습니다`}
          description="새로 올라온 것이 있으면 다시 불러옵니다."
          action={
            <Button
              onClick={() => {
                saveMutation.reset();
                setDecisions(new Map());
                setLastDecided(null);
                setIndex(0);
              }}
            >
              큐 다시 불러오기
            </Button>
          }
        />
      </>
    );
  }

  if (queue.length === 0) {
    return (
      <>
        <PageHeader title="검수 대기" />
        <EmptyState
          title="검수할 것이 없습니다"
          description="비즈니스 회원이 올린 채용공고와 부트캠프가 들어오면 여기 쌓입니다."
        />
      </>
    );
  }

  return (
    // 포커스를 받기 위한 래퍼. `outline-none` 은 이 자리에 초점 테두리를 그릴 이유가 없어서다 —
    // 실제로 조작하는 것은 아래 버튼과 입력이고, 그것들은 각자 초점 표시를 갖는다.
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

      <PageHeader title="검수 대기" />

      <ShortcutLegend />

      <div className="flex items-center justify-between gap-4 pt-4 pb-3">
        <p className="text-sm text-gray-500">
          {index + 1} / {queue.length} · 판정 {decisions.size}건 · 남은{' '}
          {queue.length - decisions.size}건
        </p>
        {lastDecided ? (
          <button
            type="button"
            className="max-w-md truncate text-sm text-blue-600 underline"
            onClick={undo}
          >
            방금 {lastDecided.decision === 'APPROVED' ? '허용' : '반려'}한 「
            {lastDecided.item.title}」 되돌리기
          </button>
        ) : null}
      </div>

      {saveMutation.isError ? (
        <Callout tone="error" className="mb-3">
          저장하지 못했습니다. 판정은 그대로 있으니 다시 시도해 주세요.
        </Callout>
      ) : null}

      {current ? (
        <ReviewCard
          item={current}
          decision={currentDecision?.decision}
          bodyRef={bodyRef}
          onApprove={approve}
          onRejectOpen={openReject}
        />
      ) : null}

      {allDecided ? (
        <SaveBar
          count={decisions.size}
          isSaving={saveMutation.isPending}
          onSave={() => saveMutation.mutate(toInputs(decisions))}
        />
      ) : null}

      <Modal
        open={blocker.state === 'blocked'}
        title="저장하지 않은 판정이 있습니다"
        description={`${decisions.size}건을 판정했지만 아직 저장하지 않았습니다. 이 화면을 떠나면 사라집니다.`}
        onClose={() => blocker.reset?.()}
      >
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => blocker.proceed?.()}>
            버리고 나가기
          </Button>
          <Button onClick={() => blocker.reset?.()}>계속 검수하기</Button>
        </div>
      </Modal>

      <Modal
        open={isRejecting}
        title="반려 사유"
        description="올린 회원에게 전달됩니다. 무엇을 고쳐야 하는지 적어 주세요."
        onClose={cancelReject}
      >
        <Textarea
          ref={reasonRef}
          rows={5}
          autoFocus
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예) 급여 조건이 비어 있습니다. 채우고 다시 등록해 주세요."
        />
        <div className="flex items-center gap-2 pt-4">
          <Button onClick={submitReject} disabled={reason.trim().length === 0}>
            반려 (Ctrl+Enter)
          </Button>
          <Button variant="secondary" onClick={cancelReject}>
            취소 (Esc)
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function toInputs(decisions: Map<string, Decision>): ReviewDecisionInput[] {
  return [...decisions.values()].map((entry) => ({
    type: entry.item.type,
    id: entry.item.id,
    decision: entry.decision,
    reason: entry.reason,
  }));
}

/**
 * 전부 판정한 뒤에 뜨는 저장 줄. 화면 아래에 붙어 있어 스크롤 위치와 무관하게 보인다.
 *
 * 저장 전까지는 아무것도 서버로 가지 않는다. 그래서 문구로도 그 사실을 말한다 — "다 했다"와
 * "저장됐다"를 운영자가 헷갈리면 창을 그냥 닫는다.
 */
function SaveBar({
  count,
  isSaving,
  onSave,
}: {
  count: number;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-4 rounded-md border border-blue-200 bg-blue-00 px-4 py-3">
      <p className="text-sm text-gray-700">
        {count}건을 모두 판정했습니다.{' '}
        <span className="font-semibold">아직 저장되지 않았습니다.</span>
      </p>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? '저장 중' : '저장하기'}
      </Button>
    </div>
  );
}

const SHORTCUTS = [
  { keys: 'W / S', label: '본문 위·아래' },
  { keys: 'A / D', label: '이전·다음 건' },
  { keys: 'Space', label: '허용' },
  { keys: 'Backspace', label: '반려' },
  { keys: 'Ctrl+Enter', label: '반려 사유 제출' },
];

/** 단축키를 화면에 적어 둔다. 안 보이는 키보드 조작은 아무도 쓰지 않는다. */
function ShortcutLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-gray-200 bg-white px-4 py-3">
      {SHORTCUTS.map((shortcut) => (
        <span key={shortcut.keys} className="flex items-center gap-2 text-sm text-gray-600">
          <kbd className="rounded-xs border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-700">
            {shortcut.keys}
          </kbd>
          {shortcut.label}
        </span>
      ))}
    </div>
  );
}

interface ReviewCardProps {
  item: ReviewQueueItem;
  decision: 'APPROVED' | 'REJECTED' | undefined;
  bodyRef: React.RefObject<HTMLDivElement | null>;
  onApprove: () => void;
  onRejectOpen: () => void;
}

function ReviewCard({ item, decision, bodyRef, onApprove, onRejectOpen }: ReviewCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 pb-1">
            <Badge tone="neutral">{item.type === 'JOB' ? '채용공고' : '부트캠프'}</Badge>
            <span className="text-sm text-gray-500">{item.companyName}</span>
            {decision ? (
              <Badge tone={decision === 'APPROVED' ? 'success' : 'danger'}>
                {decision === 'APPROVED' ? '허용함' : '반려함'}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="break-words">{item.title}</CardTitle>
          <p className="pt-1 text-sm text-gray-500">등록 {formatDateTime(item.registeredAt)}</p>
        </div>

        {/* 키보드가 주 조작이지만 버튼도 둔다. 마우스로 오는 사람과, 단축키를 처음 보는 사람. */}
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={onApprove}>
            허용
          </Button>
          <Button size="sm" variant="secondary" onClick={onRejectOpen}>
            반려
          </Button>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 pt-4">
        {item.meta.map((entry) => (
          <div key={entry.label} className="flex gap-2 text-sm">
            <dt className="text-gray-500">{entry.label}</dt>
            <dd className="text-gray-900">{entry.value}</dd>
          </div>
        ))}
      </dl>

      {item.sourceUrl ? (
        <p className="pt-2 text-sm">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-blue-600 underline"
          >
            {item.sourceUrl}
          </a>
        </p>
      ) : null}

      {/*
        본문만 스크롤한다. 페이지를 통째로 스크롤하면 W/S 를 누를 때 제목과 허용·반려 버튼이
        화면 밖으로 나가고, 무엇을 처리하는 중인지 놓친다.
      */}
      <div
        ref={bodyRef}
        tabIndex={-1}
        className="mt-4 max-h-[52vh] overflow-y-auto rounded-md border border-gray-200 p-4"
      >
        {item.sections.length === 0 ? (
          <p className="text-sm text-gray-400">본문이 비어 있습니다.</p>
        ) : (
          item.sections.map((section) => (
            <section key={section.label} className="pb-4 last:pb-0">
              <h3 className="pb-1 text-sm font-medium text-gray-500">{section.label}</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-900">{section.body}</p>
            </section>
          ))
        )}
      </div>
    </Card>
  );
}
