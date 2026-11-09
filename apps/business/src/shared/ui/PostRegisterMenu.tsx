'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';

/** 헤더 `공고등록` 에서 고르는 두 가지. 고르면 그 작성 화면으로 간다. */
export const POST_REGISTER_OPTIONS = [
  {
    href: '/mypage/company/posts/jobs/new',
    label: '채용공고 등록',
    hint: '인턴 · 신입 · 경력 채용',
    icon: 'icon-[lucide--briefcase]',
  },
  {
    href: '/mypage/company/posts/bootcamps/new',
    label: '부트캠프 등록',
    hint: '교육 · 부트캠프 모집',
    icon: 'icon-[lucide--graduation-cap]',
  },
] as const;

export interface PostRegisterMenuProps {
  /** 기업 회원이 아니면 로그인 화면을 거치게 바꾼다(`SiteHeader` 의 `companyHref`). */
  hrefFor: (href: string) => string;
  active: boolean;
}

/**
 * 데스크톱 헤더의 `공고등록`. 바로 이동하지 않고 채용공고·부트캠프 중 무엇을 올릴지 먼저 고르게 한다(2026-11-09
 * 사용자). 여닫는 방식은 `AccountMenu` 와 같다 — 바깥을 누르거나 Esc 를 누르면 닫힌다.
 */
export function PostRegisterMenu({ hrefFor, active }: PostRegisterMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex h-full items-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-full items-center gap-1 border-b-2 text-[15px] font-medium transition-colors',
          active || open
            ? 'border-gray-900 text-gray-900'
            : 'border-transparent text-gray-500 hover:text-gray-900',
        )}
      >
        공고등록
        <span
          aria-hidden="true"
          className={cn(
            'block size-4 shrink-0',
            open ? 'icon-[lucide--chevron-up]' : 'icon-[lucide--chevron-down]',
          )}
        />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 w-60 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          {POST_REGISTER_OPTIONS.map((option) => (
            <li role="none" key={option.href}>
              <Link
                role="menuitem"
                href={hrefFor(option.href)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-gray-50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                  <span aria-hidden="true" className={cn('block size-5', option.icon)} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                  <span className="block text-xs text-gray-500">{option.hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
