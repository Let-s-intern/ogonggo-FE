'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createServiceFeedback } from '@ogonggo/api';
import { Button, Textarea, cn, useToast } from '@ogonggo/ui';
import {
  markFeedbackSent,
  recordJobViewAndCheckPrompt,
  snoozePromptForDay,
  snoozePromptForHour,
} from '../model/prompt';

/** 백엔드가 문항마다 받는 최대 글자 수(`POST /api/v1/service-feedbacks`). */
const MAX_LENGTH = 1000;

const QUESTIONS = [
  { name: 'satisfaction', label: '이용 중 어떤 점이 가장 만족스러우신가요?' },
  { name: 'improvement', label: '아쉬운 점이나 개선됐으면 하는 점이 있다면 자유롭게 적어주세요' },
] as const;

type Answers = Record<(typeof QUESTIONS)[number]['name'], string>;

const EMPTY: Answers = { satisfaction: '', improvement: '' };

const OPEN_EVENT = 'ogonggo:open-service-feedback';

/**
 * 의견 작성 창을 연다. 로그인해 하단 내비게이션이 떠 있으면 플로팅 버튼은 숨고(아래 `FloatingButton`),
 * 내비게이션의 서브 메뉴가 이것을 불러 창을 연다. 창을 가진 `ServiceFeedbackButton` 은 사이트 레이아웃에
 * 늘 붙어 있어 이벤트 하나로 충분하다.
 */
export function openServiceFeedback() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * 모바일에서 화면 아래에 붙는 것들 위로 올린다. 공고 상세의 신청하기 바(`data-sticky-apply-bar`)와,
 * 로그인했을 때의 하단 내비게이션(`data-bottom-nav`, 떠 있는 동그라미까지 약 84px)이다. 둘은 같은
 * 화면에 함께 나오지 않는다 — 내비게이션은 상세 화면에서 물러난다.
 */
const ABOVE_STICKY_BAR = cn(
  'max-md:[body:has([data-sticky-apply-bar])_&]:bottom-[calc(8.5rem+env(safe-area-inset-bottom))]',
  'max-md:[body:has([data-bottom-nav])_&]:bottom-[calc(6rem+env(safe-area-inset-bottom))]',
);

/** 공고 상세 주소. 달력에서 여는 상세 모달도 같은 주소라 함께 센다. */
const JOB_DETAIL_PATH = /^\/jobs\/\d+$/;

/** 공고 상세에 들어와 바로 띄우면 본문을 보기도 전에 가린다. 조금 읽은 뒤에 올린다. */
const PROMPT_DELAY_MS = 2500;

/**
 * 화면 오른쪽 아래에 떠 있는 `의견 보내기` 버튼. 누르면 서비스 개선 의견 두 문항을 적는 창이 뜬다.
 * 버튼 왼쪽 위에 말풍선(`FloatingButton`)을 띄워 무엇을 하는 버튼인지 아이콘만으로 짐작하지 않아도
 * 되게 한다.
 *
 * 채용공고 상세를 몇 번 본 사람에게는 가끔 화면 아래에 의견을 요청하는 창을 띄운다
 * (`model/prompt.ts` 가 언제 띄울지 정한다). 거기서 `의견 남기기` 를 누르면 같은 작성 창이 열린다.
 *
 * 로그인하지 않아도 보낼 수 있다. 로그인했으면 `httpClient` 가 토큰을 실어 백엔드가 작성자를 함께
 * 남긴다. 두 문항 중 하나 이상이 차야 보내진다 — 공백만 적은 문항은 백엔드가 빈 것으로 본다.
 *
 * 적다가 창을 닫아도 쓴 글은 남는다. 보내는 데 성공했을 때만 비운다.
 *
 * 창은 공유 창(`features/share-posting/ui/SharePostingButton.tsx`)과 같은 틀이다. 모바일은 아래에서
 * 올라오고, 데스크톱은 버튼 바로 위 오른쪽에 붙는다.
 */
