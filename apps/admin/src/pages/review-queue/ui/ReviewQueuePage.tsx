import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Callout, Card, CardTitle, EmptyState, Textarea } from '@ogonggo/ui';
import {
  useDecideReview,
  useReviewQueue,
  useUndoReview,
  type ReviewQueueItem,
} from '@/entities/review/api/useReviewQueue';
import { PageHeader } from '@/widgets/page-header';
import { formatDateTime } from '@/shared/lib/format';
import { useRejectFormShortcuts, useReviewShortcuts } from './useReviewShortcuts';

/** 한 번에 스크롤할 거리(px). 한 화면을 통째로 넘기지 않아 읽던 자리를 잃지 않는다. */
const SCROLL_STEP = 240;

interface HandledItem {
  item: ReviewQueueItem;
  decision: 'APPROVED' | 'REJECTED';
}

/**
 * 검수 대기 큐. 키보드로 한 건씩 넘기며 처리하는 화면이다.
 *
 * 목록이 아니라 한 건씩 보여준다. 표에서 행을 열고 닫으며 수십 건을 처리하면 클릭이 건당
 * 네 번이고, 그 흐름으로는 밀린 큐가 줄지 않는다.
 *
 * 대상은 비즈니스 회원이 올린 채용공고와 부트캠프뿐이다. 크롤러 수집분은 우리가 고른
 * 사이트에서 긁어온 것이라 한 건씩 통과시킬 대상이 아니다.
 *
 * 처리한 건을 목록에서 바로 빼지 않는다. 서버에서 다시 받아 배열이 통째로 바뀌면 보고 있던
 * 위치가 흔들린다. 화면이 인덱스를 직접 한 칸 옮기고, 처리한 건은 회색으로 남겨 A 로 되짚어
 * 갈 수 있게 한다.
 */
