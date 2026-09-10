import { useId } from 'react';
import { cn } from '../lib/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스위치 오른쪽 글자. 켜짐·꺼짐에 따라 달라질 수 있어 쓰는 쪽이 만들어 넘긴다. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 켜고 끄는 스위치.
 *
 * 안에 진짜 `input[type=checkbox]` 를 둔다. 시각적으로만 스위치처럼 그리고 실제 조작은
 * 체크박스가 받는다 — Tab 으로 초점이 오고, Space 로 토글되고, 스크린 리더가 상태를 읽는
 * 것이 전부 공짜다. `div` 에 `role="switch"` 를 붙여 손으로 만들면 이 셋을 다 다시 짜야 한다.
 *
 * **input 을 스위치 전체에 겹쳐 깐다.** 처음에 `size-0 opacity-0` 으로 숨겼더니 스위치를 눌러도
 * 아무 일이 없었다 — 클릭이 닿는 곳이 없고, 오른쪽 라벨 글자를 눌러야만 토글됐다. 스위치 그림을
 * 누르는 것이 이 컨트롤의 당연한 조작이다.
 *
 * 상태는 `peer` 로 형제에 전달한다. 리액트에서 클래스로 계산해 내리면 키보드로 토글했을 때
 * 리렌더 전까지 그림이 어긋난다.
 */
export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  const id = useId();

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-full bg-gray-300 transition-colors',
            'peer-checked:bg-blue-500',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-100',
            'peer-disabled:bg-gray-200',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm',
            'transition-transform peer-checked:translate-x-5',
          )}
        />
      </span>
      {label ? (
        <label
          htmlFor={id}
          className={cn('cursor-pointer text-sm', disabled ? 'text-gray-400' : 'text-gray-900')}
        >
          {label}
        </label>
      ) : null}
    </span>
  );
}
