'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createServiceFeedback } from '@ogonggo/api';
import { Button, Textarea, useToast } from '@ogonggo/ui';

/** 백엔드가 문항마다 받는 최대 글자 수(`POST /api/v1/service-feedbacks`). */
const MAX_LENGTH = 1000;

const QUESTIONS = [
  { name: 'satisfaction', label: '이용 중 어떤 점이 가장 만족스러우신가요?' },
  { name: 'improvement', label: '아쉬운 점이나 개선됐으면 하는 점이 있다면 자유롭게 적어주세요' },
] as const;

type Answers = Record<(typeof QUESTIONS)[number]['name'], string>;

const EMPTY: Answers = { satisfaction: '', improvement: '' };

/**
 * 화면 오른쪽 아래에 떠 있는 `의견 보내기` 버튼. 누르면 서비스 개선 의견 두 문항을 적는 창이 뜬다.
 *
 * 로그인하지 않아도 보낼 수 있다. 로그인했으면 `httpClient` 가 토큰을 실어 백엔드가 작성자를 함께
 * 남긴다. 두 문항 중 하나 이상이 차야 보내진다 — 공백만 적은 문항은 백엔드가 빈 것으로 본다.
 *
 * 적다가 창을 닫아도 쓴 글은 남는다. 보내는 데 성공했을 때만 비운다.
 *
 * 모바일 공고 상세에는 신청하기 바가 화면 아래에 붙어 있다(`shared/ui/StickyApplyBar.tsx`,
 * `data-sticky-apply-bar`). 그 화면에서는 버튼을 바 위로 올린다.
 *
 * 창은 공유 창(`features/share-posting/ui/SharePostingButton.tsx`)과 같은 틀이다. 모바일은 아래에서
 * 올라오고, 데스크톱은 버튼 바로 위 오른쪽에 붙는다.
 */
export function ServiceFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>(EMPTY);

  return (
    <>
      <button
        type="button"
        aria-label="서비스 개선 의견 보내기"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-100 focus-visible:outline-none max-md:[body:has([data-sticky-apply-bar])_&]:bottom-[calc(8.5rem+env(safe-area-inset-bottom))] md:right-8 md:bottom-8"
      >
        <span aria-hidden="true" className="icon-[lucide--message-square-heart] block h-6 w-6" />
      </button>
      {open ? (
        <FeedbackSheet
          answers={answers}
          onChange={setAnswers}
          onClose={() => setOpen(false)}
          onSent={() => {
            setAnswers(EMPTY);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function FeedbackSheet({
  answers,
  onChange,
  onClose,
  onSent,
}: {
  answers: Answers;
  onChange: (answers: Answers) => void;
  onClose: () => void;
  onSent: () => void;
}) {
  const toast = useToast();
  const titleId = useId();
  const firstRef = useRef<HTMLTextAreaElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    firstRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const satisfaction = answers.satisfaction.trim();
  const improvement = answers.improvement.trim();
  const empty = satisfaction === '' && improvement === '';

  const send = async () => {
    setSending(true);
    try {
      await createServiceFeedback({
        satisfaction: satisfaction || undefined,
        improvement: improvement || undefined,
      });
      toast.show({ message: '소중한 의견 감사합니다. 더 나은 오공고를 만드는 데 쓸게요.' });
      onSent();
    } catch {
      toast.show({ message: '의견을 보내지 못했어요. 잠시 후 다시 시도해 주세요.', tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-gray-950/50 md:justify-end md:p-8 md:pb-28"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(event) => {
          event.preventDefault();
          if (!empty && !sending) void send();
        }}
        className="flex max-h-[90vh] w-full flex-col gap-5 overflow-y-auto rounded-t-3xl bg-white px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:w-[400px] md:rounded-3xl md:pb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              오공고에 의견 보내기
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              남겨 주신 의견은 서비스를 고치는 데 씁니다.
            </p>
          </div>
          <button
            type="button"
            aria-label="의견 보내기 닫기"
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
          </button>
        </div>

        {QUESTIONS.map(({ name, label }, index) => (
          <label key={name} className="flex flex-col gap-2">
            <span className="text-sm font-semibold break-keep text-gray-900">{label}</span>
            <Textarea
              ref={index === 0 ? firstRef : undefined}
              name={name}
              rows={4}
              maxLength={MAX_LENGTH}
              value={answers[name]}
              onChange={(event) => onChange({ ...answers, [name]: event.target.value })}
              className="resize-none"
            />
            <span className="self-end text-xs text-gray-400">
              {answers[name].length}/{MAX_LENGTH}
            </span>
          </label>
        ))}

        <Button type="submit" disabled={empty || sending} className="w-full">
          {sending ? '보내는 중' : '의견 보내기'}
        </Button>
        {empty ? (
          <p className="-mt-3 text-center text-xs text-gray-400">
            두 문항 중 하나만 적어도 보낼 수 있어요.
          </p>
        ) : null}
      </form>
    </div>
  );
}