export function ReviewQueuePage() {
  const { data, isPending, isError } = useReviewQueue();
  const decideMutation = useDecideReview();
  const undoMutation = useUndoReview();

  const [index, setIndex] = useState(0);
  const [handled, setHandled] = useState<Map<string, HandledItem>>(new Map());
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  /** 마지막으로 처리한 건. 되돌리기 안내에 쓴다. */
  const [lastHandled, setLastHandled] = useState<HandledItem | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const queue = useMemo(() => data ?? [], [data]);
  const current = queue[index];
  const keyOf = (item: ReviewQueueItem) => `${item.type}:${item.id}`;
  const currentDecision = current ? handled.get(keyOf(current))?.decision : undefined;

  // 다른 건으로 넘어가면 본문을 맨 위로 돌린다. 앞 건에서 아래까지 읽고 넘어왔는데 다음 건이
  // 중간부터 보이면 첫 문단을 놓친다.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    setIsRejecting(false);
    setReason('');
  }, [index]);

  useEffect(() => {
    if (isRejecting) {
      reasonRef.current?.focus();
    }
  }, [isRejecting]);

  const move = useCallback(
    (delta: number) => {
      setIndex((previous) => {
        const next = previous + delta;
        if (next < 0 || next >= queue.length) {
          return previous;
        }
        return next;
      });
    },
    [queue.length],
  );

  /**
   * 즉시 스크롤한다. `behavior: 'smooth'` 로 두면 W/S 를 연달아 눌렀을 때 앞선 애니메이션이
   * 취소되면서 마지막 한 번만, 그것도 도중까지만 움직인다 — 세 번 눌러 5px 가 갔다.
   * 키보드 스크롤은 누른 만큼 즉시 가는 편이 예측도 쉽다.
   */
  const scrollBy = useCallback((amount: number) => {
    bodyRef.current?.scrollBy({ top: amount, behavior: 'auto' });
  }, []);

  const decide = useCallback(
    (decision: 'APPROVED' | 'REJECTED', rejectReason?: string) => {
      if (!current || decideMutation.isPending) {
        return;
      }
      const entry: HandledItem = { item: current, decision };
      decideMutation.mutate(
        { type: current.type, id: current.id, decision, reason: rejectReason },
        {
          onSuccess: () => {
            setHandled((previous) => new Map(previous).set(keyOf(current), entry));
            setLastHandled(entry);
            setIsRejecting(false);
            setReason('');
            move(1);
          },
        },
      );
    },
    [current, decideMutation, move],
  );

  const approve = useCallback(() => decide('APPROVED'), [decide]);

  const openReject = useCallback(() => {
    if (current) {
      setIsRejecting(true);
    }
  }, [current]);

  const submitReject = useCallback(() => {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      return;
    }
    decide('REJECTED', trimmed);
  }, [decide, reason]);

  const cancelReject = useCallback(() => {
    setIsRejecting(false);
    setReason('');
  }, []);

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

  useReviewShortcuts({ enabled: !isRejecting, handlers });
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

  const remaining = queue.length - handled.size;

  return (
    <>
      <PageHeader title="검수 대기" />

      <ShortcutLegend />

      <div className="flex items-center justify-between pt-4 pb-3">
        <p className="text-sm text-gray-500">
          {index + 1} / {queue.length} · 남은 {remaining}건
        </p>
        {lastHandled ? (
          <button
            type="button"
            className="text-sm text-blue-600 underline disabled:text-gray-300"
            disabled={undoMutation.isPending}
            onClick={() => {
              undoMutation.mutate(
                { type: lastHandled.item.type, id: lastHandled.item.id },
                {
                  onSuccess: () => {
                    setHandled((previous) => {
                      const next = new Map(previous);
                      next.delete(keyOf(lastHandled.item));
                      return next;
                    });
                    setLastHandled(null);
                    const position = queue.findIndex(
                      (entry) => keyOf(entry) === keyOf(lastHandled.item),
                    );
                    if (position >= 0) {
                      setIndex(position);
                    }
                  },
                },
              );
            }}
          >
            방금 {lastHandled.decision === 'APPROVED' ? '허용' : '반려'}한 「
            {lastHandled.item.title}」 되돌리기
          </button>
        ) : null}
      </div>

      {decideMutation.isError ? (
        <Callout tone="error" className="mb-3">
          처리하지 못했습니다. 다시 시도해 주세요.
        </Callout>
      ) : null}

      {current ? (
        <ReviewCard
          item={current}
          decision={currentDecision}
          bodyRef={bodyRef}
          isSubmitting={decideMutation.isPending}
          onApprove={approve}
          onRejectOpen={openReject}
        />
      ) : null}

      {isRejecting && current ? (
        <Card className="mt-4 border-red-200">
          <CardTitle>반려 사유</CardTitle>
          <p className="pt-1 text-sm text-gray-500">
            올린 회원에게 전달됩니다. 무엇을 고쳐야 하는지 적어 주세요.
          </p>
          <div className="pt-3">
            <Textarea
              ref={reasonRef}
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예) 급여 조건이 비어 있습니다. 채우고 다시 등록해 주세요."
            />
            <div className="flex items-center gap-2 pt-3">
              <Button
                onClick={submitReject}
                disabled={reason.trim().length === 0 || decideMutation.isPending}
              >
                반려 (Ctrl+Enter)
              </Button>
              <Button variant="secondary" onClick={cancelReject}>
                취소 (Esc)
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </>
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
  isSubmitting: boolean;
  onApprove: () => void;
  onRejectOpen: () => void;
}

function ReviewCard({
  item,
  decision,
  bodyRef,
  isSubmitting,
  onApprove,
  onRejectOpen,
}: ReviewCardProps) {
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
          <Button size="sm" onClick={onApprove} disabled={isSubmitting}>
            허용
          </Button>
          <Button size="sm" variant="secondary" onClick={onRejectOpen} disabled={isSubmitting}>
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