export function ServiceFeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const [answers, setAnswers] = useState<Answers>(EMPTY);

  // 다른 곳(하단 내비게이션의 서브 메뉴)에서 작성 창을 열 수 있게 한다(`openServiceFeedback`).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // 한 번 본 주소는 한 번만 센다. 개발 모드의 StrictMode 는 효과를 두 번 돌리는데, 그때마다 세면
  // 한 번 방문이 두 번으로 세이고 띄우기로 한 판정도 두 번째 실행에서 사라진다.
  const viewRef = useRef<{ pathname: string; prompt: boolean } | undefined>(undefined);

  useEffect(() => {
    if (!JOB_DETAIL_PATH.test(pathname)) {
      return;
    }
    if (viewRef.current?.pathname !== pathname) {
      viewRef.current = { pathname, prompt: recordJobViewAndCheckPrompt() };
    }
    if (!viewRef.current.prompt) {
      return;
    }
    const timer = window.setTimeout(() => setPrompting(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {prompting ? null : <FloatingButton onClick={() => setOpen(true)} />}
      {prompting ? (
        <FeedbackPrompt
          onAccept={() => {
            setPrompting(false);
            setOpen(true);
          }}
          onClose={() => {
            snoozePromptForHour();
            setPrompting(false);
          }}
          onSnoozeDay={() => {
            snoozePromptForDay();
            setPrompting(false);
          }}
        />
      ) : null}
      {open ? (
        <FeedbackSheet
          answers={answers}
          onChange={setAnswers}
          onClose={() => setOpen(false)}
          onSent={() => {
            markFeedbackSent();
            setAnswers(EMPTY);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

/**
 * 버튼 위 말풍선에 차례로 보일 문구와, 그때 버튼에 보일 아이콘. 아이콘 클래스는 이렇게 글자 그대로
 * 적어야 한다 — Iconify 플러그인이 소스의 이 문자열을 찾아 그린다(`packages/ui/src/styles/tokens.css`).
 */
const BUBBLE_MESSAGES = [
  { text: '오공고, 써 보니 어떠셨나요?', icon: 'icon-[lucide--smile-plus]' },
  { text: '원하시는 기능이 있으신가요?', icon: 'icon-[lucide--lightbulb]' },
  { text: '불편하셨던 점도 편하게 알려 주세요', icon: 'icon-[lucide--message-circle-more]' },
  { text: '한 줄 의견도 저희에겐 큰 힘이 돼요', icon: 'icon-[lucide--heart]' },
  { text: '언제나 여러분을 위해 노력하는 오공고가 될게요', icon: 'icon-[lucide--hand-heart]' },
] as const;
/** 한 문구가 보이는 시간. */
const BUBBLE_HOLD_MS = 6000;
/** 사라졌다 나타나는 전환 시간. `duration-700` 과 맞춘다. */
const BUBBLE_FADE_MS = 700;

/**
 * 오른쪽 아래 둥근 버튼과 그 왼쪽 위 대각선의 말풍선. 오른쪽 아래에서 버튼 쪽으로 휘어 내려가는 꼬리를
 * 달아 버튼이 말하는 것처럼 보이게 한다. 버튼 바로 옆에 붙이면 버튼과 한 덩어리처럼 보여 답답했다.
 *
 * 문구는 몇 초마다 서서히 사라졌다가 다음 문구로 바뀌어 나타나고, 버튼 아이콘도 같은 순간에 그 문구에
 * 맞는 것으로 바뀐다. 모션 줄이기를 켠 사람에게는 페이드 없이 바뀌기만 한다(`motion-safe`). 스크린
 * 리더에는 버튼 이름(`aria-label`)만 읽히도록 말풍선은 숨긴다 — 바뀔 때마다 다시 읽히면 방해가 된다.
 */
function FloatingButton({ onClick }: { onClick: () => void }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fade: number | undefined;
    const hold = window.setInterval(() => {
      setVisible(false);
      fade = window.setTimeout(() => {
        setIndex((current) => (current + 1) % BUBBLE_MESSAGES.length);
        setVisible(true);
      }, BUBBLE_FADE_MS);
    }, BUBBLE_HOLD_MS + BUBBLE_FADE_MS);
    return () => {
      window.clearInterval(hold);
      window.clearTimeout(fade);
    };
  }, []);

  const { text, icon } = BUBBLE_MESSAGES[index] ?? BUBBLE_MESSAGES[0];
  const fadeClass = cn(
    'motion-safe:transition motion-safe:duration-700',
    visible ? 'opacity-100' : 'opacity-0',
  );

  return (
    <button
      type="button"
      aria-label="서비스 개선 의견 보내기"
      aria-haspopup="dialog"
      onClick={onClick}
      className={cn(
        'group fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 focus-visible:outline-none md:right-8 md:bottom-8',
        ABOVE_STICKY_BAR,
        // 하단 내비게이션이 떠 있으면(모바일 로그인) 탭을 가리므로 숨긴다. 그때는 마이페이지 탭의
        // 서브 메뉴 `의견 보내기` 가 이 창을 연다(`openServiceFeedback`).
        'max-md:[body:has([data-bottom-nav])_&]:hidden',
      )}
    >
      {/* 그림자는 `box-shadow` 가 아니라 `drop-shadow` 로 바깥 한 겹에 건다. 몸통과 꼬리가 따로
          그림자를 가지면 둘이 겹치는 자리에 선이 생겨 한 덩어리로 보이지 않는다. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute right-12 bottom-12 drop-shadow-[0_4px_10px_rgba(17,24,39,0.12)]',
          fadeClass,
        )}
      >
        <span className="block rounded-2xl bg-white px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-gray-700 group-hover:text-blue-500 md:text-sm">
          {text}
        </span>
        {/* 꼬리. 오른쪽 아래 버튼 쪽으로 휘어 내려가는 삼각형이다. 몸통 아래 변에 1px 겹쳐 틈을 없앤다. */}
        <svg
          viewBox="0 0 18 14"
          className="absolute right-2 -bottom-[13px] h-3.5 w-[18px] fill-white"
        >
          <path d="M0 0H14C14 6 15.5 10.5 18 14C11 12.5 5 8 0 0Z" />
        </svg>
      </span>
      <span className="relative flex size-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition group-hover:bg-blue-600 group-focus-visible:ring-4 group-focus-visible:ring-blue-100">
        <span
          aria-hidden="true"
          className={cn(icon, 'block h-5 w-5', fadeClass, visible ? 'scale-100' : 'scale-75')}
        />
      </span>
    </button>
  );
}

/**
 * 화면 아래에서 올라오는 의견 요청 창. 뒤 화면을 막지 않는다 — 공고를 계속 읽다가 무시해도 된다.
 * 모바일은 좌우 끝까지, 데스크톱은 가운데에 좁게 뜬다. 닫기(X)는 1시간, `하루 동안 보지 않기` 는
 * 하루 동안 다시 띄우지 않는다(`model/prompt.ts`).
 */
function FeedbackPrompt({
  onAccept,
  onClose,
  onSnoozeDay,
}: {
  onAccept: () => void;
  onClose: () => void;
  onSnoozeDay: () => void;
}) {
  const [shown, setShown] = useState(false);

  // 처음 그린 다음 프레임에 올려야 아래에서 올라오는 전환이 보인다.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role="dialog"
      aria-labelledby="service-feedback-prompt-title"
      className={cn(
        'fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-100 transition duration-300 ease-out md:inset-x-auto md:bottom-8 md:left-1/2 md:w-[440px] md:-translate-x-1/2',
        ABOVE_STICKY_BAR,
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <span aria-hidden="true" className="icon-[lucide--smile-plus] block h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="service-feedback-prompt-title" className="font-bold text-gray-900">
            오공고 쓰시면서 어떠셨어요?
          </p>
          <p className="mt-1 text-sm break-keep text-gray-500">
            한 줄이라도 남겨 주시면 더 나은 서비스를 만드는 데 큰 힘이 돼요.
          </p>
        </div>
        <button
          type="button"
          aria-label="의견 요청 닫기"
          onClick={onClose}
          className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onSnoozeDay}>
          하루 동안 보지 않기
        </Button>
        <Button size="sm" onClick={onAccept}>
          의견 남기기
        </Button>
      </div>
    </div>
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
