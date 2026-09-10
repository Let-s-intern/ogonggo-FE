import { useEffect } from 'react';
import { cn } from '../lib/cn';

/**
 * 톤별 색. 카드는 흰 바탕이고 색은 아이콘 원과 얇은 테두리가 진다.
 *
 * 카드 전체를 진한 색으로 칠하지 않는다. 화면 한가운데 뜨는 색 덩어리는 두 번째부터 그냥
 * 시야를 가리는 것이 되고, 안에 든 글자도 대비가 떨어져 읽기 어려워진다.
 */
const TONE = {
  success: {
    badge: 'bg-green-500 text-white',
    glow: 'shadow-[0_0_0_8px_rgba(16,185,129,0.10)]',
    border: 'border-green-100',
  },
  danger: {
    badge: 'bg-red-500 text-white',
    glow: 'shadow-[0_0_0_8px_rgba(239,68,68,0.10)]',
    border: 'border-red-100',
  },
  info: {
    badge: 'bg-blue-500 text-white',
    glow: 'shadow-[0_0_0_8px_rgba(74,118,255,0.10)]',
    border: 'border-blue-100',
  },
} as const;

export type ActionAlertTone = keyof typeof TONE;

export interface ActionAlertProps {
  message: string;
  /** 문구 아래 한 줄. 무엇에 대한 결과인지 같은 것. */
  detail?: string;
  tone?: ActionAlertTone;
  /**
   * 같은 문구를 다시 띄우기 위한 값.
   *
   * 두 건을 잇달아 허용하면 `message` 가 같아 사라지는 타이머가 다시 걸리지 않는다. 처리한
   * 대상의 id 나 시각을 넘긴다.
   */
  nonce?: string | number;
  /**
   * 자동으로 사라지기까지의 시간(ms).
   *
   * 짧게 잡는다. 키로 연달아 처리하는 화면에서는 다음 건을 보려는데 알림이 아직 떠 있는 것이
   * 그 자체로 방해다. 읽어야 할 글은 두 줄뿐이라 이 정도면 충분하다.
   */
  duration?: number;
  onDismiss: () => void;
}

/**
 * 방금 한 일을 알리는 알림. 화면 한가운데에 잠깐 떴다 사라진다.
 *
 * **브라우저 `alert()` 를 쓰지 않는다.** `alert` 은 확인을 누를 때까지 페이지를 멈춰 세운다.
 * 키를 눌러 한 건씩 넘기는 화면에서는 허용할 때마다 Enter 를 한 번 더 눌러야 하고, 스무 건을
 * 처리하면 키 입력이 두 배가 된다 — 그 화면을 만든 이유가 사라진다.
 *
 * 가운데에 두고 뒤에 옅은 막을 깐다. 구석에 뜨는 알림은 화면 가운데를 보고 있는 사람 눈에
 * 들어오지 않는다. 막은 아주 옅어서 뒤 내용을 가리지 않고, 색이 아니라 대비로 알림을 띄운다.
 *
 * 전체가 `pointer-events-none` 이다. 알림이 떠 있는 동안에도 마우스와 키보드는 그대로 통한다 —
 * 이 알림은 확인을 요구하지 않는다.
 *
 * `role="status"` 다. `alert` 이 아닌 이유는 오류가 아니라 방금 한 일의 확인이기 때문이고,
 * 스크린 리더가 하던 말을 끊지 않고 이어서 읽는다.
 */
export function ActionAlert({
  message,
  detail,
  tone = 'success',
  nonce,
  duration = 900,
  onDismiss,
}: ActionAlertProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, nonce, duration, onDismiss]);

  const palette = TONE[tone];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="animate-scrim-in absolute inset-0 bg-gray-950/15" />

      <div
        role="status"
        className={cn(
          'animate-alert-in relative flex min-w-[20rem] max-w-[28rem] flex-col items-center',
          'rounded-xl border bg-white px-10 py-8 text-center',
          'shadow-[0_24px_48px_-12px_rgba(17,24,39,0.25)]',
          palette.border,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-14 items-center justify-center rounded-full',
            palette.badge,
            palette.glow,
          )}
        >
          <ToneMark tone={tone} />
        </span>

        <p className="pt-5 text-lg font-bold tracking-tight text-gray-900">{message}</p>
        {detail ? <p className="line-clamp-2 pt-1.5 text-sm text-gray-500">{detail}</p> : null}
      </div>
    </div>
  );
}

/** 톤을 한눈에 구분하는 표시. 색만으로 구분하지 않기 위한 두 번째 신호다. */
function ToneMark({ tone }: { tone: ActionAlertTone }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (tone === 'danger') {
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    );
  }
  if (tone === 'info') {
    return (
      <svg {...common}>
        <path d="M12 11v6M12 7.5h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
