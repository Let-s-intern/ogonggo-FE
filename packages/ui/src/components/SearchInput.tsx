'use client';

/*
 * 지우기 버튼이 값이 있을 때만 나와야 해서 상태를 들고 있다. 클라이언트 경계다.
 *
 * `apps/web` 은 서버 컴포넌트가 기본이고, 서버 컴포넌트가 `@ogonggo/ui` 에서 무엇 하나만
 * 가져와도 배럴(`index.ts`)을 통해 이 파일이 딸려 들어온다. 이 줄이 없으면 그 순간 빌드가
 * 깨진다 — `Toggle.tsx` 주석에 같은 이야기가 있다.
 */
import { type InputHTMLAttributes, forwardRef, useRef, useState } from 'react';
import { cn } from '../lib/cn';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 지우기 버튼의 접근 이름. 화면에 글자가 없으므로 필요하다. */
  clearLabel?: string;
  /** 지우기를 누른 뒤. 검색 폼을 바로 제출하고 싶을 때 쓴다. */
  onClear?: () => void;
  /** 바깥 상자에 붙는 클래스. 폭은 여기서 정한다 — 입력은 상자를 가득 채운다. */
  wrapperClassName?: string;
}

/**
 * 알약 모양 검색 입력(`docs/asset/v3-1/search/`). 왼쪽에 돋보기, 값이 있으면 오른쪽에
 * 지우기 버튼이 붙는다.
 *
 * 에셋 세 장은 상태가 아니라 한 컨트롤의 세 장면이다 — 기본(짧은 알약), 포커스(플레이스홀더),
 * 입력 중(값 + 지우기 버튼). 세 장의 테두리가 전부 `#E5E7EB` 로 같아서 **포커스에 파란 테두리가
 * 없다.** 폭이 다른 것은 상태가 아니라 쓰는 자리가 정하는 것이라 `wrapperClassName` 에 맡긴다.
 *
 * 값을 리액트 상태로 들지 않는다. 쓰는 자리가 자바스크립트 없는 `<form method="GET">` 이라
 * `defaultValue` 로 서버가 그린 값이 그대로 제출돼야 한다. 여기서 아는 것은 "지금 비었는가"
 * 하나뿐이고, 지우기는 DOM 의 값을 직접 비운다.
 *
 * | 자리 | 에셋에서 읽은 값 |
 * |---|---|
 * | 상자 | 높이 36px, 테두리 `#E5E7EB` 1px, `rounded-full`, 흰 바탕 |
 * | 돋보기 | 왼쪽에서 16px, 20x20, `#9CA3AF` |
 * | 글자 | 왼쪽에서 40px, 14px, 값 `#1F2937` / 플레이스홀더 `#9CA3AF` |
 * | 지우기 | 오른쪽에서 16px, 20x20, `#9CA3AF` |
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      wrapperClassName,
      clearLabel = '검색어 지우기',
      onClear,
      defaultValue,
      onInput,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [filled, setFilled] = useState(() => String(defaultValue ?? '').length > 0);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <span
          aria-hidden="true"
          className="icon-[lucide--search] pointer-events-none absolute top-1/2 left-4 block h-5 w-5 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type="search"
          defaultValue={defaultValue}
          onInput={(event) => {
            setFilled(event.currentTarget.value.length > 0);
            onInput?.(event);
          }}
          className={cn(
            'h-9 w-full rounded-full border border-gray-200 bg-white pl-10 text-sm text-gray-800',
            'placeholder:text-gray-400 focus:outline-none',
            /* 브라우저가 붙이는 `search` 기본 지우기 아이콘. 우리 것과 둘이 겹친다. */
            '[&::-webkit-search-cancel-button]:hidden',
            filled ? 'pr-10' : 'pr-4',
            className,
          )}
          {...props}
        />
        {filled ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={() => {
              const node = inputRef.current;
              if (node) {
                node.value = '';
                node.focus();
              }
              setFilled(false);
              onClear?.();
            }}
            className="absolute top-1/2 right-4 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-gray-400"
          >
            <span aria-hidden="true" className="icon-[lucide--circle-x] block h-5 w-5" />
          </button>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
