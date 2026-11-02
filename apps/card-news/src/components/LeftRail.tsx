'use client';

import type { ReactNode } from 'react';

/** 레일 한 칸과 그 서랍. */
export interface RailItem<K extends string> {
  key: K;
  label: string;
  drawer: ReactNode;
}

/**
 * 왼쪽 레일(72px)과 서랍(300px). 레일을 누르면 그 서랍을 열고, 같은 레일을 다시 누르면 서랍을 닫는다.
 * 닫힌 서랍은 그리지 않는다 — 서랍 안 입력값은 편집 상태에 있어 다시 열어도 그대로다.
 */
export function LeftRail<K extends string>({
  items,
  open,
  onOpenChange,
}: {
  items: RailItem<K>[];
  /** 열린 서랍. `null` 이면 닫혀 있다. */
  open: K | null;
  onOpenChange: (open: K | null) => void;
}) {
  const current = items.find((item) => item.key === open);
  return (
    <>
      <nav
        aria-label="왼쪽 메뉴"
        className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-white py-2"
      >
        {items.map((item) => {
          const on = item.key === open;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={on}
              onClick={() => onOpenChange(on ? null : item.key)}
              className={`flex h-14 w-[60px] items-center justify-center rounded-xl text-xs font-semibold ${
                on ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      {current ? (
        <aside
          aria-label={`${current.label} 서랍`}
          className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white"
        >
          {current.drawer}
        </aside>
      ) : null}
    </>
  );
}

/** 서랍 머리(제목)와 내용 틀. */
export function Drawer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {children}
    </div>
  );
}
