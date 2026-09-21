'use client';

/*
 * 훅을 쓰므로 클라이언트 경계다.
 *
 * `apps/web` 은 Next 서버 컴포넌트가 기본이고, 서버 컴포넌트가 `@ogonggo/ui` 에서 무엇 하나만
 * 가져와도 배럴(`index.ts`)을 통해 이 파일까지 딸려 들어온다. `Modal`·`ActionAlert` 와 같은
 * 이유다.
 *
 * 이 파일은 Next 를 부르지 않는다. 웹은 Next 이고 어드민은 Vite 라 `next/link` 나
 * `useRouter` 를 쓰는 순간 어드민 쪽 빌드가 깨진다. 그래서 `action` 은 링크가 아니라
 * `{ label, onClick }` 이고, 화면 이동은 부르는 쪽이 한다.
 */
import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

export type ToastTone = 'default' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

/** 톤별 기본 표시 시간(ms). 오류는 읽을 것이 더 많아 길다. */
const TONE_DURATION: Record<ToastTone, number> = {
  default: 3000,
  error: 5000,
};

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  /** 오른쪽 글자 버튼. 누른 뒤 무엇을 할지는 부르는 쪽이 정한다. */
  action?: ToastAction;
  /** 자동으로 사라지기까지의 시간(ms). 기본은 톤을 따른다. */
  duration?: number;
  /**
   * 시간이 다 되었을 때 불린다.
   *
   * 주지 않으면 타이머를 걸지 않는다. 스토리처럼 계속 띄워 두고 보는 자리를 위한 것이다.
   */
  onDismiss?: () => void;
  className?: string;
}

/**
 * 화면 아래 가운데에 잠깐 떴다 사라지는 알림. 작은 동작의 부수적인 결과를 알린다.
 *
 * `ActionAlert` 를 쓰지 않는 이유는 무게다. 카드 위 작은 아이콘 하나를 누를 때마다 화면
 * 가운데에 막이 깔리면 목록을 훑던 흐름이 끊긴다. 어드민에는 이것을 쓰지 않는다 — 운영자가
 * 놓치면 안 되는 결과는 화면에 남는 `Callout` 이다.
 *
 * 닫기 버튼은 없다. 몇 초면 사라지고, 누를 것이 늘면 `action` 버튼과 헷갈린다.
 *
 * 마우스를 올리거나 안의 버튼에 초점이 있는 동안에는 타이머가 멈춘다. 읽는 중에, 또는 `보기`
 * 를 누르려고 다가가는 중에 사라지면 안 된다.
 *
 * 이 컴포넌트는 `aria-live` 영역을 스스로 만들지 않는다. 영역은 `ToastProvider` 가 토스트가
 * 없을 때도 그려 둔다 — 뜰 때 영역까지 새로 만들면 스크린 리더가 읽지 않는다.
 */
export function Toast({
  message,
  tone = 'default',
  action,
  duration,
  onDismiss,
  className,
}: ToastProps) {
  const [paused, setPaused] = useState(false);
  const ms = duration ?? TONE_DURATION[tone];

  useEffect(() => {
    if (!onDismiss || paused) {
      return;
    }
    const timer = setTimeout(onDismiss, ms);
    return () => clearTimeout(timer);
  }, [onDismiss, paused, ms]);

  return (
    <div
      /*
       * 초점과 마우스 둘 다 본다. `onFocus`/`onBlur` 는 리액트에서 자식의 것까지 올라오므로
       * 안의 `action` 버튼에 초점이 가면 여기서 잡힌다.
       */
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'animate-toast-in pointer-events-auto flex max-w-md items-start gap-3',
        'rounded-md bg-gray-900 px-4 py-3 text-sm text-white',
        'shadow-[0_12px_32px_-8px_rgba(17,24,39,0.45)]',
        className,
      )}
    >
      <p className="line-clamp-2 min-w-0 flex-1">
        {tone === 'error' ? (
          /*
           * 오류를 바탕색으로 구분하지 않는다. 색만으로 구분하면 색을 구분하지 못하는
           * 사람에게는 같은 알림이다(`ActionAlert` 의 `ToneMark` 와 같은 이유).
           *
           * 문구와 같은 줄에 두어야 두 줄 말줄임이 아이콘까지 포함해 접힌다.
           */
          <span
            aria-hidden="true"
            className="icon-[lucide--triangle-alert] mr-1.5 inline-block size-4 align-text-bottom"
          />
        ) : null}
        {message}
      </p>

      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 font-semibold text-blue-300 hover:text-blue-200"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
