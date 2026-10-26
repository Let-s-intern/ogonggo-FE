'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@ogonggo/ui';
import { BellIcon } from '@/shared/ui/icons';
import { useUnreadCount } from '../model/useNotifications';
import { NotificationList } from './NotificationList';
import { ReadAllButton } from './ReadAllButton';
import { UnreadBadge, bellLabel } from './UnreadBadge';

export interface NotificationBellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 데스크톱 헤더 맨 위 띠 오른쪽 끝의 알림 아이콘과 드롭다운 패널. 로그인했을 때만 그린다 — 그 판단은 쓰는 쪽
 * (`widgets/site-header`)이 한다.
 *
 * 여닫기는 `widgets/site-header/ui/AccountMenu.tsx` 와 같다(바깥을 누르거나 Esc 로 닫힘). 열림 상태는 쓰는 쪽이 들고
 * 있어 `{이름} 님` 메뉴와 한 번에 하나만 열린다. Esc 로 닫으면 아이콘으로 포커스를 돌린다.
 *
 * 패널은 폭 380px, 높이는 화면의 70% 까지이고 안에서 스크롤한다. 목록은 열 때 새로 그려지므로 열 때마다 다시
 * 받는다(`NotificationList`). 한 줄을 누르면 닫힌다.
 */
export function NotificationBell({ open, onOpenChange }: NotificationBellProps) {
  const count = useUnreadCount();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={bellLabel(count)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
          open ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
        )}
      >
        <BellIcon className="h-5 w-5" />
        <UnreadBadge count={count} className="-top-0.5 -right-1" />
      </button>
      {open ? (
        <section
          id={panelId}
          aria-label="알림"
          className="absolute top-full right-0 z-30 mt-1.5 flex max-h-[70vh] w-[380px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white whitespace-normal shadow-[0_12px_32px_rgba(17,24,39,0.14)]"
        >
          <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-3">
            <h2 className="text-base font-bold text-gray-900">알림</h2>
            <ReadAllButton className="py-1.5 text-[13px]" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* 닫기를 한 박자 늦춘다. 클릭 처리 중에 패널을 지우면 새 탭으로 여는 `a` 가 문서에서 떨어져 열리지 않는다
                — 브라우저는 연결이 끊긴 링크를 따라가지 않는다. */}
            <NotificationList
              layout="panel"
              onNavigate={() => window.setTimeout(() => onOpenChange(false))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
