'use client';

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';
import { SIGN_UP_INPUT_CLASS, SignUpField } from './SignUpField';

/** 목록 최대 높이(px). 산업 12개가 다 들어가지 않아 스크롤된다. 위로 펼칠지 정할 때도 쓴다. */
const PANEL_MAX_HEIGHT = 288;

export interface SignUpSelectProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

/**
 * 가입 화면의 드롭다운. 네이티브 `select` 는 펼친 목록을 OS 가 그려 사이트 디자인과 맞지 않아(2026-10-29, 사용자)
 * 직접 그린다. 닫힌 칸은 옆 입력칸과 같은 높이·테두리·초점 링이고, 사이트 공통 규칙대로 고르기 전에는 회색 안내
 * 문구, 고른 뒤에는 값을 파랗게 보인다. 모두 필수 칸이다.
 *
 * WAI-ARIA 선택 전용 콤보박스 모양이다 — 초점은 버튼에 두고 `aria-activedescendant` 로 강조된 줄을 알린다.
 * 키보드: 아래·위 화살표·엔터·스페이스로 열고, 열린 뒤 화살표·Home·End 로 옮겨 엔터·스페이스로 고른다.
 * Esc 는 닫기만, Tab 은 닫고 다음 칸으로 간다. 바깥을 누르면 닫는다.
 *
 * 화면 아래쪽에서 열면 목록이 잘리므로, 아래 공간이 목록보다 좁고 위가 더 넓으면 위로 펼친다.
 */
export function SignUpSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
}: SignUpSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  /** 강조된 줄. -1 은 아무 줄도 아님. */
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const optionId = (index: number) => `${listId}-option-${index}`;

  const openList = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < PANEL_MAX_HEIGHT && rect.top > below);
    }
    setActiveIndex(index);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) {
      onChange(option.value);
    }
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // 키보드로 옮긴 줄이 목록 밖이면 보이게 스크롤한다. 열 때는 고른 값이 보이게 된다.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        // 목록에서 고르는 엔터는 폼 제출이 아니다.
        event.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  return (
    <SignUpField label={label} htmlFor={id} required>
      <div ref={rootRef} className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          onClick={() => (open ? close() : openList())}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full cursor-pointer items-center justify-between gap-3 border bg-white pr-3.5 pl-4 text-left text-base transition-colors',
            'focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100',
            open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400',
            SIGN_UP_INPUT_CLASS,
          )}
        >
          <span
            className={cn('truncate', selected ? 'font-semibold text-blue-500' : 'text-gray-400')}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronIcon
            direction="down"
            className={cn(
              'size-5 shrink-0 transition-transform duration-150',
              open ? 'rotate-180 text-blue-500' : 'text-gray-500',
            )}
          />
        </button>

        {open ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            style={{ maxHeight: PANEL_MAX_HEIGHT }}
            className={cn(
              'absolute inset-x-0 z-30 overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white p-1.5',
              'shadow-[0_12px_32px_rgba(17,24,39,0.12)]',
              'transition-[opacity,translate] duration-150 starting:opacity-0',
              dropUp
                ? 'bottom-full mb-1.5 starting:translate-y-1'
                : 'top-full mt-1.5 starting:-translate-y-1',
            )}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  // 버튼의 초점을 뺏지 않아야 키보드 조작과 초점 링이 이어진다.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex h-11 cursor-pointer items-center justify-between gap-3 rounded-xs px-3 text-[15px]',
                    isSelected ? 'font-semibold text-blue-500' : 'text-gray-800',
                    index === activeIndex && (isSelected ? 'bg-blue-50' : 'bg-gray-50'),
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'icon-[lucide--check] block size-[18px] shrink-0',
                      !isSelected && 'invisible',
                    )}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </SignUpField>
  );
}
